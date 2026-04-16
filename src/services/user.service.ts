// users.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  readonly users$ = this.http.get<User[]>('/assets/users.json');
}