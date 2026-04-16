import { signalStore, withState, withMethods, withComputed, withHooks, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { computed } from '@angular/core';
import { withDevtools, withGlitchTracking } from '@angular-architects/ngrx-toolkit';
import { User, Group, GroupManagerState } from '../../models/group-manager.model';

export const GroupManagerStore = signalStore(
  { providedIn: 'root' },
  withDevtools('iam-store', withGlitchTracking()),
  withState<GroupManagerState>({
    groups: [],
    allUsers: [],
    selectedGroupId: null,
    selectedUserIds: [],
    isLoading: false,
    isSaving: false,
    error: null,
    modifiedGroupIds: new Set<number>(),
  }),

  withMethods((store) => {
    const http = inject(HttpClient);

    return {

      loadGroups: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(() => http.get<Group[]>('assets/group-data.json')),
          tapResponse({
            next: (groups) => {
              // Extract all unique users from groups
              const userMap = new Map<number, User>();
              groups.forEach(group => {
                group.users.forEach(user => {
                  if (!userMap.has(user.id)) {
                    userMap.set(user.id, user);
                  }
                });
              });
              const allUsers = Array.from(userMap.values());

              patchState(store, {
                groups,
                allUsers,
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

      isUserSelected: (userId: number) => computed(() => store.selectedUserIds().includes(userId)),

      selectGroup: (groupId: number | null) => {
        patchState(store, {
          selectedGroupId: groupId,
          selectedUserIds: [], // Reset user selection when group changes
        });
      },

      toggleUserSelection: (userId: number) => {
        patchState(store, {
          selectedUserIds: store.selectedUserIds().includes(userId)
            ? store.selectedUserIds().filter((id) => id !== userId)
            : [...store.selectedUserIds(), userId],
        });
      },

      selectAllUsersInGroup: () => {
        const groupId = store.selectedGroupId();
        if (!groupId) return;

        const group = store.groups().find((g) => g.id === groupId);
        if (!group) return;

        const userIds = group.users.map((u) => u.id);
        patchState(store, { selectedUserIds: userIds });
      },

      deselectAllUsers: () => {
        patchState(store, { selectedUserIds: [] });
      },

      addUsersToGroup: () => {
        const groupId = store.selectedGroupId();
        const userIds = store.selectedUserIds();

        if (!groupId || userIds.length === 0) return;

        patchState(store, {
          groups: store.groups().map((group) => {
            if (group.id === groupId) {
              // Add users that aren't already in the group
              const existingUserIds = new Set(group.users.map((u) => u.id));
              const usersToAdd = store
                .allUsers()
                .filter(
                  (u) => userIds.includes(u.id) && !existingUserIds.has(u.id)
                );

              return {
                ...group,
                users: [...group.users, ...usersToAdd],
              };
            }
            return group;
          }),
          modifiedGroupIds: new Set([...store.modifiedGroupIds(), groupId]),
          selectedUserIds: [], // Clear selection after adding
        });
      },

      removeUsersFromGroup: () => {
        const groupId = store.selectedGroupId();
        const userIds = store.selectedUserIds();

        if (!groupId || userIds.length === 0) return;

        patchState(store, {
          groups: store.groups().map((group) => {
            if (group.id === groupId) {
              return {
                ...group,
                users: group.users.filter((u) => !userIds.includes(u.id)),
              };
            }
            return group;
          }),
          modifiedGroupIds: new Set([...store.modifiedGroupIds(), groupId]),
          selectedUserIds: [], // Clear selection after removing
        });
      },

      saveChanges: rxMethod<void>(
        switchMap(() => {
          patchState(store, { isSaving: true, error: null });

          const modifiedGroups = store
            .groups()
            .filter((g) => store.modifiedGroupIds().has(g.id));

          // In a real app, send to backend
          return new Promise<void>((resolve) => {
            setTimeout(() => resolve(), 500); // Simulate network delay
          }).then(() => {
            patchState(store, {
              modifiedGroupIds: new Set(),
              isSaving: false,
            });
          });
        })
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

  withComputed((store) => ({
    selectedGroup: computed(() => {
      const id = store.selectedGroupId();
      return id ? store.groups().find(g => g.id === id) || null : null;
    }),
  })),

  withComputed((store) => ({
    availableUsers: computed(() => {
      const selectedGroup = store.selectedGroup();
      if (!selectedGroup) return store.allUsers();
      const groupUserIds = new Set(selectedGroup.users.map(u => u.id));
      return store.allUsers().filter(u => !groupUserIds.has(u.id));
    }),
    groupUsers: computed(() => store.selectedGroup()?.users || []),
    hasChanges: computed(() => store.modifiedGroupIds().size > 0),
    modifiedGroupCount: computed(() => store.modifiedGroupIds().size),
    areAllGroupUsersSelected: computed(() => {
      const selectedGroup = store.selectedGroup();
      const selectedIds = store.selectedUserIds();
      return !!selectedGroup?.users.length &&
        selectedGroup.users.every(u => selectedIds.includes(u.id));
    }),
  })),

  withHooks({
    onInit(store) {
      (store as any).loadGroups();
    },
  })
);