import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AdminController } from '../src/admin/admin.controller';
import { AdminPinGuard } from '../src/common/admin-pin.guard';

describe('Admin e2e', () => {
  let app: INestApplication;
  const OLD = process.env.ADMIN_PIN;

  beforeAll(async () => {
    process.env.ADMIN_PIN = 'secret';
    const mod = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [AdminPinGuard],
    }).compile();

    app = mod.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    process.env.ADMIN_PIN = OLD;
    await app.close();
  });

  it('401 ohne PIN', async () => {
    await request(app.getHttpServer()).get('/admin/ping').expect(401);
  });

  it('200 mit PIN', async () => {
    await request(app.getHttpServer())
      .get('/admin/ping')
      .set('x-admin-pin', 'secret')
      .expect(200, { ok: true });
  });
});
