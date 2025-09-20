/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Service für Kategorien.
 *
 * Verantwortlichkeiten:
 * - Kategorien listen, anlegen (mit Basiskontrolle) und löschen.
 * - Übersetzt DB-Fehler (Unique/Nicht gefunden) in sprechende HTTP-Fehler.
 */
@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Alle Kategorien alphabetisch.
   */
  list() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  /**
   * Legt eine neue Kategorie an.
   * - Trim + Mindestlänge
   * - Duplikate liefern 400 (sofern DB-Unique auf `name` gesetzt ist)
   */
  async create(name: string) {
    const n = (name ?? '').trim();
    if (n.length < 1) {
      throw new BadRequestException('Name der Kategorie darf nicht leer sein');
    }

    try {
      return await this.prisma.category.create({ data: { name: n } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        // Unique-Constraint verletzt (setze in Prisma-Schema: @@unique([name]) oder @unique)
        throw new BadRequestException('Kategorie existiert bereits');
      }
      throw e;
    }
  }

  /**
   * Löscht eine Kategorie.
   * - Nicht gefunden → 404
   */
  async remove(id: number) {
    try {
      return await this.prisma.category.delete({ where: { id } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException('Kategorie nicht gefunden');
      }
      throw e;
    }
  }
}
