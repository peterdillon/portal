// auth.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export interface AuthState {
  token: string | null;
  user: any; // Replace with your User interface
  isAuthenticated: boolean;
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
      return jwtDecode(token);
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

  // Expose user roles or other claims
  // userRole = computed(() => this._decodedToken()?.role || null);
  userRole = 'user'; // Placeholder, replace with actual role extraction logic

  constructor(private http: HttpClient, private router: Router) {}

 login(credentials: { username: string; password: string }) {
  return this.http.post<{ token: string }>('/api/login', credentials).pipe(
    tap((response) => {
      this.setToken(response.token);
      this.router.navigate(['/products']);
    })
  );
  // Returns an Observable
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