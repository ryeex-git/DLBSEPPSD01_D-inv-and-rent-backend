/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}
  async log(itemId: number, action: string, actor?: string) {
    await this.prisma.auditLog.create({ data: { itemId, action, actor } });
  }
}
