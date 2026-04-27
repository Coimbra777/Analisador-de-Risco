import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { Response } from 'supertest';
import request from 'supertest';

import { HealthModule } from '../src/modules/health/health.module';

describe('Health (e2e smoke)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              app: {
                name: 'Test Supplier Risk',
                nodeEnv: 'test',
              },
            }),
          ],
        }),
        HealthModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns ok and metadata', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.status).toBe('ok');
        expect(res.body.service).toBe('Test Supplier Risk');
        expect(res.body.environment).toBe('test');
        expect(res.body.timestamp).toBeDefined();
      });
  });
});
