/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { CategoriesService } from './categories.service';
import { PrismaService } from '../common/prisma.service';
import { createPrismaMock, PrismaMock } from '../../test/utils/prisma.mock';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('CategoriesService', () => {
  let svc: CategoriesService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
    svc = new CategoriesService(prisma as unknown as PrismaService);
  });

  test('list() delegiert an Prisma', async () => {
    prisma.category.findMany.mockResolvedValue([{ id: 1, name: 'Allgemein' }]);
    const res = await svc.list();
    expect(res).toHaveLength(1);
    expect(prisma.category.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    });
  });

  test('create() validiert leeren Namen', async () => {
    await expect(svc.create('   ')).rejects.toThrow(BadRequestException);
  });

  test('create() mappt P2002 (unique) auf 400', async () => {
    prisma.category.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: 'x',
      } as any),
    );
    await expect(svc.create('Allgemein')).rejects.toThrow(BadRequestException);
  });

  test('remove() mappt P2025 (not found) auf 404', async () => {
    prisma.category.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('nf', {
        code: 'P2025',
        clientVersion: 'x',
      } as any),
    );
    await expect(svc.remove(999)).rejects.toThrow(NotFoundException);
  });
});
