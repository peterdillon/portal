// core/interceptors/fake-backend.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpInterceptor, HttpResponse } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { delay } from 'rxjs/operators';

type DerivedRole = 'Site Manager' | 'User Admin' | 'Auditor' | 'Portal User';

interface FakeUserRecord {
  id: string;
  name: string;
  displayName: string;
  email: string;
  employeeName: string;
  employeeNumber: string;
  permissions: string[];
}

let fakeUsersPromise: Promise<FakeUserRecord[]> | null = null;

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.url.endsWith('/api/login') && request.method === 'POST') {
      const credentials = request.body as { username?: string } | null;
      return from(createLoginResponse(credentials?.username)).pipe(delay(500));
    }
    return next.handle(request);
  }
}   

function createFakeJwt(payload: Record<string, unknown>): string {
  const header = { alg: 'none', typ: 'JWT' };

  return `${encodeSegment(header)}.${encodeSegment(payload)}.`;
}

async function createLoginResponse(username?: string): Promise<HttpResponse<{ token: string }>> {
  const users = await loadFakeUsers();
  const fakeUser = findFakeUser(users, username);

  if (!fakeUser) {
    throw new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      error: { message: 'Invalid credentials' }
    });
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const token = createFakeJwt({
    sub: fakeUser.email,
    name: fakeUser.employeeName,
    displayName: fakeUser.displayName,
    employeeNumber: fakeUser.employeeNumber,
    role: deriveRole(fakeUser.permissions),
    permissions: fakeUser.permissions,
    exp: issuedAt + 60 * 60,
    iat: issuedAt
  });

  return new HttpResponse({ status: 200, body: { token } });
}

async function loadFakeUsers(): Promise<FakeUserRecord[]> {
  fakeUsersPromise ??= fetch('/assets/iam/users.json').then(async (response) => {
    if (!response.ok) {
      throw new Error('Unable to load users.json');
    }

    return response.json() as Promise<FakeUserRecord[]>;
  });

  return fakeUsersPromise;
}

function findFakeUser(users: FakeUserRecord[], username?: string): FakeUserRecord | null {
  const normalizedUsername = username?.trim().toLowerCase();

  if (!normalizedUsername) {
    return users[0] ?? null;
  }

  return users.find((user) => {
    const candidates = [user.email, user.name, user.displayName, user.employeeName];
    return candidates.some((candidate) => candidate.toLowerCase() === normalizedUsername);
  }) ?? null;
}

function deriveRole(permissions: string[]): DerivedRole {
  if (permissions.includes('user.write') || permissions.includes('user.delete')) {
    return 'User Admin';
  }

  if (permissions.includes('audit.read') && !permissions.includes('site.write')) {
    return 'Auditor';
  }

  if (permissions.includes('site.write')) {
    return 'Site Manager';
  }

  return 'Portal User';
}

function encodeSegment(value: Record<string, unknown>): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}