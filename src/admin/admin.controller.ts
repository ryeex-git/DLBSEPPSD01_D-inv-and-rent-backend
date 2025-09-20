import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminPinGuard } from '../common/admin-pin.guard';
import {
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

/**
 * Lightweight-Admin-Controller (PIN-geschützt) für Health-/Reachability-Checks
 * aus dem Frontend. Erwartet den Header `x-admin-pin`.
 */
@ApiTags('admin')
@ApiSecurity('AdminPin')
@UseGuards(AdminPinGuard)
@Controller('admin')
export class AdminController {
  /**
   * Einfache Erreichbarkeits-/Berechtigungsprüfung für Admin-Modus.
   * Gibt `{ ok: true }` zurück, wenn der PIN korrekt ist.
   */
  @Get('ping')
  @ApiOperation({ summary: 'Admin-Ping (prüft PIN & Erreichbarkeit)' })
  @ApiOkResponse({
    description: 'PIN gültig; Admin erreichbar',
    schema: { example: { ok: true } },
  })
  ping() {
    return { ok: true };
  }
}
