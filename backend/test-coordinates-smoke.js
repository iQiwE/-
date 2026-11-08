/**
 * Smoke / Integration Test:
 * 1. Авторизуется под арендодателем (POST /api/v1/auth/login)
 * 2. Создаёт квартиру с выбранными на карте координатами (POST /api/v1/properties)
 * 3. Проверяет ответ сервера (latitude, longitude, address.lat, address.lng)
 * 4. Обновляет координаты квартиры через PUT /api/v1/properties/:id
 * 5. Выполняет прямой SELECT-запрос к таблице PROPERTIES в БД и выводит результат в консоль
 */
const assert = require('assert');
const { InMemoryOracleStore } = require('./dist/database/in-memory-oracle.store');

const API_BASE = process.env.API_URL || 'http://localhost:4000/api/v1';

async function runSmokeTest() {
  console.log('==============================================================');
  console.log('🚀 ЗАПУСК ИНТЕГРАЦИОННОГО SMOKE-ТЕСТА КООРДИНАТ (LAT / LNG)');
  console.log('==============================================================\n');

  // 1. Вход под арендодателем
  console.log('1️⃣  Авторизация арендодателя (POST /api/v1/auth/login)...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'landlord@example.com', password: 'demo123' }),
  });
  assert.ok(loginRes.ok, `Ожидался успешный статус (200/201) при входе, получен ${loginRes.status}`);
  const { token, user } = await loginRes.json();
  assert.ok(token, 'JWT-токен должен присутствовать');
  console.log(`   ✅ Успешный вход: ${user.fullName} (ID=${user.id}, role=${user.role})\n`);

  // 2. Создание квартиры с переданными координатами (latitude, longitude)
  const initialLat = 49.961234;
  const initialLng = 82.619876;
  console.log(`2️⃣  Создание квартиры с координатами latitude=${initialLat}, longitude=${initialLng} (POST /api/v1/properties)...`);

  const createPayload = {
    title: 'Тестовая резиденция на набережной (Smoke Test)',
    typeId: 1,
    rooms: 2,
    area: 68,
    monthlyPrice: 225000,
    latitude: initialLat,
    longitude: initialLng,
    petsAllowed: true,
    noDeposit: false,
    fromOwner: true,
    address: {
      city: 'Усть-Каменогорск',
      district: 'Ульбинский',
      street: 'наб. Славского',
      building: '30',
      lat: initialLat,
      lng: initialLng,
    },
  };

  const createRes = await fetch(`${API_BASE}/properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(createPayload),
  });
  assert.strictEqual(createRes.status, 201, `Ожидался статус 201 Created, получен ${createRes.status}`);
  const createdProp = await createRes.json();

  console.log('   📦 Ответ сервера (POST /properties):');
  console.log(
    JSON.stringify(
      {
        id: createdProp.id,
        title: createdProp.title,
        latitude: createdProp.latitude,
        longitude: createdProp.longitude,
        address: createdProp.address,
      },
      null,
      2,
    ),
  );

  assert.strictEqual(Number(createdProp.latitude), initialLat, 'latitude в ответе POST должен совпадать');
  assert.strictEqual(Number(createdProp.longitude), initialLng, 'longitude в ответе POST должен совпадать');
  assert.strictEqual(Number(createdProp.address.lat), initialLat, 'address.lat в ответе POST должен совпадать');
  assert.strictEqual(Number(createdProp.address.lng), initialLng, 'address.lng в ответе POST должен совпадать');
  console.log('   ✅ Ответ сервера при создании проверен!\n');

  // 3. Проверка записи в БД через SELECT после создания
  console.log(`3️⃣  Проверка записи в БД: SELECT * FROM PROPERTIES WHERE PROPERTY_ID = :id (ID=${createdProp.id})...`);
  const storeAfterCreate = new InMemoryOracleStore();
  const dbRowsAfterCreate = await storeAfterCreate.query(
    'SELECT property_id, title, latitude, longitude, status FROM properties WHERE property_id = :id',
    { id: createdProp.id },
  );
  assert.strictEqual(dbRowsAfterCreate.length, 1, 'Объект должен существовать в таблице PROPERTIES');
  console.table(
    dbRowsAfterCreate.map((r) => ({
      PROPERTY_ID: r.PROPERTY_ID,
      TITLE: r.TITLE,
      LATITUDE: r.LATITUDE,
      LONGITUDE: r.LONGITUDE,
      STATUS: r.STATUS,
    })),
  );
  assert.strictEqual(Number(dbRowsAfterCreate[0].LATITUDE), initialLat, 'Колонка LATITUDE в БД должна быть равна initialLat');
  assert.strictEqual(Number(dbRowsAfterCreate[0].LONGITUDE), initialLng, 'Колонка LONGITUDE в БД должна быть равна initialLng');
  console.log('   ✅ SELECT-запрос подтвердил запись координат в таблицу PROPERTIES!\n');

  // 4. Обновление координат через PUT /api/v1/properties/:id
  const updatedLat = 49.974321;
  const updatedLng = 82.638765;
  console.log(`4️⃣  Обновление геопозиции квартиры через PUT /api/v1/properties/${createdProp.id} -> (${updatedLat}, ${updatedLng})...`);

  const updateRes = await fetch(`${API_BASE}/properties/${createdProp.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: 'Тестовая резиденция на набережной (Обновлены координаты)',
      latitude: updatedLat,
      longitude: updatedLng,
      address: {
        city: 'Усть-Каменогорск',
        district: 'Стрелка',
        street: 'наб. Славского',
        building: '50',
        lat: updatedLat,
        lng: updatedLng,
      },
    }),
  });
  assert.strictEqual(updateRes.status, 200, `Ожидался статус 200 OK при PUT, получен ${updateRes.status}`);
  const updatedProp = await updateRes.json();

  assert.strictEqual(Number(updatedProp.latitude), updatedLat, 'latitude после PUT должен обновиться');
  assert.strictEqual(Number(updatedProp.longitude), updatedLng, 'longitude после PUT должен обновиться');
  assert.strictEqual(Number(updatedProp.address.lat), updatedLat, 'address.lat после PUT должен обновиться');
  assert.strictEqual(Number(updatedProp.address.lng), updatedLng, 'address.lng после PUT должен обновиться');

  const storeAfterUpdate = new InMemoryOracleStore();
  const dbRowsAfterUpdate = await storeAfterUpdate.query(
    'SELECT property_id, title, latitude, longitude, status FROM properties WHERE property_id = :id',
    { id: createdProp.id },
  );
  console.table(
    dbRowsAfterUpdate.map((r) => ({
      PROPERTY_ID: r.PROPERTY_ID,
      TITLE: r.TITLE,
      LATITUDE: r.LATITUDE,
      LONGITUDE: r.LONGITUDE,
      STATUS: r.STATUS,
    })),
  );
  assert.strictEqual(Number(dbRowsAfterUpdate[0].LATITUDE), updatedLat, 'LATITUDE в БД после PUT должен обновиться');
  assert.strictEqual(Number(dbRowsAfterUpdate[0].LONGITUDE), updatedLng, 'LONGITUDE в БД после PUT должен обновиться');
  console.log('   ✅ Обновление координат через PUT и проверка в БД прошли успешно!\n');

  // 5. Проверка защиты владельца (403 Forbidden) и полного удаления (DELETE /api/v1/properties/:id)
  console.log(`5️⃣  Проверка удаления квартиры (DELETE /api/v1/properties/${createdProp.id})...`);

  // Попробуем удалить чужой объект под другим арендодателем (Алихан, alikhan@example.com)
  const otherLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alikhan@example.com', password: 'alikhan123' }),
  });
  if (otherLoginRes.ok) {
    const { token: otherToken } = await otherLoginRes.json();
    const forbiddenDelRes = await fetch(`${API_BASE}/properties/${createdProp.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    assert.strictEqual(forbiddenDelRes.status, 403, 'Чужой арендодатель должен получить 403 Forbidden при попытке удаления');
    console.log('   🔒 Проверка безопасности пройдена: чужой арендодатель получил 403 Forbidden');
  }

  // Удаляем объект под настоящим владельцем
  const deleteRes = await fetch(`${API_BASE}/properties/${createdProp.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(deleteRes.status, 204, `Ожидался статус 204 No Content при удалении, получен ${deleteRes.status}`);

  const storeAfterDelete = new InMemoryOracleStore();
  const dbRowsAfterDelete = await storeAfterDelete.query(
    'SELECT property_id, title FROM properties WHERE property_id = :id',
    { id: createdProp.id },
  );
  assert.strictEqual(dbRowsAfterDelete.length, 0, 'Запись должна быть полностью удалена из таблицы PROPERTIES');
  console.log(`   ✅ Запись #${createdProp.id} полностью стёрта из таблицы PROPERTIES (SELECT вернул 0 строк)!\n`);

  console.log('==============================================================');
  console.log('🎉 ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ УСПЕШНО (100% PASS)');
  console.log('==============================================================');
}

runSmokeTest().catch((err) => {
  console.error('❌ ТЕСТ ЗАВЕРШИЛСЯ С ОШИБКОЙ:', err);
  process.exit(1);
});
