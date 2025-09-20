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

/**
 * Service für Reservierungen.
 *
 * Verantwortlichkeiten:
 * - Anlegen von Reservierungen inkl. **Konfliktprüfung** (gegen aktive Ausleihen und genehmigte Reservierungen).
 * - Auflisten (paginiert, sortiert, gefiltert nach Zeitraum/Status/Suche).
 * - Statuswechsel **APPROVE** / **CANCEL** inkl. Audit-Log.
 *
 * @remarks
 * - Zeitintervalle werden als **halb-offene Intervalle** verstanden: `[start, end)`.
 * - Die Volltextsuche nutzt `contains` (Prisma). Je nach DB-Provider kann `mode: 'insensitive'`
 *   nicht unterstützt sein (z. B. SQLite in älteren Setups) – ggf. auf `LOWER(...)`-Workarounds wechseln.
 */
@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Prüft, ob sich zwei Intervalle überlappen (halb-offen).
   *
   * @param aStart Start des Intervalls A (inklusive)
   * @param aEnd   Ende des Intervalls A (exklusive)
   * @param bStart Start des Intervalls B (inklusive)
   * @param bEnd   Ende des Intervalls B (exklusive)
   * @returns `true`, wenn sich A und B schneiden.
   */
  private overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
    return aStart < bEnd && aEnd > bStart;
  }

  /**
   * Legt eine neue Reservierung an.
   *
   * Validiert:
   * - Item existiert.
   * - Intervall ist gültig (`start < end`).
   * - Kein Konflikt mit aktiven **Ausleihen** oder bereits **genehmigten Reservierungen**.
   *
   * @param dto Eingabedaten (Item, Zeitraum, optional Notiz/Benutzername).
   * @throws BadRequestException bei ungültigem Intervall, fehlendem Item oder Konflikt.
   * @returns Die angelegte Reservierung (Prisma-Entity).
   */
  async create(dto: CreateReservationDto) {
    const item = await this.prisma.item.findUnique({
      where: { id: dto.itemId },
    });
    if (!item) throw new BadRequestException('Item not found');

    // Intervall validieren
    const start = new Date(dto.start);
    const end = new Date(dto.end);
    if (!(start < end)) throw new BadRequestException('Invalid interval');

    // Parallele Abfragen: aktive Loans + genehmigte Reservierungen
    const [loans, res] = await Promise.all([
      this.prisma.loan.findMany({
        where: { itemId: item.id, returnedAt: null },
      }),
      this.prisma.reservation.findMany({
        where: { itemId: item.id, status: 'APPROVED' },
      }),
    ]);

    // Gegen aktive Ausleihen prüfen
    for (const l of loans) {
      const lEnd = l.returnedAt ?? l.dueAt;
      if (this.overlaps(start, end, l.issuedAt, lEnd))
        throw new BadRequestException('Item is on loan');
    }
    // Gegen genehmigte Reservierungen prüfen
    for (const r of res) {
      if (this.overlaps(start, end, r.startAt, r.endAt))
        throw new BadRequestException('Time slot not available');
    }

    // Vereinfachung: auto-approve beim Anlegen
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

  /**
   * Hilfsfunktion: Baut UTC-Datum `YYYY-MM-DDT00:00:00.000Z`.
   * @param yyyyMmDd Datum im Format `YYYY-MM-DD`.
   */
  private toDateDayStart(yyyyMmDd: string) {
    return new Date(`${yyyyMmDd}T00:00:00.000Z`);
  }

  /**
   * Liefert eine paginierte Liste von Reservierungen.
   *
   * Filter:
   * - `status` (PENDING/APPROVED/CANCELLED)
   * - Zeitraumfenster `[from, to)` (Überlappung)
   * - `search` über `userName`, `note`, `item.name`, `item.inventoryNo`
   *
   * Sortierung:
   * - `startAt` (Default), `endAt`, `status`, `itemName`
   *
   * @param q Query-Parameter (Seite, Größe, Sortierung, Filter).
   * @throws BadRequestException bei ungültigem Datumsfenster.
   * @returns Objekt mit `data` (Zeilen) und `total` (Gesamtanzahl).
   */
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

      // Prisma-Bedingungen: startAt < end && endAt > start
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

    // Daten + Gesamtanzahl parallel holen
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

    // Flaches DTO für das Frontend
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

  /**
   * Genehmigt eine Reservierung.
   *
   * Vor dem Statuswechsel wird **erneut** auf Konflikte
   * mit Ausleihen und anderen genehmigten Reservierungen geprüft.
   *
   * @param id ID der Reservierung.
   * @throws NotFoundException wenn Eintrag fehlt.
   * @throws BadRequestException bei Konflikten oder unzulässigem Statuswechsel.
   */
  async approve(id: number) {
    const r = await this.prisma.reservation.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Reservation not found');
    if (r.status === 'CANCELLED')
      throw new BadRequestException('Cancelled reservation cannot be approved');

    // Erneut Overlap prüfen (Sicherheit, falls sich Bestand zwischenzeitlich änderte)
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

  /**
   * Storniert eine Reservierung (Status → `CANCELLED`) und schreibt ein Audit-Log.
   *
   * @param id ID der Reservierung.
   * @throws NotFoundException wenn Eintrag fehlt.
   */
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
