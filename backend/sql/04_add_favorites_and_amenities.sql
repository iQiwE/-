-- =============================================================================
-- Миграция 04: Избранное (FAVORITES) и Умные теги / Удобства (PROPERTIES)
-- =============================================================================

-- 1. Добавление булевых полей удобств (0/1) в таблицу PROPERTIES
ALTER TABLE properties ADD (
  pets_allowed NUMBER(1) DEFAULT 0 NOT NULL CHECK (pets_allowed IN (0, 1)),
  no_deposit   NUMBER(1) DEFAULT 0 NOT NULL CHECK (no_deposit   IN (0, 1)),
  from_owner   NUMBER(1) DEFAULT 1 NOT NULL CHECK (from_owner   IN (0, 1))
);

-- 2. Создание связующей таблицы избранного FAVORITES (user_id -> tenants.id, property_id -> properties.property_id)
CREATE TABLE favorites (
  user_id     NUMBER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id NUMBER NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT pk_favorites PRIMARY KEY (user_id, property_id)
);

-- 3. Заполнение реалистичных тегов для существующих объектов ВКО
UPDATE properties SET pets_allowed = 1, no_deposit = 0, from_owner = 1 WHERE property_id IN (1, 4, 6, 9, 13, 14);
UPDATE properties SET pets_allowed = 0, no_deposit = 1, from_owner = 1 WHERE property_id IN (3, 5, 8, 11, 12);
UPDATE properties SET pets_allowed = 1, no_deposit = 1, from_owner = 1 WHERE property_id IN (6, 12, 13);
UPDATE properties SET from_owner = 0 WHERE property_id IN (2, 7, 10);

COMMIT;

