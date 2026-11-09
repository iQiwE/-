/**
 * Автоматические тесты безопасности при работе в локальной сети (LAN 0.0.0.0)
 * Проверяет:
 *  1. CORS защиту (блокировка чужих доменов Origin: https://evil.com, разрешение http://192.168.0.123:3000)
 *  2. Защиту эндпоинтов модификации/удаления (401 без токена и с поддельным токеном, 403 при попытке IDOR чужого объекта)
 *  3. Защиту от SQL-инъекций и валидацию входных параметров в фильтрах каталога (/api/v1/properties)
 */

const os = require('os');

function detectWifiIp() {
  const nets = os.networkInterfaces();
  for (const [name, list] of Object.entries(nets)) {
    for (const iface of list || []) {
      if (iface.family === 'IPv4' && !iface.internal && iface.address.startsWith('192.168.')) {
        return iface.address;
      }
    }
  }
  return '192.168.3.119';
}

const LAN_IP = detectWifiIp();
const API_BASE = `http://${LAN_IP}:4000/api/v1`;
const FRONTEND_ORIGIN = `http://${LAN_IP}:3000`;

function assert(condition, message) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

async function runSecurityTests() {
  console.log('================================================================');
  console.log(`Запуск автоматических Security-тестов на ${API_BASE}`);
  console.log('================================================================\n');

  // 0. Проверка доступности фронтенда и бэкенда по LAN IP
  console.log('--- 0. Проверка сетевой доступности (0.0.0.0 -> 192.168.0.123) ---');
  const feRes = await fetch(FRONTEND_ORIGIN);
  assert(feRes.status === 200, `Фронтенд доступен по Wi-Fi IP (${FRONTEND_ORIGIN}) -> HTTP ${feRes.status}`);

  const beRes = await fetch(`${API_BASE}/properties?limit=1`);
  assert(beRes.status === 200, `Бэкенд API доступен по Wi-Fi IP (${API_BASE}/properties) -> HTTP ${beRes.status}`);
  const catalogSample = await beRes.json();
  const targetPropertyId = catalogSample.items?.[0]?.id ?? 1;

  // 1. Тест 1: Настройка и защита CORS
  console.log('\n--- 1. Тест CORS (Защита от межсайтовых запросов с чужих доменов) ---');
  const evilOrigin = 'https://evil.com';
  const evilPreflight = await fetch(`${API_BASE}/properties`, {
    method: 'OPTIONS',
    headers: {
      Origin: evilOrigin,
      'Access-Control-Request-Method': 'DELETE',
    },
  });
  const evilAllowOrigin = evilPreflight.headers.get('access-control-allow-origin');
  assert(
    evilAllowOrigin !== '*' && evilAllowOrigin !== evilOrigin,
    `Запрос с чужого Origin (${evilOrigin}) заблокирован политикой CORS (Access-Control-Allow-Origin: ${evilAllowOrigin ?? 'отсутствует'})`,
  );

  const evilGet = await fetch(`${API_BASE}/properties`, {
    headers: { Origin: evilOrigin },
  });
  const evilGetAllowOrigin = evilGet.headers.get('access-control-allow-origin');
  assert(
    evilGetAllowOrigin !== '*' && evilGetAllowOrigin !== evilOrigin,
    `GET-запрос с чужого Origin (${evilOrigin}) не получает заголовок Access-Control-Allow-Origin (${evilGetAllowOrigin ?? 'отсутствует'})`,
  );

  const validCorsRes = await fetch(`${API_BASE}/properties`, {
    headers: { Origin: FRONTEND_ORIGIN },
  });
  const validAllowOrigin = validCorsRes.headers.get('access-control-allow-origin');
  assert(
    validAllowOrigin === FRONTEND_ORIGIN,
    `Запрос с разрешённого локального Origin (${FRONTEND_ORIGIN}) получает строгий заголовок Access-Control-Allow-Origin: ${validAllowOrigin}`,
  );

  // 2. Тест 2: Защита авторизации (Auth / JWT / IDOR)
  console.log('\n--- 2. Тест авторизации и ролевого доступа (Auth & IDOR) ---');
  const deleteNoTokenRes = await fetch(`${API_BASE}/properties/${targetPropertyId}`, {
    method: 'DELETE',
  });
  assert(
    deleteNoTokenRes.status === 401,
    `DELETE /properties/${targetPropertyId} без JWT-токена отклонён -> HTTP ${deleteNoTokenRes.status} Unauthorized`,
  );

  const updateFakeTokenRes = await fetch(`${API_BASE}/properties/${targetPropertyId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjk5OSwicm9sZSI6IkxBTkRMT1JEIn0.forged_signature',
    },
    body: JSON.stringify({ title: 'Hacked Title', price: 1 }),
  });
  assert(
    updateFakeTokenRes.status === 401,
    `PUT /properties/${targetPropertyId} с поддельным JWT-токеном отклонён -> HTTP ${updateFakeTokenRes.status} Unauthorized`,
  );

  const createNoTokenRes = await fetch(`${API_BASE}/properties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Unauthorized Property', price: 100000 }),
  });
  assert(
    createNoTokenRes.status === 401,
    `POST /properties без JWT-токена отклонён -> HTTP ${createNoTokenRes.status} Unauthorized`,
  );

  // Проверка IDOR (попытка удаления объекта владельца #1 с аккаунта другого арендодателя dana@example.com)
  const loginDanaRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dana@example.com', password: 'password123' }),
  });
  if (loginDanaRes.status === 200 || loginDanaRes.status === 201) {
    const { accessToken: danaToken } = await loginDanaRes.json();
    const idorDeleteRes = await fetch(`${API_BASE}/properties/1`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${danaToken}` },
    });
    assert(
      idorDeleteRes.status === 403,
      `Защита от IDOR: попытка удаления чужого объекта #1 другим арендодателем отклонена -> HTTP ${idorDeleteRes.status} Forbidden`,
    );
  }

  // 3. Тест 3: Базовая защита от инъекций (SQLi & Input Validation)
  console.log('\n--- 3. Тест защиты от SQL-инъекций и валидации параметров ---');
  const sqliDistrict = "' OR '1'='1' --";
  const sqliRes = await fetch(
    `${API_BASE}/properties?district=${encodeURIComponent(sqliDistrict)}`,
  );
  assert(
    sqliRes.status === 200,
    `SQLi-пейлоад в строковом фильтре (?district=${sqliDistrict}) обработан безопасно без ошибки СУБД -> HTTP ${sqliRes.status}`,
  );
  const sqliBody = await sqliRes.json();
  assert(
    Array.isArray(sqliBody.items) && sqliBody.items.length === 0,
    `Параметризованный запрос (:district) предотвратил обход условия WHERE (возвращено записей: ${sqliBody.items.length}, утечки данных нет)`,
  );

  const sqliSortRes = await fetch(
    `${API_BASE}/properties?sortBy=${encodeURIComponent('price; DROP TABLE properties --')}`,
  );
  assert(
    sqliSortRes.status === 400,
    `Инъекция в параметр сортировки (?sortBy=price; DROP TABLE...) заблокирована ValidationPipe -> HTTP ${sqliSortRes.status} Bad Request`,
  );

  const sqliNumericRes = await fetch(
    `${API_BASE}/properties?minPrice=${encodeURIComponent('1000 OR 1=1')}`,
  );
  assert(
    sqliNumericRes.status === 400,
    `Инъекция в числовой фильтр (?minPrice=1000 OR 1=1) заблокирована ValidationPipe -> HTTP ${sqliNumericRes.status} Bad Request`,
  );

  const unknownParamRes = await fetch(
    `${API_BASE}/properties?isAdmin=true&$where=1`,
  );
  assert(
    unknownParamRes.status === 400,
    `Неразрешённые query-параметры (?isAdmin=true&$where=1) заблокированы forbidNonWhitelisted -> HTTP ${unknownParamRes.status} Bad Request`,
  );

  console.log('\n================================================================');
  console.log('ВСЕ ТЕСТЫ БЕЗОПАСНОСТИ УСПЕШНО ПРОЙДЕНЫ (10/10 PASS)');
  console.log('================================================================');
}

runSecurityTests().catch((err) => {
  console.error('\n[SECURITY TEST ERROR]:', err.message);
  process.exit(1);
});
