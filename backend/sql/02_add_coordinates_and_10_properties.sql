-- =============================================================================
-- Миграция: добавление координат (LAT, LNG) в таблицу ADDRESSES
-- и добавление 10 новых объектов недвижимости (РК, ВКО, Усть-Каменогорск)
-- =============================================================================

ALTER TABLE addresses ADD (
  lat NUMBER(9,6),
  lng NUMBER(9,6)
);

-- Обновление координат для 4 базовых объектов
UPDATE addresses SET lat = 49.956500, lng = 82.611900 WHERE address_id = 1;
UPDATE addresses SET lat = 49.948200, lng = 82.615400 WHERE address_id = 2;
UPDATE addresses SET lat = 49.926800, lng = 82.648500 WHERE address_id = 3;
UPDATE addresses SET lat = 50.344100, lng = 83.512900 WHERE address_id = 4;

-- Добавление 10 новых адресов и объектов в ВКО (Усть-Каменогорск)
-- 1 (ID 5)
INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
VALUES ('Усть-Каменогорск', 'Ульбинский', 'ул. Казахстан', '68', '12', 49.953100, 82.621400);
INSERT INTO properties (owner_id, type_id, address_id, title, description, rooms, area, monthly_price, status)
VALUES (1, 1, 5, '2-комнатная квартира возле ТД Даниэль', 'Свежий евроремонт, кондиционер, вся бытовая техника, рядом центральный рынок и остановки.', 2, 56, 195000, 'AVAILABLE');

-- 2 (ID 6)
INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
VALUES ('Усть-Каменогорск', 'Октябрьский', 'ул. Кирова', '43', '7', 49.946900, 82.626100);
INSERT INTO properties (owner_id, type_id, address_id, title, description, rooms, area, monthly_price, status)
VALUES (1, 1, 6, 'Уютная 1-комнатная у парка Кирова', 'Тихий исторический центр, окна во двор, в шаговой доступности парк им. Касыма Кайсенова.', 1, 38, 155000, 'AVAILABLE');

-- 3 (ID 7)
INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
VALUES ('Усть-Каменогорск', 'Стрелка', 'наб. Славского', '56', '91', 49.956200, 82.596800);
INSERT INTO properties (owner_id, type_id, address_id, title, description, rooms, area, monthly_price, status)
VALUES (1, 3, 7, 'Панорамные 3-комнатные апартаменты на Стрелке', 'Вид на слияние Иртыша и Ульбы, просторная лоджия, гардеробная, парковочное место.', 3, 88, 290000, 'AVAILABLE');

-- 4 (ID 8)
INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
VALUES ('Усть-Каменогорск', 'Стрелка', 'ул. Пермитина', '27', '34', 49.954800, 82.601200);
INSERT INTO properties (owner_id, type_id, address_id, title, description, rooms, area, monthly_price, status)
VALUES (1, 2, 8, 'Светлая студия на Стрелке у набережной', 'Компактная современная студия для одного или пары, высокоскоростной интернет, смарт-ТВ.', 1, 32, 150000, 'AVAILABLE');

-- 5 (ID 9)
INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
VALUES ('Усть-Каменогорск', 'КШТ', 'пр-т Сатпаева', '34', '105', 49.922400, 82.654200);
INSERT INTO properties (owner_id, type_id, address_id, title, description, rooms, area, monthly_price, status)
VALUES (1, 1, 9, 'Семейная 3-комнатная квартира на пр. Сатпаева', 'Рядом ТРЦ Maxi Mall, театр им. Жамбыла, закрытая детская площадка, два санузла.', 3, 82, 240000, 'AVAILABLE');

-- 6 (ID 10)
INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
VALUES ('Усть-Каменогорск', 'КШТ', 'ул. Есенберлина', '19', '44', 49.919500, 82.661800);
INSERT INTO properties (owner_id, type_id, address_id, title, description, rooms, area, monthly_price, status)
VALUES (1, 1, 10, '2-комнатная в новостройке на Есенберлина', 'Первая сдача, автономное отопление, современная кухня со встроенной посудомоечной машиной.', 2, 62, 200000, 'AVAILABLE');

-- 7 (ID 11)
INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
VALUES ('Усть-Каменогорск', 'Ульбинский', 'пр-т Шакарима', '75', '18', 49.967400, 82.618900);
INSERT INTO properties (owner_id, type_id, address_id, title, description, rooms, area, monthly_price, status)
VALUES (1, 1, 11, 'Тёплая 2-комнатная возле ВКТУ им. Серикбаева', 'Отличный вариант для преподавателей или студентов, рядом трамвайная линия и супермаркеты.', 2, 51, 170000, 'AVAILABLE');

-- 8 (ID 12)
INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
VALUES ('Усть-Каменогорск', 'Октябрьский', 'ул. Кабанбай батыра', '114', '60', 49.951000, 82.633500);
INSERT INTO properties (owner_id, type_id, address_id, title, description, rooms, area, monthly_price, status)
VALUES (1, 2, 12, 'Студия в районе центрального автовокзала', 'Удобная транспортная развязка, свежий косметический ремонт, низкие коммунальные платежи.', 1, 30, 130000, 'AVAILABLE');

-- 9 (ID 13)
INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
VALUES ('Усть-Каменогорск', 'Защита', 'ул. Вострецова', '21', '9', 49.991200, 82.589000);
INSERT INTO properties (owner_id, type_id, address_id, title, description, rooms, area, monthly_price, status)
VALUES (1, 1, 13, '1-комнатная квартира в районе ж/д вокзала Защита', 'Спокойный спальный район, полностью меблирована, застеклённый балкон.', 1, 36, 115000, 'AVAILABLE');

-- 10 (ID 14)
INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
VALUES ('Усть-Каменогорск', 'Согра', 'ул. Согринская', '15', '4', 49.982500, 82.694000);
INSERT INTO properties (owner_id, type_id, address_id, title, description, rooms, area, monthly_price, status)
VALUES (1, 4, 14, 'Светлый 2-комнатный лофт в Новой Согре', 'Зелёный экологичный район рядом с дендропарком, индивидуальная планировка, высокие потолки.', 2, 66, 160000, 'AVAILABLE');

COMMIT;

