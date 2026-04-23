// users.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '@users/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);

  getUsers() {
    return this.http.get<User[]>('/assets/iam/users.json');
  }
}