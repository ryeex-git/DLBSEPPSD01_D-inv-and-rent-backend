/* eslint-disable @typescript-eslint/no-unsafe-return */
import { AdminPinGuard } from './admin-pin.guard';
import { UnauthorizedException } from '@nestjs/common';

function makeCtx(headers: Record<string, any>) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as any;
}

describe('AdminPinGuard', () => {
  const OLD = process.env.ADMIN_PIN;

  beforeEach(() => {
    process.env.ADMIN_PIN = 'secret';
  });
  afterAll(() => {
    process.env.ADMIN_PIN = OLD;
  });

  test('erlaubt mit korrektem Header', () => {
    const guard = new AdminPinGuard();
    const ok = guard.canActivate(makeCtx({ 'x-admin-pin': 'secret' }));
    expect(ok).toBe(true);
  });

  test('konfigurationsfehler → 401', () => {
    process.env.ADMIN_PIN = '';
    const guard = new AdminPinGuard();
    expect(() =>
      guard.canActivate(makeCtx({ 'x-admin-pin': 'secret' })),
    ).toThrow(UnauthorizedException);
  });

  test('falscher PIN → 401', () => {
    const guard = new AdminPinGuard();
    expect(() => guard.canActivate(makeCtx({ 'x-admin-pin': 'nope' }))).toThrow(
      UnauthorizedException,
    );
  });
});
