/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateItemDto, UpdateItemDto } from './dto/create-item.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  async exists(id: number): Promise<boolean> {
    const x = await this.prisma.item.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!x;
  }

  async getAvailability(itemId: number, from: string, to: string) {
    const start = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(`${to}T00:00:00.000Z`);
    if (!(start < end)) throw new Error('Invalid range');

    const loans = await this.prisma.loan.findMany({
      where: {
        itemId,
        issuedAt: { lt: end },
        OR: [
          { returnedAt: { gt: start } },
          { AND: [{ returnedAt: null }, { dueAt: { gt: start } }] },
        ],
      },
      select: {
        issuedAt: true,
        dueAt: true,
        returnedAt: true,
        note: true,
        userName: true,
      },
      orderBy: { issuedAt: 'asc' },
    });

    const reservations = await this.prisma.reservation.findMany({
      where: {
        itemId,
        startAt: { lt: end },
        endAt: { gt: start },
      },
      select: {
        startAt: true,
        endAt: true,
        status: true,
        note: true,
        userName: true,
      },
      orderBy: { startAt: 'asc' },
    });

    const spans = [
      ...loans.map((l) => ({
        start: l.issuedAt.toISOString(),
        end: (l.returnedAt ?? l.dueAt ?? end).toISOString(),
        type: 'LOAN' as const,
        status: l.returnedAt ? 'RETURNED' : undefined,
        label: l.userName ?? l.note ?? 'Ausleihe',
      })),
      ...reservations.map((r) => ({
        start: r.startAt.toISOString(),
        end: r.endAt.toISOString(),
        type: 'RESERVATION' as const,
        status:
          (r.status as 'APPROVED' | 'PENDING' | 'CANCELLED' | undefined) ??
          undefined,
        label: r.userName ?? r.note ?? 'Reservierung',
      })),
    ];

    return spans;
  }

  async list(q: {
    page: number;
    pageSize: number;
    sortBy?: 'name' | 'status' | 'categoryName';
    sortDir?: 'asc' | 'desc';
    search?: string;
    categoryId?: number;
    status?: 'OK' | 'DEFECT' | 'OUT';
  }) {
    const skip = q.page * q.pageSize;
    const take = q.pageSize;

    // ---- WHERE bauen ----
    const AND: Prisma.ItemWhereInput[] = [];
    if (q.categoryId) AND.push({ categoryId: q.categoryId });
    if (q.status) AND.push({ status: q.status });

    if (q.search?.trim()) {
      const terms = q.search.trim().split(/\s+/).filter(Boolean);
      // Jeder Suchbegriff muss irgendwo vorkommen => AND von OR-Blöcken
      for (const t of terms) {
        AND.push({
          OR: [
            { name: { contains: t } }, // ⬅️ OHNE mode (SQLite)
            { inventoryNo: { contains: t } },
            { tagsCsv: { contains: t } },
            { category: { is: { name: { contains: t } } } }, // Relation filtern
          ],
        });
      }
    }

    const where: Prisma.ItemWhereInput = AND.length ? { AND } : {};

    // ---- ORDER BY ----
    const dir = q.sortDir ?? 'asc';
    let orderBy: Prisma.ItemOrderByWithRelationInput = { name: dir };
    switch (q.sortBy) {
      case 'status':
        orderBy = { status: dir };
        break;
      case 'categoryName':
        orderBy = { category: { name: dir } };
        break;
      default:
        orderBy = { name: dir };
    }

    // ---- Query & Count in Transaktion ----
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.item.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        orderBy,
        skip,
        take,
      }),
      this.prisma.item.count({ where }), // ⬅️ kein select/_count hier
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        name: r.name,
        inventoryNo: r.inventoryNo,
        status: r.status,
        category: r.category
          ? { id: r.category.id, name: r.category.name }
          : null,
      })),
      total,
    };
  }

  async get(id: number) {
    const it = await this.prisma.item.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!it) throw new NotFoundException('Item not found');
    return it;
  }

  async create(dto: CreateItemDto) {
    return this.prisma.item.create({ data: { ...dto } });
  }

  async update(id: number, dto: UpdateItemDto) {
    await this.get(id);
    return this.prisma.item.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.get(id);
    return this.prisma.item.delete({ where: { id } });
  }

  async history(id: number) {
    await this.get(id);
    return this.prisma.auditLog.findMany({
      where: { itemId: id },
      orderBy: { ts: 'desc' },
    });
  }
}
