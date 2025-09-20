/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateItemDto, UpdateItemDto } from './dto/create-item.dto';
import { Prisma } from '@prisma/client';

/**
 * Service für Items (Inventar).
 *
 * Verantwortlichkeiten:
 * - Lesen/Anlegen/Aktualisieren/Löschen von Items.
 * - Paginierte Liste mit Filter/Suche/Sortierung.
 * - Historie (Audit-Logs) und Verfügbarkeits-Zeitachsen (Loans/Reservierungen).
 *
 * @remarks
 * - **Suche:** Für SQLite wird bewusst **ohne** `mode: 'insensitive'` gearbeitet.
 *   Case-Insensitive je nach DB ggf. per Collation/LOWER-Workaround lösen.
 * - **Zeitintervalle:** Halb-offen interpretiert `[start, end)`.
 * - **Transparenz:** `list()` nutzt eine Prisma-Transaktion für Daten + Count.
 */
@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Prüft, ob ein Item existiert.
   * @param id Item-ID
   * @returns `true`, wenn vorhanden.
   */
  async exists(id: number): Promise<boolean> {
    const x = await this.prisma.item.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!x;
  }

  /**
   * Liefert Zeitspannen (Loans/Reservierungen) für die Verfügbarkeitsanzeige eines Items.
   *
   * @param itemId Item-ID
   * @param from   Starttag (inklusive), `YYYY-MM-DD`
   * @param to     Endtag (exklusive), `YYYY-MM-DD`
   * @throws Error bei ungültigem Bereich (`from >= to`)
   * @returns Array vereinheitlichter Spannen { start, end, type, status?, label? }
   */
  async getAvailability(itemId: number, from: string, to: string) {
    const start = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(`${to}T00:00:00.000Z`);
    if (!(start < end)) throw new Error('Invalid range');

    // Loans, die das Fenster schneiden
    const loans = await this.prisma.loan.findMany({
      where: {
        itemId,
        issuedAt: { lt: end },
        OR: [
          { returnedAt: { gt: start } }, // bereits zurückgegeben, aber überlappt
          { AND: [{ returnedAt: null }, { dueAt: { gt: start } }] }, // noch offen
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

    // Reservierungen, die das Fenster schneiden
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

    // In gemeinsames Timeline-Format mappen
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

  /**
   * Liefert eine paginierte Liste von Items inkl. optionaler Filter/Suche/Sortierung.
   *
   * @param q Query-Objekt mit page, pageSize, sortBy, sortDir, search, categoryId, status
   * @returns `{ data, total }` – flache Datensätze fürs Frontend
   */
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
            { name: { contains: t } },
            { inventoryNo: { contains: t } },
            { tagsCsv: { contains: t } },
            { category: { is: { name: { contains: t } } } },
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
      this.prisma.item.count({ where }),
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

  /**
   * Holt ein einzelnes Item inkl. Kategorie.
   * @param id Item-ID
   * @throws NotFoundException wenn nicht vorhanden
   */
  async get(id: number) {
    const it = await this.prisma.item.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!it) throw new NotFoundException('Item not found');
    return it;
  }

  /**
   * Legt ein Item an.
   * @param dto Create-DTO
   */
  async create(dto: CreateItemDto) {
    return this.prisma.item.create({ data: { ...dto } });
  }

  /**
   * Aktualisiert ein Item.
   * @param id  Item-ID
   * @param dto Update-DTO
   * @throws NotFoundException wenn Item fehlt
   */
  async update(id: number, dto: UpdateItemDto) {
    await this.get(id);
    return this.prisma.item.update({ where: { id }, data: dto });
  }

  /**
   * Löscht ein Item.
   * @param id Item-ID
   * @throws NotFoundException wenn Item fehlt
   */
  async remove(id: number) {
    await this.get(id);
    return this.prisma.item.delete({ where: { id } });
  }

  /**
   * Liefert Audit-Historie zu einem Item (neueste zuerst).
   * @param id Item-ID
   * @throws NotFoundException wenn Item fehlt
   */
  async history(id: number) {
    await this.get(id);
    return this.prisma.auditLog.findMany({
      where: { itemId: id },
      orderBy: { ts: 'desc' },
    });
  }
}
