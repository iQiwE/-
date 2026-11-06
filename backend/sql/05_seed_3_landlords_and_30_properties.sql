-- =============================================================================
-- Миграция / Сид 05: Добавление 3 новых арендодателей (LANDLORDS)
-- и 30 новых объектов недвижимости (по 10 квартир на каждого арендодателя)
-- Пароли захэшированы через bcrypt (10 rounds):
--   alikhan@example.com -> alikhan123
--   dana@example.com    -> dana123
--   timur@example.com   -> timur123
-- =============================================================================

DECLARE
  v_landlord_1 NUMBER;
  v_landlord_2 NUMBER;
  v_landlord_3 NUMBER;
  v_addr_id    NUMBER;
BEGIN
  -- 1. Создание 3 новых арендодателей в таблице LANDLORDS
  INSERT INTO landlords (full_name, email, phone, password_hash)
  VALUES ('Алихан Серикович Нурпеисов', 'alikhan@example.com', '+77015551001',
          '$2b$10$KMDdA4RdMv9GR27FDwpfTOV8x0As3HgvXBonhenga.6evcSIGp716')
  RETURNING id INTO v_landlord_1;

  INSERT INTO landlords (full_name, email, phone, password_hash)
  VALUES ('Дана Маратовна Ахметова', 'dana@example.com', '+77025552002',
          '$2b$10$DVgvD/c0pGTiUX9J6wrU2eGASGA4JGIQv1GvZHMFKMRoLE/ZFRJhq')
  RETURNING id INTO v_landlord_2;

  INSERT INTO landlords (full_name, email, phone, password_hash)
  VALUES ('Тимур Ерланович Касымов', 'timur@example.com', '+77055553003',
          '$2b$10$WGj9J1Pw4VX7g72DWQdKpOD.DPjPgKpSLWNFVdNL.OAM7DN8HHfUe')
  RETURNING id INTO v_landlord_3;

  -- ===========================================================================
  -- 2. Объекты арендодателя #1 (Алихан Нурпеисов — 10 квартир)
  -- ===========================================================================

  -- Квартира 1
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'Ульбинский', 'пр-т Назарбаева', '77', '24', 49.961200, 82.610500)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_1, 1, v_addr_id, 'Светлая 2-комнатная у Дворца спорта', 'Уютная квартира с видом на проспект, рядом Дворец спорта им. Б. Александрова, кондиционер и гардеробная.', 2, 58, 185000, 1, 0, 1, 'AVAILABLE');

  -- Квартира 2
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'Ульбинский', 'ул. Протозанова', '31', '12', 49.950800, 82.617800)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_1, 3, v_addr_id, 'Видовые 3-комнатные апартаменты на набережной Ульбы', 'Дизайнерский ремонт, панорамное остекление, закрытый двор со шлагбаумом, два санузла.', 3, 94, 285000, 0, 0, 1, 'AVAILABLE');

  -- Квартира 3
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'Октябрьский', 'ул. Максима Горького', '52', '8', 49.947600, 82.623400)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_1, 2, v_addr_id, 'Современная студия в деловом центре', 'Компактная студия в шаговой доступности от ЦУМа и парковой зоны, без залога.', 1, 33, 145000, 0, 1, 1, 'AVAILABLE');

  -- Квартира 4
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'КШТ', 'пр-т Аль-Фараби', '28', '65', 49.918200, 82.667500)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_1, 1, v_addr_id, 'Просторная 2-комнатная в новом ЖК на Аль-Фараби', 'Дом 2025 года постройки, просторная кухня-гостиная, теплые полы, детская площадка.', 2, 65, 190000, 1, 1, 1, 'AVAILABLE');

  -- Квартира 5
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'Стрелка', 'наб. Славского', '64', '41', 49.957800, 82.593200)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_1, 1, v_addr_id, 'Евродвушка на Стрелке с видом на Иртыш', 'Полностью укомплектована мебелью и техникой Bosch, прямой выход к прогулочной набережной.', 2, 54, 215000, 1, 0, 1, 'AVAILABLE');

  -- Квартира 6
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'Ульбинский', 'ул. Серикбаева', '19', '33', 49.969500, 82.615200)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_1, 2, v_addr_id, 'Уютная 1-комнатная студия у кампуса ВКТУ', 'Идеально для студентов и молодых специалистов, скоростной оптоволоконный интернет, рабочая зона.', 1, 31, 125000, 0, 1, 1, 'AVAILABLE');

  -- Квартира 7
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'Октябрьский', 'ул. Ауэзова', '86', '19', 49.953900, 82.629500)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_1, 1, v_addr_id, 'Семейная 3-комнатная на проспекте Ауэзова', 'Окна на две стороны, застекленная лоджия, рядом гимназия и супермаркет.', 3, 78, 235000, 1, 0, 1, 'AVAILABLE');

  -- Квартира 8
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'КШТ', 'ул. Утепова', '15', '88', 49.929100, 82.643800)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_1, 1, v_addr_id, '1-комнатная квартира на Утепова возле парка', 'Чистая и теплая квартира, вся необходимая бытовая техника, тихие соседи.', 1, 40, 138000, 1, 1, 1, 'AVAILABLE');

  -- Квартира 9
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Риддер', 'Центральный', 'ул. Гоголя', '41', '14', 50.346800, 83.516200)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_1, 1, v_addr_id, 'Тёплая 2-комнатная в центре Риддера', 'Кирпичный дом, индивидуальные счетчики тепла, свежий ремонт в светлых тонах.', 2, 52, 135000, 1, 1, 1, 'AVAILABLE');

  -- Квартира 10
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'Стрелка', 'ул. Кайсенова', '110', '52', 49.951900, 82.605400)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_1, 4, v_addr_id, 'Стильный двухуровневый лофт на Кайсенова', 'Потолки 3.6 м, кирпичная кладка, авторское освещение и просторная рабочая студия.', 2, 74, 260000, 0, 0, 1, 'AVAILABLE');

  -- ===========================================================================
  -- 3. Объекты арендодателя #2 (Дана Ахметова — 10 квартир)
  -- ===========================================================================

  -- Квартира 11
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'КШТ', 'пр-т Сатпаева', '62', '104', 49.920800, 82.658900)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_2, 3, v_addr_id, 'Премиум-апартаменты у ТРЦ Maxi Mall', 'Панорамный 12-й этаж, система умный дом, подземный паркинг и консьерж-сервис.', 3, 98, 310000, 0, 0, 1, 'AVAILABLE');

  -- Квартира 12
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'Ульбинский', 'ул. Ворошилова', '99', '16', 49.968200, 82.631100)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_2, 1, v_addr_id, 'Уютная 1-комнатная квартира на Ворошилова', 'После капитального ремонта, новая сантехника и кухонный гарнитур, без залога.', 1, 36, 132000, 1, 1, 1, 'AVAILABLE');

  -- Квартира 13
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'Октябрьский', 'ул. Бурова', '25', '47', 49.956400, 82.634800)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_2, 1, v_addr_id, '2-комнатная квартира в районе площади Ушанова', 'Отличная транспортная доступность во все концы города, раздельные комнаты.', 2, 55, 175000, 1, 0, 1, 'AVAILABLE');

  -- Квартира 14
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'Защита', 'ул. Деповская', '14', '6', 49.993400, 82.584200)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_2, 1, v_addr_id, 'Доступная 2-комнатная в районе Защита', 'Тихий зеленый двор, рядом школа и поликлиника, можно с домашними питомцами.', 2, 49, 120000, 1, 1, 1, 'AVAILABLE');

  -- Квартира 15
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'Согра', 'ул. Егорова', '9', '21', 49.984100, 82.698500)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_2, 2, v_addr_id, 'Светлая студия в экологичном районе Согра', 'Чистый воздух, рядом березовая роща, автономный бойлер и современная мебель.', 1, 29, 110000, 1, 1, 1, 'AVAILABLE');

  -- Квартира 16
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'Аблакетка', 'ул. Островского', '18', '11', 49.914500, 82.592000)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_2, 1, v_addr_id, 'Видовая 2-комнатная на Аблакетке у Иртыша', 'Прекрасный вид на реку и горы, спокойный район, полностью меблирована.', 2, 53, 140000, 1, 0, 1, 'AVAILABLE');

  -- Квартира 17
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'Ульбинский', 'бул. Гагарина', '22', '39', 49.963500, 82.625400)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_2, 1, v_addr_id, 'Просторная 3-комнатная на бульваре Гагарина', 'Зеленая прогулочная аллея прямо под окнами, паркет, кондиционеры в каждой комнате.', 3, 76, 220000, 0, 0, 1, 'AVAILABLE');

  -- Квартира 18
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'КШТ', 'ул. Кокжал Барака', '12', '73', 49.916800, 82.659400)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_2, 2, v_addr_id, 'Новая студия в ЖК на Кокжал Барака', 'Никто не жил, свежий ремонт в скандинавском стиле, гардеробная ниша.', 1, 35, 148000, 0, 1, 0, 'AVAILABLE');

  -- Квартира 19
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Риддер', 'Центральный', 'пр-т Гагарина', '14', '29', 50.342200, 83.508400)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_2, 3, v_addr_id, '3-комнатные апартаменты в Риддере для большой семьи', 'Просторная гостиная, панорамный вид на горные вершины, закрытая парковка.', 3, 86, 185000, 1, 0, 1, 'AVAILABLE');

  -- Квартира 20
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'Стрелка', 'ул. Крылова', '70', '15', 49.952800, 82.608900)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_2, 1, v_addr_id, 'Светлая 1-комнатная на Крылова возле набережной', 'Уютная квартира в престижном районе, 3 минуты пешком до набережной Славского.', 1, 41, 165000, 0, 1, 1, 'AVAILABLE');

  -- ===========================================================================
  -- 4. Объекты арендодателя #3 (Тимур Касымов — 10 квартир)
  -- ===========================================================================

  -- Квартира 21
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'Ульбинский', 'ул. Космическая', '11', '30', 49.965800, 82.613400)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_3, 1, v_addr_id, '2-комнатная квартира на Космической', 'Тихий ухоженный двор, свежий косметический ремонт, низкие коммунальные платежи.', 2, 50, 160000, 1, 1, 1, 'AVAILABLE');

  -- Квартира 22
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'Октябрьский', 'ул. Тохтарова', '48', '17', 49.949500, 82.619200)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_3, 4, v_addr_id, 'Дизайнерский лофт в историческом квартале на Тохтарова', 'Уникальный интерьер, высокие окна, барная стойка, акустическая подготовка.', 2, 68, 255000, 0, 0, 1, 'AVAILABLE');

  -- Квартира 23
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'КШТ', 'ул. Жибек Жолы', '7', '92', 49.924500, 82.651200)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_3, 1, v_addr_id, 'Семейная 2-комнатная на Жибек Жолы', 'Рядом детский сад, школа НИШ и легкоатлетический манеж, просторная лоджия.', 2, 60, 182000, 1, 0, 1, 'AVAILABLE');

  -- Квартира 24
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'Октябрьский', 'ул. Потанина', '29', '44', 49.961800, 82.628800)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_3, 2, v_addr_id, 'Компактная студия на Потанина без депозита', 'Отличный бюджетный вариант для одного человека, вся мебель и стиральная машина.', 1, 28, 122000, 0, 1, 1, 'AVAILABLE');

  -- Квартира 25
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'Стрелка', 'наб. Славского', '40', '78', 49.954100, 82.603500)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_3, 3, v_addr_id, '4-комнатные резиденции на Стрелке с террасой', 'Эксклюзивные апартаменты с панорамой на Иртыш, три спальни, два санузла, гардеробная.', 4, 125, 360000, 1, 0, 0, 'AVAILABLE');

  -- Квартира 26
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'Ульбинский', 'ул. Карбышева', '54', '10', 49.972100, 82.608500)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_3, 1, v_addr_id, 'Уютная 1-комнатная на Карбышева', 'Свежий ремонт, пластиковые окна, тихий озелененный двор, можно с кошкой или небольшой собакой.', 1, 37, 134000, 1, 1, 1, 'AVAILABLE');

  -- Квартира 27
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'Аблакетка', 'ул. Челюскина', '8', '5', 49.917200, 82.588500)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_3, 1, v_addr_id, 'Недорогая 1-комнатная квартира на Аблакетке', 'Чистая и аккуратная квартира от собственника без посредников и без залога.', 1, 34, 105000, 1, 1, 1, 'AVAILABLE');

  -- Квартира 28
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'КШТ', 'пр-т Казыбек би', '25', '118', 49.928200, 82.650100)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_3, 3, v_addr_id, 'Современные 2-комнатные апартаменты на Казыбек би', 'Панорамная лоджия, встроенная техника Samsung, закрытая территория с парковкой.', 2, 67, 210000, 0, 0, 1, 'AVAILABLE');

  -- Квартира 29
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Риддер', 'Центральный', 'ул. Ауэзова', '12', '20', 50.345500, 83.514500)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_3, 2, v_addr_id, 'Светлая студия в центре Риддера посуточно/помесячно', 'Долгосрочная аренда от собственника, быстрый Wi-Fi, рядом городской парк и кафе.', 1, 32, 118000, 0, 1, 1, 'AVAILABLE');

  -- Квартира 30
  INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
  VALUES ('Усть-Каменогорск', 'Октябрьский', 'ул. Белинского', '38', '14', 49.958500, 82.626200)
  RETURNING address_id INTO v_addr_id;
  INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, status)
  VALUES (v_landlord_3, 1, v_addr_id, 'Просторная 3-комнатная квартира на Белинского', 'Тихий центр, кирпичный теплый дом, три изолированные спальни, отлично подойдет семье.', 3, 80, 225000, 1, 0, 1, 'AVAILABLE');

  COMMIT;
END;
/

