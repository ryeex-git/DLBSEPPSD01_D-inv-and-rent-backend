import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { LoansService } from './loans.service';
import { IssueLoanDto } from './dto/issue-load.dto';
import { ReturnLoanDto } from './dto/return-load.dto';
import { AdminPinGuard } from '../common/admin-pin.guard';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

/**
 * HTTP-Controller für Ausleihen (Admin-geschützt).
 *
 * Endpunkte:
 * - `POST /loans/issue`  – Item ausgeben (Loan anlegen)
 * - `POST /loans/return` – Item zurücknehmen (Loan schließen)
 *
 * @remarks
 * - Beide Endpunkte erfordern den Header **`x-admin-pin`** (Swagger Security: `AdminPin`).
 * - Validierung/Transformation via globaler `ValidationPipe`.
 */
@ApiTags('loans')
@ApiSecurity('AdminPin')
@Controller('loans')
@UseGuards(AdminPinGuard)
export class LoansController {
  constructor(private svc: LoansService) {}

  /**
   * Gibt ein Item aus (legt einen Loan an) und setzt den Item-Status auf `OUT`.
   *
   * Validiert:
   * - Item existiert & ist nicht bereits `OUT`
   * - `dueAt` liegt nach „jetzt“
   * - keine Kollision mit genehmigten Reservierungen
   */
  @Post('issue')
  @ApiOperation({ summary: 'Item ausgeben (Loan anlegen)' })
  @ApiCreatedResponse({ description: 'Loan angelegt (Item-Status → OUT)' })
  @ApiBadRequestResponse({
    description:
      'Item fehlt, bereits OUT, Fälligkeitsdatum ungültig oder Konflikt mit Reservierungen',
  })
  issue(@Body() dto: IssueLoanDto) {
    return this.svc.issue(dto);
  }

  /**
   * Nimmt ein Item zurück (offenen Loan schließen) und setzt den Item-Status auf `OK`.
   *
   * Validiert:
   * - Item existiert
   * - es gibt einen offenen Loan für dieses Item
   */
  @Post('return')
  @HttpCode(200)
  @ApiOperation({ summary: 'Item zurücknehmen (Loan schließen)' })
  @ApiOkResponse({ description: 'Loan geschlossen (Item-Status → OK)' })
  @ApiBadRequestResponse({
    description: 'Item fehlt oder kein offener Loan vorhanden',
  })
  returnItem(@Body() dto: ReturnLoanDto) {
    return this.svc.returnItem(dto);
  }
}
