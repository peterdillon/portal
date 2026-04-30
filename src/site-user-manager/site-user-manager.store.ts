import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withHooks, withMethods, withState, patchState } from '@ngrx/signals';
import { withDevtools, withGlitchTracking } from '@angular-architects/ngrx-toolkit';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { SitesStore } from '@site-manager/sites.store';
import { waitForDemoSaveDelay } from '../app/shared/demo-save-delay';
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
  withMethods((store, usersStore = inject(UsersStore), sitesStore = inject(SitesStore)) => {
    const findUserById = (id: string) => usersStore['userEntities']().find((user) => user.id === id);
    const getActiveSelectedSiteId = () => {
      const siteId = store.selectedSiteId();

      if (siteId == null) {
        return null;
      }

      return sitesStore.sites().some((site) => site.id === siteId) ? siteId : null;
    };

    return {
      selectSite: (siteId: number | null) => {
        const nextSelectedSiteId = siteId != null && sitesStore.sites().some((site) => site.id === siteId)
          ? siteId
          : null;

        patchState(store, { selectedSiteId: nextSelectedSiteId, selectedUserIds: [] });
      },

      toggleUserSelection: (userId: string) => {
        if (getActiveSelectedSiteId() == null) {
          return;
        }

        patchState(store, {
          selectedUserIds: store.selectedUserIds().includes(userId)
            ? store.selectedUserIds().filter((id) => id !== userId)
            : [...store.selectedUserIds(), userId],
        });
      },

      selectAllUsersInSite: () => {
        const siteId = getActiveSelectedSiteId();
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
        const siteId = getActiveSelectedSiteId();
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
        const siteId = getActiveSelectedSiteId();
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
          switchMap(() => waitForDemoSaveDelay()),
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
        usersStore.reloadUsersFromSource();
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
    const activeModifiedSiteIds = computed(() => {
      const activeSiteIds = new Set(sites().map((site) => site.id));

      return new Set(
        [...store.modifiedSiteIds()].filter((siteId) => activeSiteIds.has(siteId))
      );
    });
    const allUsers = computed(() => usersStore['userEntities']() as User[]);
    const activeSelectedSiteId = computed(() => {
      const siteId = store.selectedSiteId();
      return siteId != null && sites().some((site) => site.id === siteId) ? siteId : null;
    });
    const selectedSite = computed(() => {
      const siteId = activeSelectedSiteId();
      return siteId == null ? null : sites().find((site) => site.id === siteId) ?? null;
    });
    const siteUsers = computed(() => {
      const siteId = activeSelectedSiteId();
      if (siteId == null) {
        return [] as User[];
      }

      return allUsers().filter((user) => Number(user.siteId) === siteId);
    });
    const availableUsers = computed(() => {
      const siteId = activeSelectedSiteId();
      if (siteId == null) {
        return allUsers();
      }

      return allUsers().filter((user) => Number(user.siteId) !== siteId);
    });
    const hasChanges = computed(() => activeModifiedSiteIds().size > 0);
    const modifiedSiteCount = computed(() => activeModifiedSiteIds().size);
    const canAddSelectedUsers = computed(() => {
      const siteId = activeSelectedSiteId();
      if (siteId == null) {
        return false;
      }

      return store.selectedUserIds().some((userId) => {
        const user = allUsers().find((candidate) => candidate.id === userId);
        return !!user && Number(user.siteId) !== siteId;
      });
    });
    const canRemoveSelectedUsers = computed(() => {
      const siteId = activeSelectedSiteId();
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
    const hasSelectedSite = computed(() => activeSelectedSiteId() !== null);

    return {
      sites,
      activeModifiedSiteIds,
      activeSelectedSiteId,
      hasSelectedSite,
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
      usersStore.initialLoadUsers();
    },
  })
);