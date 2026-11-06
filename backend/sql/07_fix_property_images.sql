-- =============================================================================
-- Миграция 07: Очистка некорректных image_url в таблице PROPERTIES
--  * пустые / base64 (data:...) / локальные пути и сторонние URL;
--  * битые (404) и «нерелевантные» фото Unsplash (фасады зданий вместо интерьеров).
-- Все такие значения заменяются на проверенные фото интерьеров Unsplash.
-- =============================================================================

-- 1. Диагностика: какие записи будут исправлены
SELECT property_id, title, image_url
  FROM properties
 WHERE image_url IS NULL
    OR image_url LIKE 'data:%'
    OR image_url NOT LIKE 'https://images.unsplash.com/photo-%'
    OR image_url LIKE '%photo-1512917774080-9991f1c4c750%'  -- фасад виллы
    OR image_url LIKE '%photo-1540518614846-7ede433c4576%'  -- 404 Not Found
    OR image_url LIKE '%photo-1600585154340-be6161a56a0c%'  -- фасад дома
    OR image_url LIKE '%photo-1600566753376-12c8ab7fb75b%'  -- фасад дома (ночь)
    OR image_url LIKE '%photo-1600566753190-17f0baa2a6c3%'; -- фасад дома

-- 2. Исправление
DECLARE
  TYPE t_url_array IS VARRAY(20) OF VARCHAR2(1000);
  v_urls t_url_array := t_url_array(
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=600&q=80'
  );
BEGIN
  FOR r IN (
    SELECT property_id
      FROM properties
     WHERE image_url IS NULL
        OR image_url LIKE 'data:%'
        OR image_url NOT LIKE 'https://images.unsplash.com/photo-%'
        OR image_url LIKE '%photo-1512917774080-9991f1c4c750%'
        OR image_url LIKE '%photo-1540518614846-7ede433c4576%'
        OR image_url LIKE '%photo-1600585154340-be6161a56a0c%'
        OR image_url LIKE '%photo-1600566753376-12c8ab7fb75b%'
        OR image_url LIKE '%photo-1600566753190-17f0baa2a6c3%'
  ) LOOP
    UPDATE properties
       SET image_url = v_urls(MOD(r.property_id - 1, v_urls.COUNT) + 1)
     WHERE property_id = r.property_id;
  END LOOP;
  COMMIT;
END;
/
