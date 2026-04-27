import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods, withState, patchState } from '@ngrx/signals';
import { withDevtools, withGlitchTracking } from '@angular-architects/ngrx-toolkit';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { PermissionGroup } from '@users/permission-group.model';
import { PermissionsService } from '@core/services/permissions.service';

interface PermissionEntry {
  name: string;
  groupName: string;
}

interface SavePermissionInput {
  originalPermission?: string | null;
  nextPermission: string;
  groupName: string;
}

const buildGroupPrefix = (groupName: string) => groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const normalizePermissionName = (groupName: string, permissionName: string) => {
  const trimmedPermissionName = permissionName.trim();

  if (!trimmedPermissionName) {
    return '';
  }

  if (trimmedPermissionName.includes('.')) {
    return trimmedPermissionName;
  }

  return `${buildGroupPrefix(groupName)}.${trimmedPermissionName}`;
};

interface PermissionsState {
  permissions: string[];
  permissionGroups: PermissionGroup[];
  sessionStorePermissionsLoaded: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: PermissionsState = {
  permissions: [],
  permissionGroups: [],
  sessionStorePermissionsLoaded: false,
  isLoading: false,
  error: null,
};

export const PermissionsStore = signalStore(
  { providedIn: 'root' },
  withDevtools('permissions-store', withGlitchTracking()),
  withState(initialState),
  withMethods((store, permissionsService = inject(PermissionsService)) => {
    const loadPermissions = rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => permissionsService.getPermissionCatalog()),
        tapResponse({
          next: ({ permissions, permissionGroups }) => {
            patchState(store, {
              permissions,
              permissionGroups,
              sessionStorePermissionsLoaded: true,
              isLoading: false,
              error: null,
            });
          },
          error: (err) => {
            const message = err instanceof Error ? err.message : 'Failed to load permissions';
            patchState(store, { error: message, isLoading: false });
          },
        })
      )
    );

    return {
      initialLoadPermissions: () => {
        if (!store.sessionStorePermissionsLoaded()) {
          loadPermissions();
        }
      },

      reloadPermissionsFromSource: () => {
        loadPermissions();
      },

      formatPermissionName: (groupName: string, permissionName: string) => normalizePermissionName(groupName, permissionName),

      savePermission: ({ originalPermission, nextPermission, groupName }: SavePermissionInput) => {
        const trimmedPermission = normalizePermissionName(groupName, nextPermission);
        const trimmedOriginalPermission = originalPermission?.trim() ?? null;
        const targetGroup = store.permissionGroups().find((group) => group.name === groupName);

        if (!trimmedPermission) {
          patchState(store, { error: 'Permission name is required' });
          return null;
        }

        if (!targetGroup) {
          patchState(store, { error: 'Select a permission category' });
          return null;
        }

        const hasDuplicate = store.permissions().some(
          (permission) => permission === trimmedPermission && permission !== trimmedOriginalPermission
        );

        if (hasDuplicate) {
          patchState(store, { error: 'Permission already exists' });
          return null;
        }

        const nextPermissions = trimmedOriginalPermission
          ? store.permissions().map((permission) => permission === trimmedOriginalPermission ? trimmedPermission : permission)
          : [trimmedPermission, ...store.permissions()];

        const dedupedPermissions = [...new Set(nextPermissions)];
        const nextPermissionGroups = store.permissionGroups().map((group) => {
          let permissions = group.permissions.filter(
            (permission) => permission !== trimmedOriginalPermission && permission !== trimmedPermission
          );

          if (group.name === groupName) {
            permissions = [trimmedPermission, ...permissions];
          }

          return { ...group, permissions };
        });

        patchState(store, {
          permissions: dedupedPermissions,
          permissionGroups: nextPermissionGroups,
          error: null,
        });

        return trimmedPermission;
      },

      removePermission: (permissionName: string) => {
        patchState(store, {
          permissions: store.permissions().filter((permission) => permission !== permissionName),
          permissionGroups: store.permissionGroups().map((group) => ({
            ...group,
            permissions: group.permissions.filter((permission) => permission !== permissionName),
          })),
          error: null,
        });
      },

      clearError: () => {
        patchState(store, { error: null });
      },

      loadPermissions,
    };
  }),
  withComputed((store) => ({
    permissionEntries: computed<PermissionEntry[]>(() =>
      store.permissions().map((permission) => ({
        name: permission,
        groupName: store.permissionGroups().find((group) => group.permissions.includes(permission))?.name ?? 'Ungrouped',
      }))
    ),
    categoryNames: computed(() => store.permissionGroups().map((group) => group.name)),
    hasLoadedCatalog: computed(() => store.sessionStorePermissionsLoaded() && store.permissionGroups().length > 0),
  }))
);