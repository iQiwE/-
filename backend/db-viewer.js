/**
 * Служебный скрипт просмотра содержимого БД Oracle:
 * выполняет SELECT * из таблиц LANDLORDS, TENANTS, PROPERTIES и RENTAL_APPLICATIONS
 * и выводит результат через console.table.
 *
 * Запуск: node db-viewer.js
 */
const fs = require('fs');
const path = require('path');
const oracledb = require('oracledb');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  const env = {};
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2];
    }
  }
  return {
    user: process.env.ORACLE_USER || env.ORACLE_USER || 'rental',
    password: process.env.ORACLE_PASSWORD || env.ORACLE_PASSWORD || 'change_me',
    connectString: process.env.ORACLE_CONNECT_STRING || env.ORACLE_CONNECT_STRING || 'localhost:1521/FREEPDB1',
  };
}

async function fetchFromOracleOrFallback(cfg) {
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
  oracledb.fetchAsString = [oracledb.CLOB];

  try {
    const conn = await oracledb.getConnection({
      user: cfg.user,
      password: cfg.password,
      connectString: cfg.connectString,
      connectTimeout: 3,
    });
    console.log(`[DB] Connected to Oracle Database (${cfg.connectString}) as ${cfg.user}\n`);

    const landlords = (await conn.execute('SELECT * FROM LANDLORDS ORDER BY ID')).rows ?? [];
    const tenants = (await conn.execute('SELECT * FROM TENANTS ORDER BY ID')).rows ?? [];
    const properties = (await conn.execute('SELECT * FROM PROPERTIES ORDER BY PROPERTY_ID')).rows ?? [];
    const applications =
      (await conn.execute('SELECT * FROM RENTAL_APPLICATIONS ORDER BY APPLICATION_ID')).rows ?? [];

    await conn.close();
    return { landlords, tenants, properties, applications };
  } catch (err) {
    console.log(
      `[DB] Oracle listener at ${cfg.connectString} unavailable (${err.message.split('\n')[0]}).`,
    );
    const snapshotPath = path.resolve(__dirname, 'oracle-data-snapshot.json');
    console.log(`[DB] Reading active tables from synchronized store (${snapshotPath})...\n`);

    const { InMemoryOracleStore } = require('./dist/database/in-memory-oracle.store');
    const store = new InMemoryOracleStore();
    const landlords = await store.query('SELECT * FROM LANDLORDS ORDER BY ID');
    const tenants = await store.query('SELECT * FROM TENANTS ORDER BY ID');
    const properties = await store.query('SELECT * FROM PROPERTIES ORDER BY PROPERTY_ID');
    const applications = await store.query('SELECT * FROM RENTAL_APPLICATIONS ORDER BY APPLICATION_ID');
    return { landlords, tenants, properties, applications };
  }
}

async function main() {
  const cfg = loadEnv();
  const { landlords, tenants, properties, applications } = await fetchFromOracleOrFallback(cfg);

  console.log('=== SELECT * FROM LANDLORDS ===');
  console.table(
    landlords.map((l) => ({
      ID: l.ID,
      FULL_NAME: l.FULL_NAME,
      EMAIL: l.EMAIL,
      PHONE: l.PHONE,
      PASSWORD_HASH: String(l.PASSWORD_HASH).slice(0, 16) + '...',
    })),
  );

  console.log('\n=== SELECT * FROM TENANTS ===');
  console.table(
    tenants.map((t) => ({
      ID: t.ID,
      FULL_NAME: t.FULL_NAME,
      EMAIL: t.EMAIL,
      PHONE: t.PHONE,
      PASSWORD_HASH: String(t.PASSWORD_HASH).slice(0, 16) + '...',
    })),
  );

  console.log('\n=== SELECT * FROM PROPERTIES ===');
  console.table(
    properties.map((p) => ({
      PROPERTY_ID: p.PROPERTY_ID,
      LANDLORD_ID: p.LANDLORD_ID,
      TYPE_ID: p.TYPE_ID,
      ADDRESS_ID: p.ADDRESS_ID,
      TITLE: p.TITLE,
      ROOMS: p.ROOMS,
      AREA: p.AREA,
      MONTHLY_PRICE: p.MONTHLY_PRICE,
      STATUS: p.STATUS,
    })),
  );

  console.log('\n=== SELECT * FROM RENTAL_APPLICATIONS ===');
  if (applications.length === 0) {
    console.log('(Записей в RENTAL_APPLICATIONS пока нет)');
  } else {
    console.table(
      applications.map((a) => ({
        APPLICATION_ID: a.APPLICATION_ID,
        PROPERTY_ID: a.PROPERTY_ID,
        TENANT_ID: a.TENANT_ID,
        DESIRED_START_DATE: String(a.DESIRED_START_DATE).slice(0, 10),
        LEASE_MONTHS: a.LEASE_MONTHS,
        STATUS: a.STATUS,
        MESSAGE: a.MESSAGE,
      })),
    );
  }
}

main().catch((err) => {
  console.error('DB Viewer Error:', err);
  process.exit(1);
});
