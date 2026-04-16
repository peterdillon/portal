// group-manager.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GroupManagerState, Group, User } from '../models/group-manager.model';

@Injectable({ providedIn: 'root' })
export class GroupManagerService {
  private http = inject(HttpClient);
  readonly users$ = this.http.get<Group[]>('/assets/group-data.json');
}