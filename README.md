# Информационная система аренды жилой недвижимости — Serenity Residence (РК, ВКО)

Полнофункциональная веб-система для управления долгосрочной арендой жилой недвижимости в Восточно-Казахстанской области (Усть-Каменогорск, Риддер). Проект включает публичный интерактивный каталог с картой OpenStreetMap и кластеризацией маркеров, глобальное переключение тем (**Editorial Dark Luxury** и **Warm Earthy Light**), детальную карту объекта с попапом-превью, интерактивный выбор геопозиции на карте в кабинете арендодателя, загрузку фотографий, полное управление жизненным циклом объявлений (публикация, редактирование, снятие с публикации, каскадное удаление), ролевую модель доступа (RBAC) и автоматизированный расчёт договоров и графика ежемесячных платежей.

---

## 1. Технологический стек и ключевые возможности

### Стек технологий
- **База данных:** Oracle Database (с автоматическим резервным in-memory хранилищем `InMemoryOracleStore` и JSON-снапшотом при отсутствии локального инстанса Oracle).
- **Backend:** NestJS 11, TypeScript, официальный драйвер `node-oracledb` (Thin Mode — не требует установки Oracle Instant Client), `@nestjs/jwt`, встроенный криптографический модуль `node:crypto` (SHA-256 + `timingSafeEqual`), `class-validator`, `class-transformer`, `multer` (загрузка изображений).
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, `leaflet` + `react-leaflet` + `supercluster` (OpenStreetMap), шрифтовая пара `Cormorant Garamond` (заголовки) и `Plus Jakarta Sans` (интерфейс).

### Ключевые функциональные возможности
1. **Две глобальные темы оформления (Dark Luxury / Light Mode):**
   - **Editorial Dark Luxury** (по умолчанию): глубокий угольно-обсидиановый фон (`#141312`), карточки оттенка эспрессо (`#1C1A18`), платиново-молочная типографика и благородные бронзово-золотые акценты (`#B89778` / `#D4B89C`).
   - **Warm Earthy Light**: тёплый кремово-песочный фон (`#FAF6F0`) с терракотовыми акцентами (`#B85D3B`).
   - Мгновенное переключение кнопкой в шапке сайта (`HeaderNav`) с сохранением выбора в `localStorage` и адаптацией тайлов карт Leaflet.
2. **Интерактивные карты (OpenStreetMap + Leaflet):**
   - **Общая карта каталога (`CatalogMap`):** кластеризация маркеров с ценами через `Supercluster`, всплывающие попапы-превью при клике на маркер.
   - **Карта на детальной странице квартиры (`PropertyDetailMap`):** центрирование на координатах объекта (`latitude`, `longitude`), маркер с ценой и открывающийся по клику попап с миниатюрой фото, названием, ценой и характеристиками.
   - **Интерактивный пикер координат в кабинете арендодателя (`LocationPickerMap`):** установка маркера кликом по карте, перетаскивание маркера (`draggable`), быстрые пресеты районов ВКО (Центр УК, КШТ, Риддер) и двусторонняя синхронизация с полями `latitude` и `longitude`.
3. **Полное управление объектами в кабинете арендодателя (`/landlord`):**
   - Создание и редактирование объявлений с координатами и загрузкой собственных фотографий (`multipart/form-data`).
   - Смена статуса объявления: публикация в каталог (`AVAILABLE`), временное скрытие (`INACTIVE`), освобождение после аренды (`RENTED` → `AVAILABLE`).
   - Полное каскадное удаление объекта из базы данных (`DELETE /api/v1/properties/:id`) с проверкой владельца по JWT-токену, модальным подтверждением и автоматической очисткой связанных записей (`PAYMENTS`, `CONTRACTS`, `RENTAL_APPLICATIONS`, `FAVORITES`, `PROPERTIES`, `ADDRESSES`).

---

## 2. Предварительные требования

На машине разработчика должны быть установлены:
- **Node.js** версии `20.x` или выше (рекомендуется `22.x` / `24.x`) и пакетный менеджер **npm**.
- **Oracle Database** (`19c` / `21c XE` / `23ai Free`) — опционально. Если локальный сервер Oracle недоступен на порту `1521` или включён флаг `ORACLE_MOCK=true`, бэкенд автоматически запускается со встроенным эмулятором таблиц Oracle (`backend/oracle-data-snapshot.json`) и предзагруженными тестовыми данными по ВКО.

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

### Frontend (`frontend/.env.local`)

