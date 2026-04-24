import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withHooks, withMethods, withState, patchState } from '@ngrx/signals';
import { withDevtools, withGlitchTracking } from '@angular-architects/ngrx-toolkit';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { SitesStore } from '@site-manager/sites.store';
import { Site } from '@site-manager/site.model';
import { UsersStore } from '@users/users.store';
import { User } from '@users/user.model';

interface SiteUserManagerState {
  selectedSiteId: number | null;
  selectedUserIds: string[];
  isSaving: boolean;
  error: string | null;
  modifiedSiteIds: Set<number>;
}

export const SiteUserManagerStore = signalStore(
  { providedIn: 'root' },
  withDevtools('site-user-manager-store', withGlitchTracking()),
  withState<SiteUserManagerState>({
    selectedSiteId: null,
    selectedUserIds: [],
    isSaving: false,
    error: null,
    modifiedSiteIds: new Set<number>(),
  }),
  withMethods((store, usersStore = inject(UsersStore)) => {
    const findUserById = (id: string) => usersStore['userEntities']().find((user) => user.id === id);

    return {
      selectSite: (siteId: number | null) => {
        patchState(store, { selectedSiteId: siteId, selectedUserIds: [] });
      },

      toggleUserSelection: (userId: string) => {
        patchState(store, {
          selectedUserIds: store.selectedUserIds().includes(userId)
            ? store.selectedUserIds().filter((id) => id !== userId)
            : [...store.selectedUserIds(), userId],
        });
      },

      selectAllUsersInSite: () => {
        const siteId = store.selectedSiteId();
        if (siteId == null) {
          return;
        }

        const userIds = usersStore['userEntities']()
          .filter((user) => Number(user.siteId) === siteId)
          .map((user) => user.id);

        patchState(store, { selectedUserIds: userIds });
      },

      deselectAllUsers: () => {
        patchState(store, { selectedUserIds: [] });
      },

      addUsersToSite: () => {
        const siteId = store.selectedSiteId();
        const userIds = store.selectedUserIds();

        if (siteId == null || userIds.length === 0) {
          return;
        }

        userIds.forEach((userId) => {
          const user = findUserById(userId);
          if (user && Number(user.siteId) !== siteId) {
            usersStore.updateUser({ ...user, siteId: String(siteId) });
          }
        });

        patchState(store, {
          modifiedSiteIds: new Set([...store.modifiedSiteIds(), siteId]),
          selectedUserIds: [],
        });
      },

      removeUsersFromSite: () => {
        const siteId = store.selectedSiteId();
        const userIds = store.selectedUserIds();

        if (siteId == null || userIds.length === 0) {
          return;
        }

        userIds.forEach((userId) => {
          const user = findUserById(userId);
          if (user && Number(user.siteId) === siteId) {
            usersStore.updateUser({ ...user, siteId: '0' });
          }
        });

        patchState(store, {
          modifiedSiteIds: new Set([...store.modifiedSiteIds(), siteId]),
          selectedUserIds: [],
        });
      },

      saveChanges: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isSaving: true, error: null })),
          switchMap(() => new Promise<void>((resolve) => {
            setTimeout(() => resolve(), 500);
          })),
          tapResponse({
            next: () => {
              patchState(store, { modifiedSiteIds: new Set<number>(), isSaving: false });
            },
            error: (err) => {
              const message = err instanceof Error ? err.message : 'Failed to save site assignments';
              patchState(store, { error: message, isSaving: false });
            },
          })
        )
      ),

      discardChanges: () => {
        patchState(store, {
          modifiedSiteIds: new Set<number>(),
          selectedUserIds: [],
          selectedSiteId: null,
        });
        usersStore.reloadUsers();
      },

      clearError: () => {
        patchState(store, { error: null });
      },
    };
  }),
  withComputed((store) => {
    const sitesStore = inject(SitesStore);
    const usersStore = inject(UsersStore);

    const sites = computed(() => sitesStore.sites());
    const allUsers = computed(() => usersStore['userEntities']() as User[]);
    const selectedSite = computed(() => {
      const siteId = store.selectedSiteId();
      return siteId == null ? null : sites().find((site) => site.id === siteId) ?? null;
    });
    const siteUsers = computed(() => {
      const siteId = store.selectedSiteId();
      if (siteId == null) {
        return [] as User[];
      }

      return allUsers().filter((user) => Number(user.siteId) === siteId);
    });
    const availableUsers = computed(() => {
      const siteId = store.selectedSiteId();
      if (siteId == null) {
        return allUsers();
      }

      return allUsers().filter((user) => Number(user.siteId) !== siteId);
    });
    const hasChanges = computed(() => store.modifiedSiteIds().size > 0);
    const modifiedSiteCount = computed(() => store.modifiedSiteIds().size);
    const canAddSelectedUsers = computed(() => {
      const siteId = store.selectedSiteId();
      if (siteId == null) {
        return false;
      }

      return store.selectedUserIds().some((userId) => {
        const user = allUsers().find((candidate) => candidate.id === userId);
        return !!user && Number(user.siteId) !== siteId;
      });
    });
    const canRemoveSelectedUsers = computed(() => {
      const siteId = store.selectedSiteId();
      if (siteId == null) {
        return false;
      }

      return store.selectedUserIds().some((userId) => {
        const user = allUsers().find((candidate) => candidate.id === userId);
        return !!user && Number(user.siteId) === siteId;
      });
    });
    const areAllSiteUsersSelected = computed(() => {
      const selectedIds = store.selectedUserIds();
      const users = siteUsers();
      return !!users.length && users.every((user) => selectedIds.includes(user.id));
    });

    return {
      sites,
      selectedSite,
      siteUsers,
      availableUsers,
      hasChanges,
      modifiedSiteCount,
      canAddSelectedUsers,
      canRemoveSelectedUsers,
      areAllSiteUsersSelected,
    };
  }),
  withHooks({
    onInit() {
      const usersStore = inject(UsersStore);
      usersStore.ensureUsersLoaded();
    },
  })
);