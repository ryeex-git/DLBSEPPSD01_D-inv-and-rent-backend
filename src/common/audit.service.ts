/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Einfacher Audit-Logger.
 *
 * Verantwortung:
 * - Persistiert Audit-Events in `auditLog` (DB).
 * - Keine eigene Fehlerbehandlung – DB-Fehler werden nach oben propagiert.
 *
 * Hinweise:
 * - Typische Actions: 'ITEM_CREATE', 'ITEM_UPDATE', 'ITEM_DELETE',
 *   'LOAN_ISSUE', 'LOAN_RETURN', 'RESERVATION_CREATE', 'RESERVATION_APPROVE', 'RESERVATION_CANCEL'.
 * - Für Konsistenz kannst du Actions später als Union/Enum zentralisieren.
 */
@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Schreibt einen Audit-Eintrag für ein Item.
   *
   * @param itemId  Ziel-Item-ID (> 0)
   * @param action  Kurzer, maschinenlesbarer Aktionscode (z. B. 'ITEM_UPDATE')
   * @param actor   Optional: Auslösender Nutzer/Service (z. B. 'admin', 'user')
   * @returns Promise, das sich erfüllt, sobald der Datensatz persistiert ist.
   */
  async log(itemId: number, action: string, actor?: string) {
    await this.prisma.auditLog.create({ data: { itemId, action, actor } });
  }
}
