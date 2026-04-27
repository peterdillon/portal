import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';
import { PermissionGroup } from '@users/permission-group.model';

export interface PermissionCatalog {
  permissions: string[];
  permissionGroups: PermissionGroup[];
}

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private http = inject(HttpClient);

  getPermissionCatalog(): Observable<PermissionCatalog> {
    return forkJoin({
      permissions: this.http.get<string[]>('/assets/iam/permissions.json'),
      permissionGroups: this.http.get<PermissionGroup[]>('/assets/iam/permission-groups.json'),
    });
  }
}