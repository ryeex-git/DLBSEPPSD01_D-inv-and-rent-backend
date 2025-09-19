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

@Injectable()
export class LoansService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
    return aStart < bEnd && aEnd > bStart;
  }

  async issue(dto: IssueLoanDto) {
    const item = await this.prisma.item.findUnique({
      where: { id: dto.itemId },
    });
    if (!item) throw new BadRequestException('Item not found');
    if (item.status === 'OUT')
      throw new BadRequestException('Item already on loan');

    const issuedAt = new Date();
    const dueAt = new Date(dto.dueAt);
    if (!(issuedAt < dueAt)) throw new BadRequestException('Invalid due date');

    // Kollisionen mit bestehenden APPROVED Reservierungen prüfen
    const res = await this.prisma.reservation.findMany({
      where: { itemId: item.id, status: 'APPROVED' },
    });
    for (const r of res) {
      if (this.overlaps(issuedAt, dueAt, r.startAt, r.endAt)) {
        throw new BadRequestException('Conflicts with reservation');
      }
    }

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
