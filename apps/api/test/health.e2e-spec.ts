import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('HealthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/health (GET) reports ok when the database is reachable', async () => {
    const response = await request(app.getHttpServer()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', database: 'connected' });
    expect(response.headers['content-type']).toContain('application/json');
  });

  it('/health (POST) is not a registered route', async () => {
    const response = await request(app.getHttpServer()).post('/health');

    expect(response.status).toBe(404);
  });

  it('/health/nested (GET) is not a registered route', async () => {
    const response = await request(app.getHttpServer()).get('/health/nested');

    expect(response.status).toBe(404);
  });

  it('/does-not-exist (GET) returns 404 for an unknown top-level route', async () => {
    const response = await request(app.getHttpServer()).get('/does-not-exist');

    expect(response.status).toBe(404);
  });
});
