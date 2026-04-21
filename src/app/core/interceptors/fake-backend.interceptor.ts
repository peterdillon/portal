// core/interceptors/fake-backend.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.url.endsWith('/api/login') && request.method === 'POST') {
      const credentials = request.body as { username?: string } | null;
      const token = createFakeJwt({
        sub: credentials?.username ?? 'demo.user@company.com',
        role: 'user',
        permissions: ['site.read', 'user.read'],
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

function encodeSegment(value: Record<string, unknown>): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}