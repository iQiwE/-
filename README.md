<div align="center">

<img src="./Velvet_Residence_Icon.svg" width="76" height="76" alt="Velvet Residence Logo" />

# Velvet Residence · PropTech-платформа аренды жилой недвижимости

**Масштабируемая клиент-серверная экосистема долгосрочной аренды жилой недвижимости с интерактивной гео-аналитикой, транзакционным ядром договоров в СУБД Oracle и контуром защиты персональных данных уровня Enterprise**

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015%20%2F%20React%2019-1B0C1A?style=for-the-badge&logo=next.js&logoColor=FADCD5)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/Backend-NestJS%2011%20%2F%20Node.js-C42759?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Oracle DB](https://img.shields.io/badge/Database-Oracle%20DB%20(3NF%20%2F%20ACID)-6D3C52?style=for-the-badge&logo=oracle&logoColor=FADCD5)](https://www.oracle.com/database/)
[![Tailwind CSS](https://img.shields.io/badge/UI-Tailwind%20CSS%20v4-2D222F?style=for-the-badge&logo=tailwindcss&logoColor=FADCD5)](https://tailwindcss.com/)
[![Security](https://img.shields.io/badge/Security-HttpOnly%20JWT%20%7C%20Helmet%20%7C%20RateLimit-10B981?style=for-the-badge&logo=shield&logoColor=white)](#-безопасность-и-защита-персональных-данных)

[**🌐 Production Live Demo**](https://iqiwe.github.io/-/catalog/) · [**💻 Локальный контур (`localhost:3000`)**](http://localhost:3000/catalog) · [**⚙️ REST API (`/api/v1`)**](http://localhost:4000/api/v1/properties) · [**🚀 Инструкция по развёртыванию**](#-развёртывание-и-production-релиз)

</div>

---

## 📌 О продукте

**Velvet Residence** — коммерческая PropTech-платформа (MVP) для автоматизации полного цикла долгосрочной аренды квартир, студий, апартаментов и лофтов. Система объединяет интерактивный гео-поиск, аналитику рыночных ставок, электронный документооборот между собственником (`LANDLORD`) и нанимателем (`TENANT`) и билинг арендных платежей:

- **Интерактивная гео-аналитика (`Leaflet` + `Turf.js`):** выделение произвольного сектора города свободным росчерком на карте (алгоритм *Ray-Casting* / `booleanPointInPolygon`) с мгновенной пространственной фильтрацией каталога и кластеризацией маркеров.
- **Аналитический скоринг цен (`AVG() OVER (PARTITION BY)`):** расчёт среднерыночной арендной ставки в разрезе городских районов средствами оконных функций Oracle SQL и автоматическая маркировка ликвидных лотов бейджем `Ниже рынка`.
- **Транзакционный цикл сделки (`ACID` + `SELECT ... FOR UPDATE`):** одобрение заявки собственником в рамках единой атомарной транзакции блокирует строку объекта в БД, переводит резиденцию в статус `RENTED`, отклоняет конкурирующие заявки, формирует юридический контракт в таблице `CONTRACTS` и генерирует помесячный график платежей в `PAYMENTS`.
- **Editorial Mobile-first UX:** фиксированная навигация с эффектом `Glassmorphism`, кастомные выпадающие списки `CustomSelect` в фирменной палитре `Dark Plum`, авто-карусели витрины (`3000ms`), свайп-галереи и встроенный чат **«Персональный консьерж»** с физикой мобильной шторки (`Bottom Sheet`, *Snap Points 58% / 94%*).

---

## 🏗️ Техническая архитектура

Веб-приложение построено по классической трёхуровневой архитектуре (*3-Tier Enterprise Architecture*) со строгим разделением слоёв представления, бизнес-логики и хранения данных:

| Уровень | Стек и ключевые модули | Ответственность в системе |
| :--- | :--- | :--- |
| **Presentation Layer (Frontend)** | `Next.js 15 (App Router)`, `React 19`, `TypeScript 5`, `Tailwind CSS v4`, `Leaflet`, `Supercluster` | SSR/SSG-рендеринг витрины, интерактивная картография, гео-полигональный фильтр, управление состоянием сессии и адаптивный интерфейс (`Desktop` / `Mobile Bottom Sheet`). |
| **Application Layer (Backend API)** | `NestJS 11`, `Node.js`, `TypeScript`, `Passport JWT`, `Helmet`, `express-rate-limit` | RESTful API (`/api/v1`), ролевая авторизация (`RBAC`: `TENANT`, `LANDLORD`, `ADMIN`), валидация DTO (`class-validator`), оркестрация транзакций и защита от сетевых атак. |
| **Data Persistence Layer (DB)** | `Oracle Database (21c XE / Autonomous DB)`, драйвер `node-oracledb`, пул соединений | Хранение нормализованной схемы данных (3НФ), обеспечение ссылочной целостности, выполнение аналитических оконных запросов и блокировок уровня строк. |

---

## 🖼️ Интерфейс платформы

### 1. Каталог резиденций (Dark Plum Theme & Glassmorphism Navigation)
![Каталог резиденций](./Рисунок_3_Каталог_Темная_тема.jpg)

### 2. Пространственный поиск обводкой контура на карте (Leaflet + Turf.js)
![Интерактивная карта с полигоном](./Рисунок_5_Карта_Полигон.jpg)

### 3. Карточка резиденции с интерактивной галереей и модулем бронирования
![Детальная карточка объекта](./Рисунок_6_Карточка_Объекта.jpg)

### 4. Кабинет управления портфелем собственника (`LANDLORD`)
![Кабинет арендодателя](./Рисунок_8_Кабинет_Арендодателя.jpg)

### 5. Мобильный чат «Персональный консьерж» (`Bottom Sheet`) и система фильтрации
| Встроенный чат (`Bottom Sheet`) | Кастомный селект (`CustomSelect`) |
| :---: | :---: |
| <img src="./Рисунок_7_Чат_Консьерж_Мобильный.jpg" width="320" alt="Чат с консьержем" /> | <img src="./Рисунок_4_CustomSelect_Темная_тема.jpg" width="520" alt="CustomSelect" /> |

---

## 🗄️ Схема базы данных (СУБД Oracle, 3НФ)

Реляционная модель данных спроектирована в третьей нормальной форме (**3НФ**) с жёстким контролем целостности на уровне ядра СУБД (`PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `CHECK`):

![ER-диаграмма базы данных Oracle](./Рисунок_1_ER_диаграмма_Oracle.jpg)

| Таблица СУБД Oracle | Первичный ключ | Назначение и ключевые атрибуты |
| :--- | :--- | :--- |
| `USERS` (`LANDLORDS` / `TENANTS`) | `ID` | Учётные записи собственников и арендаторов (`FULL_NAME`, `EMAIL UNIQUE`, `PHONE`, `PASSWORD_HASH`) |
| `PROPERTY_TYPES` | `TYPE_ID` | Классификатор типов недвижимости (`Квартира`, `Студия`, `Апартаменты`, `Лофт`) |
| `ADDRESSES` | `ADDRESS_ID` | Адресный реестр и точные геокоординаты объектов (`CITY`, `DISTRICT`, `STREET`, `LAT`, `LNG`) |
| `PROPERTIES` | `PROPERTY_ID` | Реестр объектов аренды (`LANDLORD_ID`, `TYPE_ID`, `ADDRESS_ID`, `ROOMS`, `AREA`, `MONTHLY_PRICE`, `STATUS`) |
| `FAVORITES` | `USER_ID, PROPERTY_ID` | Составной ключ закладок избранных резиденций пользователя |
| `RENTAL_APPLICATIONS` | `APPLICATION_ID` | Входящие заявки на аренду (`DESIRED_START_DATE`, `LEASE_MONTHS`, `STATUS`) |
| `CONTRACTS` | `CONTRACT_ID` | Активные и архивные договоры аренды (`APPLICATION_ID UNIQUE`, `START_DATE`, `END_DATE`, `MONTHLY_AMOUNT`) |
| `PAYMENTS` | `PAYMENT_ID` | Финансовый график начислений и транзакций по договору (`CONTRACT_ID`, `DUE_DATE`, `AMOUNT`, `STATUS`) |

---

## 🛡️ Безопасность и защита персональных данных

Платформа спроектирована в соответствии с требованиями безопасности для коммерческих веб-сервисов (OWASP Top 10) и подготовлена к production-релизу:

1. **Защита от XSS и кражи сессионных токенов (`HttpOnly` + `Secure` Cookies):**
   - Криптографический JWT-токен не сохраняется в `localStorage` и недоступен для клиентского JavaScript. При аутентификации сервер передаёт токен исключительно через защищённый заголовок `Set-Cookie` (`HttpOnly`, `SameSite=Lax/None`, `Secure` в production), а завершение сессии инвалидирует куку через `POST /api/v1/auth/logout`.
2. **Защита от брутфорс-атак и автоматизированного парсинга (`express-rate-limit`):**
   - Настроен глобальный лимитер API (`300` запросов / 15 мин с одного IP-адреса) и изолированный строгий лимитер для эндпоинтов аутентификации `/api/v1/auth/login` и `/api/v1/auth/register` (`25` запросов / 15 мин).
3. **Защита HTTP-заголовков и строгая политика CORS (`helmet`):**
   - Активирован middleware `helmet` (`X-Content-Type-Options: nosniff`, `X-Frame-Options`, `Strict-Transport-Security`).
   - Политика CORS блокирует произвольные источники (`Origin: *`), разрешая кросс-доменные запросы с учётными данными (`credentials: true`) только с явно заданных доменов из белого списка `FRONTEND_URL`.
4. **Предотвращение SQL-инъекций (Oracle Bind Variables):**
   - Все запросы к СУБД Oracle в слое репозиториев выполняются исключительно со связываемыми параметрами (`:id`, `:email`, `:landlordId`, `:district`, `:minPrice` и др.), а динамическая фильтрация и сортировка валидируются по строгому белому списку колонок `UPDATABLE_COLUMNS`.
5. **Криптографическое хеширование и изоляция секретов:**
   - Пароли пользователей хешируются алгоритмом `bcrypt` (`10` раундов соли) со сравнением константного времени `timingSafeEqual`.
   - Политика `.gitignore` исключает попадание в систему контроля версий файлов `.env*`, дампов БД (`*.dmp`, `*.bak`) и закрытых ключей (`*.pem`, `*.key`, `wallet/`).

---

## 💻 Инструкция по локальному запуску

### Предварительные требования
- **Node.js** `>= 20.x` и **npm** `>= 10.x`
- **Oracle Database** `21c XE` / `Autonomous DB` *(при отсутствии локального инстанса Oracle сервер автоматически переключается на отказоустойчивый транзакционный снапшот без остановки сервиса)*

### Установка и запуск сервисов

```bash
# 1. Скопируйте шаблон переменных окружения
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 2. Сборка и запуск Backend API (порт 4000)
cd backend
npm ci
npm run build
npm run start:prod

# 3. Сборка и запуск Frontend-приложения (порт 3000)
cd ../frontend
npm ci
npm run build
npm run start
```

### Демонстрационные учётные записи (RBAC)
- **Собственник (`LANDLORD`):** `landlord@example.com` · Пароль: `demo123`
- **Арендатор (`TENANT`):** `tenant@example.com` · Пароль: `demo123`

---

## 🚀 Развёртывание и Production-релиз

Проект подготовлен к непрерывному развёртыванию (CI/CD) в облачной инфраструктуре:

- **GitHub Actions + GitHub Pages (Frontend Static Export):** пайплайн [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) автоматически собирает статический релиз Next.js (`output: 'export'`) при каждом пуше в ветку `main` и публикует витрину на GitHub Pages с автономным слоем данных [`static-fallback.ts`](./frontend/src/lib/api/static-fallback.ts).
- **Vercel (Frontend SSR/Edge):** конфигурация маршрутизации и заголовков безопасности описана в [`vercel.json`](./vercel.json). Поддерживаются переменные окружения `NEXT_PUBLIC_API_URL`, `REACT_APP_API_URL` и `VITE_API_URL`.
- **Render / Railway (Backend API):** инфраструктурный манифест [`render.yaml`](./render.yaml) разворачивает контейнер NestJS с автоматической генерацией `JWT_SECRET` и поддержкой как облачной Oracle Autonomous Database, так и автономного режима `ORACLE_MOCK=true`.

---

<div align="center">
  <sub><b>Velvet Residence PropTech Platform</b> · Enterprise Real Estate Management System · © 2026</sub>
</div>
