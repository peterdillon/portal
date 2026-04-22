// core/interceptors/fake-backend.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

type FakeRole = 'Site Manager' | 'User Admin' | 'Auditor';

const rolePermissions: Record<FakeRole, string[]> = {
  'Site Manager': ['site.read', 'site.write', 'site.delete', 'user.read', 'config.read'],
  'User Admin': ['user.read', 'user.write', 'user.delete', 'config.write', 'audit.read'],
  'Auditor': ['site.read', 'user.read', 'audit.read', 'billing.read']
};

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.url.endsWith('/api/login') && request.method === 'POST') {
      const credentials = request.body as { username?: string } | null;
      const fakeUser = buildFakeUserClaims(credentials?.username);
      const token = createFakeJwt({
        sub: fakeUser.username,
        name: fakeUser.displayName,
        role: fakeUser.role,
        permissions: rolePermissions[fakeUser.role],
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        iat: Math.floor(Date.now() / 1000)
      });

      return of(new HttpResponse({ status: 200, body: { token } })).pipe(delay(500));
    }
    return next.handle(request);
  }
}   

function createFakeJwt(payload: Record<string, unknown>): string {
  const header = { alg: 'none', typ: 'JWT' };

  return `${encodeSegment(header)}.${encodeSegment(payload)}.`;
}

function buildFakeUserClaims(username?: string): { username: string; displayName: string; role: FakeRole } {
  const normalizedUsername = username?.trim().toLowerCase() || 'demo.user@company.com';

  if (normalizedUsername.includes('admin')) {
    return {
      username: normalizedUsername,
      displayName: 'User Admin Demo',
      role: 'User Admin'
    };
  }

  if (normalizedUsername.includes('audit')) {
    return {
      username: normalizedUsername,
      displayName: 'Audit Demo',
      role: 'Auditor'
    };
  }

  return {
    username: normalizedUsername,
    displayName: 'Site Manager Demo',
    role: 'Site Manager'
  };
}

function encodeSegment(value: Record<string, unknown>): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}