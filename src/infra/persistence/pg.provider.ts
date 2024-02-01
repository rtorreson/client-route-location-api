import { Pool, PoolClient, QueryResultRow } from 'pg';
import ENV from '@/infra/environments';
import { GlobalError } from '@/layer/errors';
import { Logger } from '@/layer';

class PgConnection {
  private static instance: PgConnection;
  private pool: Pool;
  private readonly logger: Logger;

  private constructor() {
    this.pool = new Pool({
      user: ENV.DATABASE.PG.USER,
      host: ENV.DATABASE.PG.HOST,
      database: ENV.DATABASE.PG.DB,
      password: ENV.DATABASE.PG.PASS,
      port: ENV.DATABASE.PG.PORT,
    });

    this.logger = new Logger();
  }

  static getInstance(): PgConnection {
    if (!PgConnection.instance) {
      PgConnection.instance = new PgConnection();
    }
    return PgConnection.instance;
  }

  async getClient(): Promise<PoolClient> {
    const client = await this.pool.connect();
    return client;
  }

  async release(client: PoolClient): Promise<void> {
    client.release();
  }

  async query<T extends QueryResultRow>({
    sql,
    values,
  }: {
    sql: string;
    values?: any[];
  }): Promise<QueryResultRow[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query<T>(sql, values);
      return result.rows;
    } catch (error: unknown) {
      if (error instanceof GlobalError) {
        this.logger.error(error.message);
      }
      throw error;
    } finally {
      this.release(client);
    }
  }
}

export default PgConnection;
