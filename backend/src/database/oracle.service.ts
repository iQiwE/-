import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import oracledb, { BindParameters, Connection, ExecuteManyOptions, Pool, Result } from 'oracledb';
import { InMemoryOracleStore } from './in-memory-oracle.store';

/** Соединение, переданное извне, означает выполнение внутри транзакции. */
export type TxConnection = Connection | { isMockTx: true };

/**
 * Единственная точка доступа к Oracle (SRP): пул соединений, запросы, транзакции.
 * При недоступности локального инстанса Oracle или ORACLE_MOCK=true автоматически
 * переключается на встроенное in-memory хранилище с эмуляцией таблиц Oracle.
 */
@Injectable()
export class OracleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OracleService.name);
  private pool?: Pool;
  private mockStore?: InMemoryOracleStore;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    if (this.config.get<string>('oracle.mock') === 'true') {
      this.enableMockMode('ORACLE_MOCK=true');
      return;
    }

    try {
      oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
      oracledb.fetchAsString = [oracledb.CLOB];

      this.pool = await oracledb.createPool({
        user: this.config.get<string>('oracle.user'),
        password: this.config.get<string>('oracle.password'),
        connectString: this.config.get<string>('oracle.connectString'),
        poolMin: 1,
        poolMax: this.config.get<number>('oracle.poolMax') ?? 10,
        poolIncrement: 1,
         connectTimeout: 3,
      });

      const conn = await this.pool.getConnection();
      await conn.close();
      this.logger.log('Oracle connection pool created');
    } catch (err: any) {
      await this.pool?.close(0).catch(() => {});
      this.pool = undefined;
      this.enableMockMode(err?.message ?? 'Oracle unavailable');
    }
  }

  private enableMockMode(reason: string): void {
    this.mockStore = new InMemoryOracleStore();
    this.logger.warn(`Oracle fallback store enabled (${reason})`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.close(10);
  }

  /** SELECT-запрос. Возвращает строки в виде объектов (ключи в UPPER CASE). */
  async query<T>(sql: string, binds: BindParameters = {}, tx?: TxConnection): Promise<T[]> {
    if (this.mockStore) return this.mockStore.query<T>(sql, binds as Record<string, any>);
    return this.withConnection(tx as Connection | undefined, async (conn) => {
      const result = await conn.execute<T>(sql, binds);
      return result.rows ?? [];
    });
  }

  /** DML-запрос. Вне транзакции фиксируется сразу (autoCommit). */
  async execute(sql: string, binds: BindParameters = {}, tx?: TxConnection): Promise<Result<unknown>> {
    if (this.mockStore) return this.mockStore.execute(sql, binds as Record<string, any>);
    return this.withConnection(tx as Connection | undefined, (conn) =>
      conn.execute(sql, binds, { autoCommit: !tx }),
    );
  }

  /** Пакетный DML (array binding) — одна сетевая операция на N строк. */
  async executeMany(sql: string, binds: BindParameters[], options: ExecuteManyOptions, tx?: TxConnection) {
    if (this.mockStore) return this.mockStore.executeMany(sql, binds as Record<string, any>[]);
    return this.withConnection(tx as Connection | undefined, (conn) =>
      conn.executeMany(sql, binds, { ...options, autoCommit: !tx }),
    );
  }

  /** Выполняет work в одной транзакции: COMMIT при успехе, ROLLBACK при ошибке. */
  async transaction<T>(work: (tx: TxConnection) => Promise<T>): Promise<T> {
    if (this.mockStore) return this.mockStore.transaction(() => work({ isMockTx: true }));
    const connection = await this.pool!.getConnection();
    try {
      const result = await work(connection);
      await connection.commit();
      return result;
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      throw error;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  private async withConnection<T>(tx: Connection | undefined, fn: (c: Connection) => Promise<T>): Promise<T> {
    if (tx) return fn(tx);
    const conn = await this.pool!.getConnection();
    try {
      return await fn(conn);
    } finally {
      await conn.close();
    }
  }
}
