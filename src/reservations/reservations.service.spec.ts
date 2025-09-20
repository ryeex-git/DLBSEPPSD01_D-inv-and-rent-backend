/* eslint-disable @typescript-eslint/unbound-method */
import { ReservationsService } from './reservations.service';
import { PrismaService } from '../common/prisma.service';
import { createPrismaMock, PrismaMock } from '../../test/utils/prisma.mock';
import { AuditService } from '../common/audit.service';
import { BadRequestException } from '@nestjs/common';

describe('ReservationsService', () => {
  let svc: ReservationsService;
  let prisma: PrismaMock;
  const audit = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as AuditService;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-09-16T10:00:00Z'));
    prisma = createPrismaMock();
    svc = new ReservationsService(prisma as unknown as PrismaService, audit);
  });

  test('create() validiert Item vorhanden', async () => {
    prisma.item.findUnique.mockResolvedValue(null);
    await expect(
      svc.create({
        itemId: 1,
        start: '2025-09-16T12:00:00Z',
        end: '2025-09-17T12:00:00Z',
      }),
    ).rejects.toThrow('Item not found');
  });

  test('create() invalid interval', async () => {
    prisma.item.findUnique.mockResolvedValue({ id: 1 });
    await expect(
      svc.create({
        itemId: 1,
        start: '2025-09-17T12:00:00Z',
        end: '2025-09-16T12:00:00Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  test('create() lehnt ab bei Overlap mit Loan/Res', async () => {
    prisma.item.findUnique.mockResolvedValue({ id: 1 });
    prisma.loan.findMany.mockResolvedValue([
      {
        issuedAt: new Date('2025-09-16T09:00:00Z'),
        dueAt: new Date('2025-09-16T13:00:00Z'),
        returnedAt: null,
      },
    ]);
    prisma.reservation.findMany.mockResolvedValue([]);

    await expect(
      svc.create({
        itemId: 1,
        start: '2025-09-16T12:00:00Z',
        end: '2025-09-16T14:00:00Z',
      }),
    ).rejects.toThrow('Item is on loan');
  });

  test('create() legt Reservierung an und loggt', async () => {
    prisma.item.findUnique.mockResolvedValue({ id: 1 });
    prisma.loan.findMany.mockResolvedValue([]);
    prisma.reservation.findMany.mockResolvedValue([]);
    prisma.reservation.create.mockResolvedValue({ id: 7 });

    const r = await svc.create({
      itemId: 1,
      start: '2025-09-17T12:00:00Z',
      end: '2025-09-17T14:00:00Z',
      userName: 'dom',
    });
    expect(prisma.reservation.create).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(1, 'RESERVATION_CREATE', 'dom');
    expect(r.id).toBe(7);
  });

  test('approve() prüft Overlaps und setzt Status', async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      id: 10,
      itemId: 1,
      startAt: new Date('2025-09-18T10:00:00Z'),
      endAt: new Date('2025-09-18T12:00:00Z'),
      status: 'PENDING',
      userName: 'u',
    });
    prisma.loan.findMany.mockResolvedValue([]);
    prisma.reservation.findMany.mockResolvedValue([]);
    prisma.reservation.update.mockResolvedValue({});

    await expect(svc.approve(10)).resolves.toBeUndefined();
    expect(prisma.reservation.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { status: 'APPROVED' },
    });
  });

  test('cancel() setzt Status CANCELLED', async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      id: 5,
      itemId: 1,
      userName: 'u',
    });
    prisma.reservation.update.mockResolvedValue({});

    await svc.cancel(5);
    expect(prisma.reservation.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { status: 'CANCELLED' },
    });
  });
});
