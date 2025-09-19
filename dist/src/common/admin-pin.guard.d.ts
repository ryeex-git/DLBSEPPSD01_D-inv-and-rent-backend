import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class AdminPinGuard implements CanActivate {
    canActivate(ctx: ExecutionContext): boolean;
}
