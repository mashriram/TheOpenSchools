import type { ConfigService } from '@nestjs/config';

export interface MysqlDatabaseConfig {
  type: 'mysql';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  autoLoadEntities: true;
  synchronize: false;
  migrations: string[];
  charset: string;
}

/**
 * Pulled out of DatabaseModule so the env -> TypeORM options mapping is
 * unit-testable without booting a Nest module or a real DB connection.
 */
export function buildDatabaseConfig(
  config: Pick<ConfigService, 'get'>,
): MysqlDatabaseConfig {
  return {
    type: 'mysql',
    host: config.get<string>('DB_HOST', 'localhost'),
    port: parseDbPort(config.get<string>('DB_PORT', '3306')),
    username: config.get<string>('DB_USERNAME', 'root'),
    password: config.get<string>('DB_PASSWORD', ''),
    database: config.get<string>('DB_DATABASE', 'purpleschools'),
    autoLoadEntities: true,
    synchronize: false,
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    charset: 'utf8mb4',
  };
}

function parseDbPort(rawPort: string): number {
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(
      `DB_PORT must be a valid TCP port number, got "${rawPort}"`,
    );
  }

  return port;
}
