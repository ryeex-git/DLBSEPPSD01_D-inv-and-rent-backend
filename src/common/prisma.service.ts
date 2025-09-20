/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Zentraler Prisma-Client als NestJS-Provider.
 *
 * Verantwortlichkeiten
 * - Baut die DB-Verbindung beim Modulstart auf.
 * - Trennt die Verbindung sauber beim Herunterfahren.
 *
 * Hinweise
 * - Binde diesen Service in ein gemeinsames Modul (z. B. `CommonModule`) ein und
 *   exportiere ihn, damit alle Feature-Module ihn injecten können.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  /**
   * Wird von Nest beim Modul-Initialisieren aufgerufen.
   * Stellt die DB-Verbindung her.
   */
  async onModuleInit() {
    await this.$connect();
  }
}
