import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { AuditService } from '../common/audit.service';
import { BadRequestException } from '@nestjs/common';

describe('ItemsController', () => {
  const svc = {
    list: jest.fn(),
    get: jest.fn(),
    exists: jest.fn(),
    getAvailability: jest.fn(),
    history: jest.fn(),
  } as unknown as ItemsService;
  const audit = { log: jest.fn() } as unknown as AuditService;
  const ctrl = new ItemsController(svc, audit);

  test('getAvailability() fordert from/to', async () => {
    await expect(
      ctrl.getAvailability(1, undefined as any, undefined as any),
    ).rejects.toThrow(BadRequestException);
  });

  test('getAvailability() happy path', async () => {
    (svc.exists as any) = jest.fn().mockResolvedValue(true);
    (svc.getAvailability as any) = jest.fn().mockResolvedValue([]);
    const r = await ctrl.getAvailability(1, '2025-09-15', '2025-10-06');
    expect(r).toEqual([]);
  });
});
