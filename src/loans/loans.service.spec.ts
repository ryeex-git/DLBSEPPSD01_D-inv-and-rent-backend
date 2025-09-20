/* eslint-disable @typescript-eslint/unbound-method */
import { LoansService } from './loans.service';
import { PrismaService } from '../common/prisma.service';
import { createPrismaMock, PrismaMock } from '../../test/utils/prisma.mock';
import { AuditService } from '../common/audit.service';
import { BadRequestException } from '@nestjs/common';

describe('LoansService', () => {
  let svc: LoansService;
  let prisma: PrismaMock;
  const audit = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as AuditService;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-09-16T10:00:00Z'));
    prisma = createPrismaMock();
    svc = new LoansService(prisma as unknown as PrismaService, audit);
  });

  test('issue() validiert Item und Status', async () => {
    prisma.item.findUnique.mockResolvedValue(null);
    await expect(
      svc.issue({ itemId: 99, dueAt: '2025-09-17T10:00:00Z' }),
    ).rejects.toThrow('Item not found');

    prisma.item.findUnique.mockResolvedValue({ id: 1, status: 'OUT' });
    await expect(
      svc.issue({ itemId: 1, dueAt: '2025-09-17T10:00:00Z' }),
    ).rejects.toThrow('Item already on loan');
  });

  test('issue() invalid due date', async () => {
    prisma.item.findUnique.mockResolvedValue({ id: 1, status: 'OK' });
    await expect(
      svc.issue({ itemId: 1, dueAt: '2025-09-16T09:59:00Z' }),
    ).rejects.toThrow(BadRequestException);
  });

  test('issue() prüft Konflikt mit APPROVED Reservierung', async () => {
    prisma.item.findUnique.mockResolvedValue({ id: 1, status: 'OK' });
    prisma.reservation.findMany.mockResolvedValue([
      {
        startAt: new Date('2025-09-16T09:00:00Z'),
        endAt: new Date('2025-09-17T12:00:00Z'),
      },
    ]);
    await expect(
      svc.issue({ itemId: 1, dueAt: '2025-09-16T12:00:00Z' }),
    ).rejects.toThrow('Conflicts with reservation');
  });

  test('issue() legt Loan an, setzt Status OUT, loggt', async () => {
    prisma.item.findUnique.mockResolvedValue({ id: 1, status: 'OK' });
    prisma.reservation.findMany.mockResolvedValue([]);
    prisma.loan.create.mockResolvedValue({ id: 42 });
    prisma.item.update.mockResolvedValue({});

    const r = await svc.issue({
      itemId: 1,
      dueAt: '2025-09-17T10:00:00Z',
      userName: 'dom',
    });
    expect(prisma.loan.create).toHaveBeenCalled();
    expect(prisma.item.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: 'OUT' },
    });
    expect(audit.log).toHaveBeenCalledWith(1, 'LOAN_ISSUE', 'dom');
    expect(r.id).toBe(42);
  });

  test('returnItem() schließt offenen Loan und setzt Status OK', async () => {
    prisma.item.findUnique.mockResolvedValue({ id: 1, loans: [] });
    prisma.loan.findFirst.mockResolvedValue({
      id: 77,
      itemId: 1,
      returnedAt: null,
    });
    prisma.loan.update.mockResolvedValue({
      id: 77,
      returnedAt: new Date('2025-09-16T12:00:00Z'),
    });
    prisma.item.update.mockResolvedValue({});

    const r = await svc.returnItem({ itemId: 1 });
    expect(prisma.loan.update).toHaveBeenCalled();
    expect(prisma.item.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: 'OK' },
    });
    expect(r.ok).toBe(true);
  });
});
