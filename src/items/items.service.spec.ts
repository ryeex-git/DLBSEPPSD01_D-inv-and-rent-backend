/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ItemsService } from './items.service';
import { PrismaService } from '../common/prisma.service';
import { createPrismaMock, PrismaMock } from '../../test/utils/prisma.mock';

describe('ItemsService', () => {
  let svc: ItemsService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
    svc = new ItemsService(prisma as unknown as PrismaService);
  });

  test('list() bildet WHERE/ORDER korrekt und liefert Mapping', async () => {
    prisma.item.findMany.mockResolvedValue([
      {
        id: 1,
        name: 'Akkuschrauber',
        inventoryNo: 'INV-1001',
        status: 'OK',
        categoryId: 1,
        category: { id: 1, name: 'Allgemein' },
      },
    ]);
    prisma.item.count.mockResolvedValue(1);

    const res = await svc.list({
      page: 0,
      pageSize: 10,
      sortBy: 'categoryName',
      sortDir: 'asc',
      search: 'akku',
      categoryId: 1,
      status: 'OK',
    });

    expect(prisma.item.findMany).toHaveBeenCalled();
    const args = prisma.item.findMany.mock.calls[0][0];
    expect(args.orderBy).toEqual({ category: { name: 'asc' } });
    expect(args.skip).toBe(0);
    expect(args.take).toBe(10);
    expect(args.where.AND).toBeTruthy();
    // Search erzeugt OR-Block
    const and = args.where.AND as any[];
    expect(and.some((b) => b.OR)).toBe(true);

    expect(res).toEqual({
      data: [
        {
          id: 1,
          name: 'Akkuschrauber',
          inventoryNo: 'INV-1001',
          status: 'OK',
          category: { id: 1, name: 'Allgemein' },
        },
      ],
      total: 1,
    });
  });

  test('getAvailability() mapt Loans & Reservierungen in Spannen', async () => {
    prisma.loan.findMany.mockResolvedValue([
      {
        issuedAt: new Date('2025-09-16T10:00:00Z'),
        dueAt: new Date('2025-09-18T10:00:00Z'),
        returnedAt: null,
        note: 'Ausgabe',
        userName: 'admin',
      },
    ]);
    prisma.reservation.findMany.mockResolvedValue([
      {
        startAt: new Date('2025-09-20T00:00:00Z'),
        endAt: new Date('2025-09-21T00:00:00Z'),
        status: 'APPROVED',
        note: 'user',
        userName: 'user',
      },
    ]);

    const spans = await svc.getAvailability(1, '2025-09-15', '2025-09-25');
    expect(spans).toHaveLength(2);
    expect(spans[0].type).toBe('LOAN');
    expect(spans[1].type).toBe('RESERVATION');
  });

  test('get() wirft 404 wenn Item fehlt', async () => {
    prisma.item.findUnique.mockResolvedValue(null);
    await expect(svc.get(999)).rejects.toThrow('Item not found');
  });
});
