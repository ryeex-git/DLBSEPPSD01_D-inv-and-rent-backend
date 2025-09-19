/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AdminPinGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request & { headers: any }>();
    const pin = req.headers['x-admin-pin'];
    if (!process.env.ADMIN_PIN)
      throw new UnauthorizedException('Admin PIN not configured');
    if (!pin || pin !== process.env.ADMIN_PIN)
      throw new UnauthorizedException('Invalid Admin PIN');
    return true;
  }
}
