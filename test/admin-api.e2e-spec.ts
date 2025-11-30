import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AdminApiController (e2e)', () => {
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

  describe('/api/admin/stats (GET)', () => {
    it('should return system statistics', () => {
      return request(app.getHttpServer())
        .get('/api/admin/stats')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('uptime');
          expect(res.body.data).toHaveProperty('memoryUsage');
          expect(res.body.data).toHaveProperty('totalDocuments');
          expect(res.body.data).toHaveProperty('totalPaths');
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });

  describe('/api/admin/extensions (GET)', () => {
    it('should return available extensions', () => {
      return request(app.getHttpServer())
        .get('/api/admin/extensions')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });

  describe('/api/admin/config (GET)', () => {
    it('should return current configuration', () => {
      return request(app.getHttpServer())
        .get('/api/admin/config')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('docsPath');
          expect(res.body.data).toHaveProperty('maxDocuments');
          expect(res.body.data).toHaveProperty('logLevel');
          expect(res.body.data).toHaveProperty('mcpMode');
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });

  describe('/api/admin/config (POST)', () => {
    it('should update configuration', () => {
      const newConfig = {
        docsPath: '/new/path',
      };

      return request(app.getHttpServer())
        .post('/api/admin/config')
        .send(newConfig)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('updated', true);
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });
});
