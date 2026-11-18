<div align="center">

<img src="./Velvet_Residence_Icon.svg" width="76" height="76" alt="Velvet Residence Logo" />

# Velvet Residence · ИС Аренды Жилой Недвижимости (ВКО)

**Полнофункциональная трёхуровневая информационная система долгосрочной аренды жилой недвижимости с интерактивной гео-аналитикой, транзакционным учётом договоров в СУБД Oracle и защищённым контуром персональных данных**

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015%20%2F%20React%2019-1B0C1A?style=for-the-badge&logo=next.js&logoColor=FADCD5)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/Backend-NestJS%2011%20%2F%20Node.js-C42759?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Oracle DB](https://img.shields.io/badge/Database-Oracle%20DB%20(3NF%20%2F%20ACID)-6D3C52?style=for-the-badge&logo=oracle&logoColor=FADCD5)](https://www.oracle.com/database/)
[![Tailwind CSS](https://img.shields.io/badge/UI-Tailwind%20CSS%20v4-2D222F?style=for-the-badge&logo=tailwindcss&logoColor=FADCD5)](https://tailwindcss.com/)
[![Security](https://img.shields.io/badge/Security-HttpOnly%20JWT%20%7C%20Helmet%20%7C%20RateLimit-10B981?style=for-the-badge&logo=shield&logoColor=white)](#-аудит-информационной-безопасности-и-защита-пдн)

[**🌐 Живое демо (GitHub Pages)**](https://iqiwe.github.io/-/catalog/) · [**💻 Локальный стенд (`localhost:3000`)**](http://localhost:3000/catalog) · [**📊 Презентация (Pitch Deck .pptx)**](./Velvet_Residence_Pitch_Deck.pptx) · [**📄 Курсовая работа (.docx)**](./Курсовая_работа_Щербаков_СА_v2.docx)

</div>

---

## 📌 О проекте

**Velvet Residence** — современная клиент-серверная платформа долгосрочной аренды квартир, студий, апартаментов и лофтов в Восточно-Казахстанской области (г. Усть-Каменогорск, г. Риддер). Проект устраняет разрыв между классическими досками объявлений и финансово-договорным учётом сделки:

- **Интерактивная гео-аналитика (`Leaflet` + `Turf.js`):** свободное выделение произвольного сектора города пальцем или курсором мыши на карте (алгоритм *Ray-Casting*) с мгновенной фильтрацией каталога и кнопкой сброса области.
- **Ценовой мониторинг районов (`AVG() OVER (PARTITION BY)`):** автоматический расчёт среднерыночной ставки аренды по каждому району ВКО и маркировка выгодных предложений (`Ниже рынка`).
- **Атомарный цикл сделки (`ACID` + `SELECT ... FOR UPDATE`):** одобрение заявки арендодателем в рамках единой транзакции переводит квартиру в статус `RENTED` (скрывая её из публичной выдачи), отклоняет конкурирующие заявки, создаёт договор в таблице `CONTRACTS` и генерирует помесячный график начислений в `PAYMENTS`.
- **Журнальный Mobile-first UX:** фиксированная шапка с эффектом `Glassmorphism`, кастомные селекты `CustomSelect` в тёмной сливовой теме, авто-карусели карточек (`3000ms`), детальная мини-галерея и встроенный чат **«Персональный консьерж»** с физикой мобильной шторки (`Bottom Sheet`, *Snap Points 58% / 94%*).

---

## 🖼️ Скриншоты интерфейса

### 1. Каталог резиденций (Dark Plum Theme & Glassmorphism Header)
![Каталог резиденций](./Рисунок_3_Каталог_Темная_тема.jpg)

### 2. Интерактивный поиск обводкой области на карте (Leaflet + Turf.js)
![Интерактивная карта с полигоном](./Рисунок_5_Карта_Полигон.jpg)

### 3. Внутренняя карточка объекта с мини-галереей и формой бронирования
![Детальная карточка объекта](./Рисунок_6_Карточка_Объекта.jpg)

### 4. Личный кабинет арендодателя (`LANDLORD`) и выбор геопозиции
![Кабинет арендодателя](./Рисунок_8_Кабинет_Арендодателя.jpg)

### 5. Мобильный чат «Персональный консьерж» (Bottom Sheet с физикой свайпов) и кастомные фильтры
| Встроенный чат (`Bottom Sheet`) | Кастомный селект (`CustomSelect`) |
| :---: | :---: |
| <img src="./Рисунок_7_Чат_Консьерж_Мобильный.jpg" width="320" alt="Чат с консьержем" /> | <img src="./Рисунок_4_CustomSelect_Темная_тема.jpg" width="520" alt="CustomSelect" /> |

---

## 🗄️ Архитектура базы данных (СУБД Oracle, 3НФ)

Информационное ядро системы спроектировано в третьей нормальной форме (**3НФ**) и включает взаимосвязанные таблицы с контролем ссылочной целостности (`PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `CHECK`):

![ER-диаграмма базы данных Oracle](./Рисунок_1_ER_диаграмма_Oracle.jpg)

| Таблица СУБД Oracle | Первичный ключ | Назначение и ключевые атрибуты |
| :--- | :--- | :--- |
| `USERS` (`LANDLORDS` / `TENANTS`) | `ID` | Учётные записи арендодателей и арендаторов (`FULL_NAME`, `EMAIL UNIQUE`, `PHONE`, `PASSWORD_HASH`) |
| `PROPERTY_TYPES` | `TYPE_ID` | Справочник категорий жилья (`Квартира`, `Студия`, `Апартаменты`, `Лофт`) |
| `ADDRESSES` | `ADDRESS_ID` | Город, район, улица, дом, квартира и точные геокоординаты (`LAT`, `LNG`) |
| `PROPERTIES` | `PROPERTY_ID` | Объекты недвижимости (`LANDLORD_ID`, `TYPE_ID`, `ADDRESS_ID`, `ROOMS`, `AREA`, `MONTHLY_PRICE`, `STATUS`) |
| `FAVORITES` | `USER_ID, PROPERTY_ID` | Составной ключ закладок избранных объектов арендатора |
| `RENTAL_APPLICATIONS` | `APPLICATION_ID` | Заявки на долгосрочную аренду (`DESIRED_START_DATE`, `LEASE_MONTHS`, `STATUS`) |
| `CONTRACTS` | `CONTRACT_ID` | Договоры аренды (`APPLICATION_ID UNIQUE`, `START_DATE`, `END_DATE`, `MONTHLY_AMOUNT`) |
| `PAYMENTS` | `PAYMENT_ID` | Помесячный график платежей по договору (`CONTRACT_ID`, `DUE_DATE`, `AMOUNT`, `STATUS`) |

---

## 🛡️ Аудит информационной безопасности и защита ПДН

Проект прошёл полное усиление безопасности (Security Hardening) перед публичным развёртыванием:

1. **Защита от XSS и кражи JWT-токенов (`HttpOnly` + `Secure` Cookies):**
   - JWT-токен больше не сохраняется в `localStorage` или доступных скриптам куки. При входе/регистрации сервер устанавливает токен исключительно в защищённую `HttpOnly` cookie (`SameSite=Lax/None`, `Secure` в production), а при выходе очищает её через `POST /api/v1/auth/logout`.
2. **Защита от брутфорса и парсинга (`express-rate-limit`):**
   - Глобальный лимитер API (`300` запросов / 15 мин с одного IP) и строгий анти-брутфорс лимитер на `/api/v1/auth/login` и `/api/v1/auth/register` (`25` попыток / 15 мин).
3. **Защита HTTP-заголовков и строгий CORS (`helmet`):**
   - Подключён `helmet` (`X-Content-Type-Options: nosniff`, `X-Frame-Options`, `Strict-Transport-Security`).
   - В CORS запрещён `Origin: *`; разрешены только доверенные домены из `FRONTEND_URL` с поддержкой `credentials: true`.
4. **100% изоляция от SQL-инъекций (Oracle Bind Variables):**
   - Все SQL-запросы во всех репозиториях выполняются исключительно через связываемые параметры (`:id`, `:email`, `:landlordId`, `:district`, `:minPrice` и т.д.), а динамическое обновление колонок защищено белым списком `UPDATABLE_COLUMNS`.
5. **Хеширование паролей и защита секретов:**
   - Пароли хешируются алгоритмом `bcrypt` (`10` раундов соли) + проверка `timingSafeEqual`.
   - Файл `.gitignore` жёстко блокирует `.env`, дампы БД (`*.dmp`, `oracle-data-snapshot.json`) и приватные ключи (`*.pem`, `*.key`, `wallet/`).

---

## 🚀 Быстрый старт (Локальный запуск)

```bash
# 1. Клонирование репозитория и настройка переменных окружения
cp .env.example .env

# 2. Установка зависимостей и запуск Backend (порт 4000)
cd backend
npm install
npm run build
npm run start:prod

# 3. Установка зависимостей и запуск Frontend (порт 3000)
cd ../frontend
npm install
npm run build
npm run start
```

### Тестовые аккаунты (предзагружены автоматически):
- **Арендодатель (`LANDLORD`):** `landlord@example.com` / пароль: `demo123`
- **Арендатор (`TENANT`):** `tenant@example.com` / пароль: `demo123`

---

## 🌍 Публичный деплой (GitHub + Vercel + Render)

- **Frontend (Vercel / GitHub Pages):** конфигурация готова в [`vercel.json`](./vercel.json) и скриптах `predeploy` / `deploy` (`gh-pages`) в [`frontend/package.json`](./frontend/package.json). Поддерживаются переменные окружения `NEXT_PUBLIC_API_URL`, `REACT_APP_API_URL` и `VITE_API_URL`.
- **Backend (Render / Railway):** конфигурация одного клика описана в [`render.yaml`](./render.yaml) (автоматический режим `ORACLE_MOCK=true` с 44 квартирами по ВКО работает в облаке без необходимости платного инстанса Oracle).

---

<div align="center">
  <sub>Разработано в рамках курсового проекта · КАСУ · ОП 6B06101 «Информационные системы» · Автор: Щербаков С.А.</sub>
</div>
