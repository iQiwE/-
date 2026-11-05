# Информационная система аренды жилой недвижимости (РК, ВКО)

Полнофункциональная веб-система для управления долгосрочной арендой жилой недвижимости в Восточно-Казахстанской области (Усть-Каменогорск, Риддер). Проект включает публичный интерактивный каталог с картой OpenStreetMap и кластеризацией маркеров, регистрацию и авторизацию пользователей, подачу заявок на аренду, личный кабинет арендодателя, ролевую модель доступа (RBAC) и автоматизированный расчёт договоров и графика ежемесячных платежей.

---

## 1. Технологический стек

- **База данных:** Oracle Database (с автоматическим резервным in-memory хранилищем при отсутствии локального инстанса Oracle).
- **Backend:** NestJS 11, TypeScript, официальный драйвер `node-oracledb` (Thin Mode — не требует установки Oracle Instant Client), `@nestjs/jwt`, встроенный криптографический модуль `node:crypto` (SHA-256 + `timingSafeEqual`), `class-validator`, `class-transformer`.
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, `leaflet` + `react-leaflet` + `supercluster` (OpenStreetMap).

---

## 2. Предварительные требования

На машине разработчика должны быть установлены:
- **Node.js** версии `20.x` или выше (рекомендуется `22.x` / `24.x`) и пакетный менеджер **npm**.
- **Oracle Database** (`19c` / `21c XE` / `23ai Free`) — опционально. Если локальный сервер Oracle недоступен на порту `1521` или включён флаг `ORACLE_MOCK=true`, бэкенд автоматически запускается со встроенным эмулятором таблиц Oracle и предзагруженными тестовыми данными (14 объектов по ВКО).

---

## 3. Настройка окружения

### Backend (`backend/.env`)

Скопируйте файл `backend/.env.example` в `backend/.env` и укажите параметры:

```env
PORT=4000
FRONTEND_URL=http://localhost:3000

# Параметры подключения к Oracle Database
ORACLE_USER=rental
ORACLE_PASSWORD=change_me
ORACLE_CONNECT_STRING=localhost:1521/FREEPDB1

# Установите true для принудительной работы с in-memory хранилищем без Oracle DB
ORACLE_MOCK=false

# Секретный ключ для подписи JWT-токенов (срок действия токена по умолчанию: 1d)
JWT_SECRET=change_me_to_long_random_string
```

Хэширование паролей выполняется средствами стандартного модуля `node:crypto` (`SHA-256` с константным по времени сравнением `timingSafeEqual`), поэтому дополнительные ключи окружения для хэширования не требуются.

### Frontend (`frontend/.env.local`)

Скопируйте файл `frontend/.env.example` в `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

---

## 4. Маршрутизация, Авторизация и REST API

### Публичные и защищённые маршруты Frontend

- `/` и `/catalog` — **открытый публичный маршрут** (доступен гостям без авторизации). Отображает фильтры по району, цене и сортировке, интерактивную карту ВКО с кластеризацией маркеров и карточки квартир (по 8 на странице).
- `/properties/[id]` — детальная карточка квартиры (доступна для чтения гостям). При нажатии кнопки **«Оставить заявку»** неавторизованный пользователь автоматически перенаправляется на `/login?redirect=/properties/[id]`.
- `/login` — страница входа в систему со ссылкой `Нет аккаунта? Зарегистрироваться` (`/register`). После успешного входа сохраняет JWT в `localStorage` и `cookies` и возвращает пользователя на исходную страницу (`redirect`) либо в `/landlord` / `/catalog`.
- `/register` — страница регистрации нового пользователя (ФИО, Email, телефон, пароль, выбор роли `TENANT` или `LANDLORD`). После регистрации сразу выдаёт JWT-токен и авторизует пользователя.
- `/landlord` — защищённый маршрут личного кабинета арендодателя (только для роли `LANDLORD`; для гостей выполняется редирект на `/login`, для `TENANT` — `403 Forbidden`).

### Эндпоинты авторизации и регистрации (`/api/v1/auth`)

| Метод | Эндпоинт | Доступ | Описание |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Публичный | Регистрация пользователя (`fullName`, `email`, `phone`, `password`, `role`: `'TENANT' \| 'LANDLORD'`). Хэширует пароль, создаёт запись в `USERS` и возвращает `{ token, user }`. |
| `POST` | `/api/v1/auth/login` | Публичный | Аутентификация по `email` и `password`. Проверяет хэш пароля в `USERS` и возвращает `{ token, user }`. |
| `GET` | `/api/v1/auth/me` | `Bearer JWT` | Возвращает профиль текущего авторизованного пользователя. |

---

## 5. Запуск проекта

### Шаг 1. Установка зависимостей

```bash
# Установка пакетов Backend
cd backend
npm install

# Установка пакетов Frontend
cd ../frontend
npm install
```

### Шаг 2. Запуск в режиме разработки

Откройте два терминала:

**Терминал 1 — Backend (порт `4000`):**
```bash
cd backend
npm run start:dev
```

**Терминал 2 — Frontend (порт `3000`):**
```bash
cd frontend
npm run dev
```

### Шаг 3. Сборка и запуск в Production-режиме

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd ../frontend
npm run build
npm run start
```

После запуска интерфейс доступен по адресу `http://localhost:3000`, а REST API — по адресу `http://localhost:4000/api/v1`.

---

## 6. База данных: Запуск, Инициализация и Просмотр

### Вариант А. Быстрый запуск Oracle Database 23ai Free в Docker (рекомендуется)

Если Oracle Database не установлена на хост-машине, поднимите готовый контейнер с базой `FREEPDB1` и пользователем `rental`:

```bash
docker run -d \
  --name oracle-rental \
  -p 1521:1521 \
  -e ORACLE_PASSWORD=change_me \
  -e APP_USER=rental \
  -e APP_USER_PASSWORD=change_me \
  gvenzl/oracle-free:latest
```

Проверка готовности контейнера (дождитесь строки `DATABASE IS READY TO USE!`):
```bash
docker logs -f oracle-rental
```

Управление контейнером:
```bash
# Остановка БД
docker stop oracle-rental

# Повторный запуск БД
docker start oracle-rental
```

### Вариант Б. Запуск локальной службы Oracle Database на Windows

Если Oracle установлена локально (например, Oracle XE / Free), запустите слушатель `TNSListener` и службу инстанса в **PowerShell от имени Администратора**:

```powershell
# Запуск слушателя порта 1521 и сервиса БД
Start-Service OracleOraDB21Home1TNSListener
Start-Service OracleServiceXE

# Либо через утилиту lsnrctl
lsnrctl start
```

### Вариант В. Автономный режим без установки Oracle (встроенное хранилище)

Если сервер Oracle на `localhost:1521` не запущен или в `backend/.env` указано `ORACLE_MOCK=true`, бэкенд автоматически включает синхронизируемое хранилище `InMemoryOracleStore` (`backend/oracle-data-snapshot.json`) с предзагруженными 14 объектами по ВКО и 2 тестовыми пользователями. Никаких дополнительных действий не требуется.

---

### Структура таблиц Oracle Database

1. **`USERS`** — пользователи системы (`user_id`, `full_name`, `email`, `phone`, `password_hash`, `role` (`LANDLORD` / `TENANT` / `ADMIN`)).
2. **`PROPERTY_TYPES`** — справочник типов жилья (`type_id`, `type_name`: Квартира, Студия, Апартаменты, Лофт).
3. **`ADDRESSES`** — адреса и геокоординаты объектов (`address_id`, `city`, `district`, `street`, `building`, `apartment`, `lat`, `lng`).
4. **`PROPERTIES`** — объекты недвижимости (`property_id`, `owner_id`, `type_id`, `address_id`, `title`, `description`, `rooms`, `area`, `monthly_price`, `status` (`AVAILABLE` / `RENTED` / `INACTIVE`), `created_at`).
5. **`RENTAL_APPLICATIONS`** — заявки арендаторов (`application_id`, `property_id`, `tenant_id`, `desired_start_date`, `lease_months`, `message`, `status` (`PENDING` / `APPROVED` / `REJECTED`), `created_at`).
6. **`CONTRACTS`** — договоры аренды (`contract_id`, `application_id`, `property_id`, `tenant_id`, `landlord_id`, `start_date`, `end_date`, `monthly_amount`, `status`).
7. **`PAYMENTS`** — график ежемесячных платежей (`payment_id`, `contract_id`, `due_date`, `amount`, `status` (`PENDING` / `PAID` / `OVERDUE`), `paid_at`).

### SQL-скрипты инициализации и миграции

Скрипты расположены в директории `backend/sql/`:
- `backend/sql/seed.sql` — создание всех таблиц (`CREATE TABLE`), ограничений целостности, справочника типов недвижимости и базовых тестовых пользователей.
- `backend/sql/02_add_coordinates_and_10_properties.sql` — добавление колонок координат (`LAT`, `LNG`) в таблицу `ADDRESSES` и наполнение базы 14 реалистичными объектами недвижимости в ВКО (Усть-Каменогорск, Риддер).

Применение скриптов через `sqlplus` (или внутри Docker-контейнера):
```bash
# Через локальный sqlplus
sqlplus rental/change_me@localhost:1521/FREEPDB1 @backend/sql/seed.sql
sqlplus rental/change_me@localhost:1521/FREEPDB1 @backend/sql/02_add_coordinates_and_10_properties.sql

# Либо если БД запущена в Docker-контейнере oracle-rental
docker exec -i oracle-rental sqlplus rental/change_me@localhost:1521/FREEPDB1 < backend/sql/seed.sql
docker exec -i oracle-rental sqlplus rental/change_me@localhost:1521/FREEPDB1 < backend/sql/02_add_coordinates_and_10_properties.sql
```

### Просмотр содержимого БД (Терминал и DBeaver / DataGrip)

**1. Быстрый просмотр таблиц в терминале (`db-viewer.js`):**
```bash
cd backend
node db-viewer.js
```
Скрипт выводит содержимое таблиц `USERS`, `PROPERTIES` и `RENTAL_APPLICATIONS` в виде таблиц `console.table`.

**2. Подключение через DBeaver / DataGrip:**
- **Host:** `localhost` (`127.0.0.1`)
- **Port:** `1521`
- **Service Name:** `FREEPDB1` (тип подключения: `Service Name`, не `SID`)
- **Username:** `rental`
- **Password:** `change_me`
- **JDBC URL:** `jdbc:oracle:thin:@//localhost:1521/FREEPDB1`

---

## 7. Тестовые доступы

Страница входа: `http://localhost:3000/login`  
Страница регистрации: `http://localhost:3000/register`

| Роль | Email (Логин) | Пароль | Доступный функционал |
|---|---|---|---|
| **Арендодатель (`LANDLORD`)** | `landlord@example.com` | `demo123` | Личный кабинет (`/landlord`): публикация новых объектов, фильтрация и сортировка, управление статусами (`AVAILABLE` / `INACTIVE` / `RENTED`), просмотр входящих заявок только по своим объектам, одобрение и отклонение заявок. |
| **Арендатор (`TENANT`)** | `tenant@example.com` | `demo123` | Каталог и карта (`/catalog`), детальная страница объекта (`/properties/[id]`), подача заявок на аренду. Доступ к `/landlord` и создание объектов заблокированы (RBAC `403 Forbidden`). |