Скопируйте файл `frontend/.env.example` в `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

---

## 4. Маршрутизация, Авторизация и REST API

### Маршруты Frontend

- `/` и `/catalog` — открытый публичный каталог с умными фильтрами, интерактивной картой ВКО и карточками объектов.
- `/properties/[id]` — детальная страница квартиры с фотогалереей, характеристиками, интерактивной картой расположения (`PropertyDetailMap`) и формой подачи заявки на аренду.
- `/favorites` — страница избранных объектов арендатора.
- `/login` и `/register` — страницы входа и регистрации с выбором роли (`TENANT` или `LANDLORD`).
- `/landlord` — защищённый личный кабинет арендодателя: входящие заявки на аренду, форма добавления/редактирования с картой выбора геопозиции (`LocationPickerMap`) и список собственных объектов с фильтрацией и пагинацией.

### Основные эндпоинты REST API (`/api/v1`)

| Метод | Эндпоинт | Доступ | Описание |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Публичный | Регистрация пользователя (`TENANT` или `LANDLORD`), возвращает `{ token, user }`. |
| `POST` | `/api/v1/auth/login` | Публичный | Вход по `email` и `password`, возвращает `{ token, user }`. |
| `GET` | `/api/v1/auth/me` | `Bearer JWT` | Профиль текущего авторизованного пользователя. |
| `GET` | `/api/v1/properties` | Публичный | Список доступных объектов с фильтрацией и расчётом индикатора выгодной цены (`is_good_price`). |
| `GET` | `/api/v1/properties/my` | `LANDLORD` | Все объекты текущего арендодателя (`AVAILABLE`, `RENTED`, `INACTIVE`). |
| `GET` | `/api/v1/properties/:id` | Публичный | Детальная информация об объекте недвижимости, включая координаты `latitude` и `longitude`. |
| `POST` | `/api/v1/properties` | `LANDLORD` | Создание нового объекта с адресом и координатами (`latitude`, `longitude`). |
| `PUT` / `PATCH` | `/api/v1/properties/:id` | `LANDLORD` (Владелец) | Обновление параметров и геокоординат объекта. |
| `POST` | `/api/v1/properties/:id/image` | `LANDLORD` (Владелец) | Загрузка фотографии объекта (`multipart/form-data`, поле `image`). |
| `PATCH` | `/api/v1/properties/:id/deactivate` | `LANDLORD` (Владелец) | Временное снятие объекта с публикации (перевод в статус `INACTIVE`). |
| `PATCH` | `/api/v1/properties/:id/activate` | `LANDLORD` (Владелец) | Возврат объекта в каталог (перевод в статус `AVAILABLE`). |
| `DELETE` | `/api/v1/properties/:id` | `LANDLORD` (Владелец) | Полное каскадное удаление объекта и связанных записей из базы данных (`403 Forbidden` при попытке удалить чужой объект). |
| `POST` | `/api/v1/applications` | `TENANT` | Подача заявки на аренду выбранной квартиры. |
| `PATCH` | `/api/v1/applications/:id/approve` | `LANDLORD` | Одобрение заявки с автоматической генерацией договора (`CONTRACTS`) и графика платежей (`PAYMENTS`). |

---

## 5. Запуск, остановка и тестирование проекта

### Быстрый запуск и остановка (Antigravity Skill / PowerShell)

В проекте настроен скилл `.agents/skills/project-lifecycle` (команды `/start` и `/stop` в чате агента), а также готовые PowerShell-скрипты:

```powershell
# Автоматический запуск Backend (порт 4000) и Frontend (порт 3000)
powershell -ExecutionPolicy Bypass -File .\.agents\skills\project-lifecycle\scripts\start.ps1

# Остановка всех процессов и освобождение портов 3000 и 4000
powershell -ExecutionPolicy Bypass -File .\.agents\skills\project-lifecycle\scripts\stop.ps1
```

### Ручной запуск

**Установка зависимостей:**
```bash
cd backend && npm install
cd ../frontend && npm install
```

**Режим разработки (2 терминала):**
```bash
# Терминал 1 — Backend (порт 4000)
cd backend
npm run start:dev

# Терминал 2 — Frontend (порт 3000)
cd frontend
npm run dev
```

**Production-сборка и запуск:**
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

### Автоматическое интеграционное тестирование (Smoke Test)

Для проверки сохранения и обновления GPS-координат (`latitude`, `longitude`), защиты прав владельца (`403 Forbidden`) и полного каскадного удаления объектов (`DELETE /api/v1/properties/:id`) запустите скрипт при работающем бэкенде:

```bash
node backend/test-coordinates-smoke.js
```

---

## 6. База данных: Запуск, Инициализация и Просмотр

### Вариант А. Быстрый запуск Oracle Database 23ai Free в Docker

```bash
docker run -d \
  --name oracle-rental \
  -p 1521:1521 \
  -e ORACLE_PASSWORD=change_me \
  -e APP_USER=rental \
  -e APP_USER_PASSWORD=change_me \
  gvenzl/oracle-free:latest
