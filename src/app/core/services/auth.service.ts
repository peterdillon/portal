// auth.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

export interface AuthState {
  token: string | null;
  user: any; // Replace with your User interface
  isAuthenticated: boolean;
}

interface AuthTokenPayload extends JwtPayload {
  name?: string;
  role?: string;
  permissions?: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  getToken() {
    return this._token();
  }
  public _token = signal<string | null>(this.getTokenFromStorage());

  // Decode the JWT to get user info (e.g., roles)
  private _decodedToken = computed(() => {
    const token = this._token();
    if (!token) return null;
    try {
      return jwtDecode<AuthTokenPayload>(token);
    } catch {
      return null;
    }
  });

  // Compute isAuthenticated based on token presence and expiration
  isAuthenticated = computed(() => {
    const decoded = this._decodedToken();
    if (!decoded || !decoded.exp) return false;
    const isExpired = (decoded.exp * 1000) < Date.now();
    return !isExpired;
  });

  userDisplayName = computed(() => this._decodedToken()?.name ?? this._decodedToken()?.sub ?? null);
  userRole = computed(() => this._decodedToken()?.role ?? null);
  userPermissions = computed(() => this._decodedToken()?.permissions ?? []);
  private http = inject(HttpClient);
  private router = inject(Router);

  async login(credentials: { username: string; password: string }) {
    const response = await firstValueFrom(
      this.http.post<{ token: string }>('/api/login', credentials)
    );

    this.setToken(response.token);
    await this.router.navigate(['/products']);
  }

  logout() {
    this._token.set(null);
    localStorage.removeItem('auth_token'); // Or clear HttpOnly cookie via API call
    this.router.navigate(['/login']);
  }

  private setToken(token: string) {
    this._token.set(token);
    // Store in a more secure way (e.g., HttpOnly cookie via API)
    localStorage.setItem('auth_token', token); // For demo only
  }

  private getTokenFromStorage(): string | null {
    return localStorage.getItem('auth_token');
  }
}   