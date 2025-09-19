/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { AuditService } from '../common/audit.service';

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
    return aStart < bEnd && aEnd > bStart;
  }

  async create(dto: CreateReservationDto) {
    const item = await this.prisma.item.findUnique({
      where: { id: dto.itemId },
    });
    if (!item) throw new BadRequestException('Item not found');

    const start = new Date(dto.start);
    const end = new Date(dto.end);
    if (!(start < end)) throw new BadRequestException('Invalid interval');

    const [loans, res] = await Promise.all([
      this.prisma.loan.findMany({
        where: { itemId: item.id, returnedAt: null },
      }),
      this.prisma.reservation.findMany({
        where: { itemId: item.id, status: 'APPROVED' },
      }),
    ]);

    for (const l of loans) {
      const lEnd = l.returnedAt ?? l.dueAt;
      if (this.overlaps(start, end, l.issuedAt, lEnd))
        throw new BadRequestException('Item is on loan');
    }
    for (const r of res) {
      if (this.overlaps(start, end, r.startAt, r.endAt))
        throw new BadRequestException('Time slot not available');
    }

    const created = await this.prisma.reservation.create({
      data: {
        itemId: item.id,
        startAt: start,
        endAt: end,
        status: 'APPROVED',
        note: dto.note,
        userName: dto.userName ?? 'user',
      },
    });
    await this.audit.log(item.id, 'RESERVATION_CREATE', dto.userName ?? 'user');
    return created;
  }

  private toDateDayStart(yyyyMmDd: string) {
    return new Date(`${yyyyMmDd}T00:00:00.000Z`);
  }

  async list(q: {
    page: number;
    pageSize: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    search?: string;
    status?: 'PENDING' | 'APPROVED' | 'CANCELLED';
    from?: string;
    to?: string;
  }) {
    const skip = q.page * q.pageSize;
    const take = q.pageSize;

    const AND: any[] = [];
    if (q.status) AND.push({ status: q.status });

    // Überlappung mit Fenster [from,to)
    if (q.from || q.to) {
      const start = q.from ? this.toDateDayStart(q.from) : undefined;
      const end = q.to ? this.toDateDayStart(q.to) : undefined;
      if (start && end && !(start < end))
        throw new BadRequestException('Invalid range');
      const cond: any[] = [];
      if (end) cond.push({ startAt: { lt: end } });
      if (start) cond.push({ endAt: { gt: start } });
      if (cond.length) AND.push({ AND: cond });
    }

    // Suche in item.name, item.inventoryNo, userName, note
    const OR: any[] = [];
    if (q.search) {
      const s = q.search;
      OR.push(
        { userName: { contains: s, mode: 'insensitive' } },
        { note: { contains: s, mode: 'insensitive' } },
        { item: { name: { contains: s, mode: 'insensitive' } } },
        { item: { inventoryNo: { contains: s, mode: 'insensitive' } } },
      );
    }

    const where: any = {};
    if (AND.length) where.AND = AND;
    if (OR.length) where.OR = OR;

    // Sortierung
    const dir = q.sortDir ?? 'asc';
    let orderBy: any = { startAt: dir };
    switch (q.sortBy) {
      case 'endAt':
        orderBy = { endAt: dir };
        break;
      case 'status':
        orderBy = { status: dir };
        break;
      case 'itemName':
        orderBy = { item: { name: dir } };
        break;
    }

    const [rows, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        include: {
          item: { select: { id: true, name: true, inventoryNo: true } },
        },
        orderBy,
        skip,
        take,
      }),
      this.prisma.reservation.count({ where }),
    ]);

    const data = rows.map((r) => ({
      id: r.id,
      itemId: r.itemId,
      itemName: r.item?.name ?? '',
      inventoryNo: r.item?.inventoryNo ?? '',
      userName: r.userName ?? null,
      startAt: r.startAt.toISOString(),
      endAt: r.endAt.toISOString(),
      status: r.status as 'PENDING' | 'APPROVED' | 'CANCELLED',
      note: r.note ?? null,
    }));

    return { data, total };
  }

  async approve(id: number) {
    const r = await this.prisma.reservation.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Reservation not found');
    if (r.status === 'CANCELLED')
      throw new BadRequestException('Cancelled reservation cannot be approved');

    // Erneut Overlap prüfen
    const [loans, res] = await Promise.all([
      this.prisma.loan.findMany({ where: { itemId: r.itemId } }),
      this.prisma.reservation.findMany({
        where: { itemId: r.itemId, status: 'APPROVED', id: { not: r.id } },
      }),
    ]);
    for (const l of loans) {
      const lEnd = l.returnedAt ?? l.dueAt;
      if (!lEnd) continue;
      if (this.overlaps(r.startAt, r.endAt, l.issuedAt, lEnd)) {
        throw new BadRequestException('Item is on loan in that period');
      }
    }
    for (const o of res) {
      if (this.overlaps(r.startAt, r.endAt, o.startAt, o.endAt)) {
        throw new BadRequestException('Time slot not available');
      }
    }

    await this.prisma.reservation.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
    await this.audit?.log(
      r.itemId,
      'RESERVATION_APPROVE',
      r.userName ?? 'user',
    );
  }

  async cancel(id: number) {
    const r = await this.prisma.reservation.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Reservation not found');

    await this.prisma.reservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    await this.audit?.log(r.itemId, 'RESERVATION_CANCEL', r.userName ?? 'user');
  }
}
