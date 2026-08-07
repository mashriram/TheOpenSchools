import { buildDatabaseConfig } from './database.config';

function fakeConfig(values: Record<string, string>) {
  return {
    get: <T>(key: string, defaultValue?: T): T =>
      (values[key] as unknown as T) ?? (defaultValue as T),
  };
}

describe('buildDatabaseConfig', () => {
  it('falls back to sensible local defaults when no env vars are set', () => {
    const options = buildDatabaseConfig(fakeConfig({}));

    expect(options).toMatchObject({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'purpleschools',
      autoLoadEntities: true,
      synchronize: false,
      charset: 'utf8mb4',
    });
  });

  it('uses every provided env value instead of the defaults', () => {
    const options = buildDatabaseConfig(
      fakeConfig({
        DB_HOST: 'db.internal',
        DB_PORT: '3307',
        DB_USERNAME: 'purple',
        DB_PASSWORD: 'secret',
        DB_DATABASE: 'purpleschools_test',
      }),
    );

    expect(options).toMatchObject({
      host: 'db.internal',
      port: 3307,
      username: 'purple',
      password: 'secret',
      database: 'purpleschools_test',
    });
  });

  it('parses DB_PORT into a real number, not the raw env string', () => {
    const options = buildDatabaseConfig(fakeConfig({ DB_PORT: '3307' }));

    expect(options.port).toBe(3307);
    expect(typeof options.port).toBe('number');
  });

  it('never enables synchronize, regardless of env, since migrations own the schema', () => {
    const options = buildDatabaseConfig(fakeConfig({}));

    expect(options.synchronize).toBe(false);
  });

  it('throws a clear error when DB_PORT is not numeric', () => {
    expect(() =>
      buildDatabaseConfig(fakeConfig({ DB_PORT: 'not-a-port' })),
    ).toThrow(/DB_PORT must be a valid TCP port number/);
  });

  it('throws when DB_PORT is zero', () => {
    expect(() => buildDatabaseConfig(fakeConfig({ DB_PORT: '0' }))).toThrow();
  });

  it('throws when DB_PORT is negative', () => {
    expect(() => buildDatabaseConfig(fakeConfig({ DB_PORT: '-1' }))).toThrow();
  });

  it('throws when DB_PORT exceeds the valid TCP port range', () => {
    expect(() =>
      buildDatabaseConfig(fakeConfig({ DB_PORT: '65536' })),
    ).toThrow();
  });

  it('throws when DB_PORT is a non-integer decimal', () => {
    expect(() =>
      buildDatabaseConfig(fakeConfig({ DB_PORT: '3306.5' })),
    ).toThrow();
  });

  it('accepts the maximum valid TCP port', () => {
    const options = buildDatabaseConfig(fakeConfig({ DB_PORT: '65535' }));

    expect(options.port).toBe(65535);
  });
});