```

### Вариант Б. Автономный режим без установки Oracle (встроенное хранилище)

Если сервер Oracle на `localhost:1521` не запущен или в `backend/.env` указано `ORACLE_MOCK=true`, бэкенд автоматически включает синхронизируемое хранилище `InMemoryOracleStore` (`backend/oracle-data-snapshot.json`) с предзагруженными объектами по ВКО и тестовыми пользователями.

---

### Структура таблиц Oracle Database

1. **`LANDLORDS`** — арендодатели (`id`, `full_name`, `email`, `phone`, `password_hash`).
2. **`TENANTS`** — арендаторы (`id`, `full_name`, `email`, `phone`, `password_hash`).
3. **`PROPERTY_TYPES`** — справочник типов жилья (`type_id`, `type_name`: Квартира, Студия, Апартаменты, Лофт).
4. **`ADDRESSES`** — адреса и координаты объектов (`address_id`, `city`, `district`, `street`, `building`, `apartment`, `lat`, `lng`).
5. **`PROPERTIES`** — объекты недвижимости (`property_id`, `landlord_id`, `type_id`, `address_id`, `title`, `description`, `rooms`, `area`, `monthly_price`, `pets_allowed`, `no_deposit`, `from_owner`, `image_url`, `latitude`, `longitude`, `status` (`AVAILABLE` / `RENTED` / `INACTIVE`), `created_at`).
6. **`FAVORITES`** — избранные объекты арендаторов (`user_id`, `property_id`, `created_at`).
7. **`RENTAL_APPLICATIONS`** — заявки арендаторов (`application_id`, `property_id`, `tenant_id`, `desired_start_date`, `lease_months`, `message`, `status` (`PENDING` / `APPROVED` / `REJECTED`), `created_at`).
8. **`CONTRACTS`** — договоры аренды (`contract_id`, `application_id`, `property_id`, `tenant_id`, `landlord_id`, `start_date`, `end_date`, `monthly_amount`, `status`).
9. **`PAYMENTS`** — график ежемесячных платежей (`payment_id`, `contract_id`, `due_date`, `amount`, `status` (`PENDING` / `PAID` / `OVERDUE`), `paid_at`).

### SQL-скрипты инициализации и миграции (`backend/sql/`)

- `seed.sql` — создание всех таблиц (`CREATE TABLE`), включая колонки `latitude`, `longitude`, `image_url`, ограничений целостности, справочника типов недвижимости и тестовых данных.
- `02_add_coordinates_and_10_properties.sql` — добавление координат в `ADDRESSES` и базовых объектов по ВКО.
- `03_split_users_into_tenants_and_landlords.sql` — разделение таблиц на `LANDLORDS` и `TENANTS`.
- `04_add_favorites_and_amenities.sql` — таблица `FAVORITES` и параметры удобств (`pets_allowed`, `no_deposit`, `from_owner`).
- `05_seed_3_landlords_and_30_properties.sql` — 3 дополнительных арендодателя и 30 объектов недвижимости по ВКО.
- `06_update_unique_interior_images.sql` и `07_fix_all_44_unique_images.sql` — назначение уникальных фотографий интерьеров.
- `08_add_latitude_longitude_to_properties.sql` — миграция добавления колонок `LATITUDE` и `LONGITUDE` непосредственно в таблицу `PROPERTIES` с синхронизацией координат из `ADDRESSES`.

### Просмотр содержимого БД

**Быстрый просмотр таблиц в терминале (`db-viewer.js`):**
```bash
cd backend
node db-viewer.js
```

**Подключение через DBeaver / DataGrip:**
- **Host:** `localhost` (`127.0.0.1`), **Port:** `1521`
- **Service Name:** `FREEPDB1`
- **Username:** `rental`, **Password:** `change_me`
- **JDBC URL:** `jdbc:oracle:thin:@//localhost:1521/FREEPDB1`

---

## 7. Тестовые доступы

Страница входа: `http://localhost:3000/login`  
Страница регистрации: `http://localhost:3000/register`

| Роль | ФИО | Email (Логин) | Пароль (открытый) | Телефон | Примечание / Объекты |
|---|---|---|---|---|---|
| **Арендодатель (`LANDLORD`)** | Иван Петров | `landlord@example.com` | `demo123` | `+79001112233` | Базовый аккаунт арендодателя (объекты в Усть-Каменогорске и Риддере). |
| **Арендодатель (`LANDLORD`)** | Алихан Серикович Нурпеисов | `alikhan@example.com` | `alikhan123` | `+77015551001` | 10 квартир (`AVAILABLE`) в Усть-Каменогорске и Риддере. |
| **Арендодатель (`LANDLORD`)** | Дана Маратовна Ахметова | `dana@example.com` | `dana123` | `+77025552002` | 10 квартир (`AVAILABLE`) в Усть-Каменогорске и Риддере. |
| **Арендодатель (`LANDLORD`)** | Тимур Ерланович Касымов | `timur@example.com` | `timur123` | `+77055553003` | 10 квартир (`AVAILABLE`) в Усть-Каменогорске и Риддере. |
| **Арендатор (`TENANT`)** | Анна Смирнова | `tenant@example.com` | `demo123` | `+79004445566` | Каталог (`/catalog`), избранное (`/favorites`), подача заявок на аренду. |
