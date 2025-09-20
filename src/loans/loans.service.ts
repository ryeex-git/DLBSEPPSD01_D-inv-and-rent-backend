/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { IssueLoanDto } from './dto/issue-load.dto';
import { ReturnLoanDto } from './dto/return-load.dto';
import { AuditService } from '../common/audit.service';

/**
 * Service für Ausleihen (Loans).
 *
 * Verantwortlichkeiten:
 * - **Ausgabe** eines Items (Loan anlegen, Item-Status auf `OUT`, Kollisionsprüfung).
 * - **Rücknahme** eines Items (Loan schließen, Item-Status auf `OK`).
 * - Gemeinsame **Überlappungsprüfung** für Zeitintervalle.
 *
 * @remarks
 * - Zeitintervalle werden als **halb-offen** verstanden: `[start, end)`.
 * - Konsistenz der Statusänderungen (Item ↔ Loan) wird per **DB-Transaktion** sichergestellt.
 * - Admin-/Authentifizierungslogik liegt **außerhalb** dieses Services (z. B. Guard/Interceptor).
 */
@Injectable()
export class LoansService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Prüft, ob sich zwei Intervalle schneiden (halb-offen).
   * @param aStart Start A (inklusive)
   * @param aEnd   Ende A (exklusive)
   * @param bStart Start B (inklusive)
   * @param bEnd   Ende B (exklusive)
   * @returns `true`, wenn sich A und B überlappen.
   */
  private overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
    return aStart < bEnd && aEnd > bStart;
  }

  /**
   * Gibt ein Item aus (Loan anlegen).
   *
   * Validiert:
   * - Item existiert und ist nicht bereits `OUT`.
   * - Fälligkeit `dueAt` liegt **nach** `issuedAt` (jetzt).
   * - Keine Kollision mit **genehmigten Reservierungen** des Items.
   *
   * Änderungen (in Transaktion):
   * - `loan` wird erstellt (`issuedAt`, `dueAt`, optional `note`, `userName`).
   * - `item.status` → `OUT`.
   *
   * Audit: `LOAN_ISSUE`
   *
   * @param dto Eingabedaten für die Ausgabe.
   * @throws BadRequestException bei fehlendem Item, ungültigem Datum oder Konflikt.
   * @returns Erstellter Loan-Datensatz (Prisma-Entity).
   */
  async issue(dto: IssueLoanDto) {
    const item = await this.prisma.item.findUnique({
      where: { id: dto.itemId },
    });
    if (!item) throw new BadRequestException('Item not found');
    if (item.status === 'OUT')
      throw new BadRequestException('Item already on loan');

    // Ausgabezeitpunkt = jetzt; dueAt aus DTO
    const issuedAt = new Date();
    const dueAt = new Date(dto.dueAt);
    if (!(issuedAt < dueAt)) throw new BadRequestException('Invalid due date');

    // Konflikte mit APPROVED-Reservierungen im Zeitraum [issuedAt, dueAt) verhindern
    const res = await this.prisma.reservation.findMany({
      where: { itemId: item.id, status: 'APPROVED' },
    });
    for (const r of res) {
      if (this.overlaps(issuedAt, dueAt, r.startAt, r.endAt)) {
        throw new BadRequestException('Conflicts with reservation');
      }
    }

    // Konsistente Änderungen: Loan anlegen + Item-Status setzen
    const result = await this.prisma.$transaction(async (tx) => {
      const loan = await tx.loan.create({
        data: {
          itemId: item.id,
          issuedAt,
          dueAt,
          note: dto.note,
          userName: dto.userName ?? 'admin',
        },
      });
      await tx.item.update({ where: { id: item.id }, data: { status: 'OUT' } });
      return loan;
    });

    await this.audit.log(item.id, 'LOAN_ISSUE', dto.userName ?? 'admin');
    return result;
  }

  /**
   * Nimmt ein Item zurück (offenen Loan schließen).
   *
   * Validiert:
   * - Item existiert.
   * - Es gibt einen offenen Loan (`returnedAt = null`) für dieses Item.
   *
   * Änderungen (in Transaktion):
   * - Setzt `returnedAt` auf **jetzt**.
   * - `item.status` → `OK`.
   *
   * Audit: `LOAN_RETURN`
   *
   * @param dto Rücknahme-DTO (Item-ID).
   * @throws BadRequestException, wenn Item fehlt oder kein offener Loan vorhanden ist.
   * @returns Bestätigung mit `loanId` und `returnedAt`.
   */
  async returnItem(dto: ReturnLoanDto) {
    const item = await this.prisma.item.findUnique({
      where: { id: dto.itemId },
      include: { loans: true },
    });
    if (!item) throw new BadRequestException('Item not found');
    const open = await this.prisma.loan.findFirst({
      where: { itemId: item.id, returnedAt: null },
    });
    if (!open) throw new BadRequestException('No open loan');

    const now = new Date();
    const updatedLoan = await this.prisma.$transaction(async (tx) => {
      const loan = await tx.loan.update({
        where: { id: open.id },
        data: { returnedAt: now },
      });
      await tx.item.update({ where: { id: item.id }, data: { status: 'OK' } });
      return loan;
    });

    await this.audit.log(item.id, 'LOAN_RETURN', 'admin');
    return {
      ok: true,
      loanId: updatedLoan.id,
      returnedAt: updatedLoan.returnedAt,
    };
  }
}
