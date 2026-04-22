// group-manager.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Group, GroupManagerState, User } from '@group-manager/group-manager.model';

@Injectable({ providedIn: 'root' })
export class GroupManagerService {
  private http = inject(HttpClient);
  readonly users$ = this.http.get<Group[]>('/assets/iam/group-data.json');
}