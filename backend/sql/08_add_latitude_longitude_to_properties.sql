-- =============================================================================
-- 08_add_latitude_longitude_to_properties.sql
-- Добавление колонок LATITUDE и LONGITUDE в таблицу PROPERTIES
-- и синхронизация координат из таблицы ADDRESSES.
-- =============================================================================

DECLARE
  v_cnt NUMBER := 0;
BEGIN
  SELECT COUNT(*) INTO v_cnt
    FROM user_tab_columns
   WHERE table_name = 'PROPERTIES' AND column_name = 'LATITUDE';
  IF v_cnt = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE properties ADD (latitude NUMBER(9,6))';
  END IF;

  SELECT COUNT(*) INTO v_cnt
    FROM user_tab_columns
   WHERE table_name = 'PROPERTIES' AND column_name = 'LONGITUDE';
  IF v_cnt = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE properties ADD (longitude NUMBER(9,6))';
  END IF;
END;
/

UPDATE properties p
   SET (p.latitude, p.longitude) = (
         SELECT NVL(a.lat, 49.953000), NVL(a.lng, 82.618000)
           FROM addresses a
          WHERE a.address_id = p.address_id
       )
 WHERE p.latitude IS NULL OR p.longitude IS NULL;

COMMIT;
