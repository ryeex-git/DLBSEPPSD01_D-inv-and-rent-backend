/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}
  list() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }
  create(name: string) {
    return this.prisma.category.create({ data: { name } });
  }
  remove(id: number) {
    return this.prisma.category.delete({ where: { id } });
  }
}
