/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Guard für Admin-Endpunkte auf Basis eines statischen PIN-Headers.
 *
 * Erwartet den HTTP-Header: `x-admin-pin`.
 * Vergleicht den Wert konstantzeitlich mit `process.env.ADMIN_PIN`.
 *
 * Sicherheit/Fehlerbilder:
 * - Fehlende Server-Config ⇒ 401 "Admin PIN not configured"
 * - Falscher/fehlender Header ⇒ 401 "Invalid Admin PIN"
 *
 * Hinweis:
 * - Der Guard macht absichtlich *keine* Persistenz/Session – nur Header-Prüfung.
 * - Frontend sendet den Header z. B. via HTTP-Interceptor.
 */
@Injectable()
export class AdminPinGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request & { headers: any }>();
    // Header robust auslesen (string | string[] | undefined)
    const pin = req.headers['x-admin-pin'];
    if (!process.env.ADMIN_PIN)
      throw new UnauthorizedException('Admin PIN not configured');
    if (!pin || pin !== process.env.ADMIN_PIN)
      throw new UnauthorizedException('Invalid Admin PIN');
    return true;
  }
}
