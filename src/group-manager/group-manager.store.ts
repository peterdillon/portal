import { signalStore, withState, withMethods, withComputed, withHooks, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { computed } from '@angular/core';
import { withDevtools, withGlitchTracking } from '@angular-architects/ngrx-toolkit';
import { Group, GroupManagerState, User } from '@group-manager/group-manager.model';
import { UsersStore } from '@users/users.store';

export const GroupManagerStore = signalStore(
  { providedIn: 'root' },
  withDevtools('group-manager-store', withGlitchTracking()),
  withState<GroupManagerState>({
    groups: [],
    selectedGroupId: null,
    selectedUserIds: [],
    isLoading: false,
    isSaving: false,
    error: null,
    modifiedGroupIds: new Set<number>(),
  }),

  withMethods((store) => {
    const http = inject(HttpClient);
    const usersStore = inject(UsersStore);
    const findUserById = (id: string) => usersStore['userEntities']().find(u => u.id === id);

    return {

      // Load groups from JSON file
      loadGroups: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(() => http.get<Group[]>('assets/iam/group-data.json')),
          tapResponse({
            next: (groups) => {
              patchState(store, {
                groups,
                isLoading: false,
              });
            },
            error: (err) => {
              const message = err instanceof Error ? err.message : 'Failed to load groups';
              console.error('Failed to load groups', err);
              patchState(store, {
                error: message,
                isLoading: false,
              });
            },
            finalize: () => console.log('Groups loading complete'),
          })
        )
      ),

      isUserSelected: (userId: string) => computed(() => store.selectedUserIds().includes(userId)),

      selectGroup: (groupId: number | null) => {
        patchState(store, {
          selectedGroupId: groupId,
          selectedUserIds: [], // Reset user selection when group changes
        });
      },

      toggleUserSelection: (userId: string) => {
        patchState(store, {
          selectedUserIds: store.selectedUserIds().includes(userId)
            ? store.selectedUserIds().filter((id) => id !== userId)
            : [...store.selectedUserIds(), userId],
        });
      },

      selectAllUsersInGroup: () => {
        const groupId = store.selectedGroupId();
        if (groupId == null) return;

        const groupUsers = (store as any).groupUsers();
        const userIds = groupUsers.map((u: { id: any; }) => u.id);
        patchState(store, { selectedUserIds: userIds });
      },

      deselectAllUsers: () => {
        patchState(store, { selectedUserIds: [] });
      },

      addUsersToGroup: () => {
        const groupId = store.selectedGroupId();
        const userIds = store.selectedUserIds();

        if (groupId == null || userIds.length === 0) return;

        // Update users in UsersStore with new groupId
        userIds.forEach(userId => {
          const user = findUserById(userId);
          if (user && Number(user.groupId) !== groupId) {
            usersStore.updateUser({ ...user, groupId: String(groupId) });
          }
        });

        patchState(store, {
          modifiedGroupIds: new Set([...store.modifiedGroupIds(), groupId]),
          selectedUserIds: [],
        });
      },

      removeUsersFromGroup: () => {
        const groupId = store.selectedGroupId();
        const userIds = store.selectedUserIds();

        if (groupId == null || userIds.length === 0) return;

        userIds.forEach(userId => {
          const user = findUserById(userId);
          if (user) {
            usersStore.updateUser({ ...user, groupId: '0' });
          }
        });

        patchState(store, {
          modifiedGroupIds: new Set([...store.modifiedGroupIds(), groupId]),
          selectedUserIds: [], // Clear selection after removing
        });
      },

      saveChanges: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isSaving: true, error: null })),
          switchMap(() => {
            // In a real app, send modified users to backend
            return new Promise<void>((resolve) => {
              setTimeout(() => resolve(), 500); // Simulate network delay
            });
          }),
          tapResponse({
            next: () => {
              patchState(store, {
                modifiedGroupIds: new Set(),
                isSaving: false,
              });
            },
            error: (err) => {
              const message = err instanceof Error ? err.message : 'Unknown error';
              patchState(store, {
                error: message,
                isSaving: false,
              });
            },
          })
        )
      ),

      discardChanges: () => {
        patchState(store, {
          modifiedGroupIds: new Set(),
          selectedUserIds: [],
          selectedGroupId: null,
        });
        // Reload groups from JSON
        (store as any).loadGroups();
      },

      clearError: () => {
        patchState(store, { error: null });
      },
    };
  }),


// First, define allUsers
withComputed((store) => {
  const usersStore = inject(UsersStore);
  return {
    allUsers: computed(() => {
      return usersStore['userEntities']() as User[];
    }),
  };
}),

// Then, define signals that depend on allUsers
withComputed((store) => {
  const selectedGroup = computed(() => {
    const id = store.selectedGroupId();
    return id ? store.groups().find(g => g.id === id) || null : null;
  });

  const groupUsers = computed(() => {
    const groupId = store.selectedGroupId();
    if (groupId == null) return [];
    return store.allUsers().filter(user => Number(user.groupId) === groupId);
  });

  const availableUsers = computed(() => {
    const groupId = store.selectedGroupId();
    if (groupId == null) return store.allUsers();
    return store.allUsers().filter(user => Number(user.groupId) !== groupId);
  });

  const hasChanges = computed(() => store.modifiedGroupIds().size > 0);
  const modifiedGroupCount = computed(() => store.modifiedGroupIds().size);

  const areAllGroupUsersSelected = computed(() => {
    const gu = groupUsers();
    const selectedIds = store.selectedUserIds();
    return !!gu.length && gu.every(u => selectedIds.includes(u.id));
  });

  return {
    selectedGroup,
    groupUsers,
    availableUsers,
    hasChanges,
    modifiedGroupCount,
    areAllGroupUsersSelected,
  };
}),   

  withHooks({
    onInit(store) {
      const usersStore = inject(UsersStore);
      // Load both groups and users on init
      usersStore.loadUsers();
      (store as any).loadGroups();
    },
  })
);