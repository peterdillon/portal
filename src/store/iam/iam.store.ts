import { signalStore, withState, withMethods, withComputed, withHooks, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { switchMap, of, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { computed } from '@angular/core';
import { withDevtools, withGlitchTracking } from '@angular-architects/ngrx-toolkit';
import { User, Group, IAMState } from './iam.model';

export const IAMStore = signalStore(
  { providedIn: 'root' },
  withDevtools('iam-store', withGlitchTracking()),
  withState<IAMState>({
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
      // Load initial data
      loadData: rxMethod<void>(
        switchMap(() => {
          patchState(store, { isLoading: true, error: null });
          // In a real app, these would be separate API calls
          return of(null).pipe(
            tap(() => {
              const dummyUsers = generateDummyUsers(40);
              const dummyGroups = generateDummyGroups(40);
              patchState(store, {
                allUsers: dummyUsers,
                groups: dummyGroups,
                isLoading: false,
              });
            })
          );
        })
      ),

       isUserSelected: (userId: number) =>
        computed(() => store.selectedUserIds().includes(userId)),


      // Select a group
      selectGroup: (groupId: number | null) => {
        patchState(store, {
          selectedGroupId: groupId,
          selectedUserIds: [], // Reset user selection when group changes
        });
      },

      // Toggle user selection for bulk operations
      toggleUserSelection: (userId: number) => {
        patchState(store, {
          selectedUserIds: store.selectedUserIds().includes(userId)
            ? store.selectedUserIds().filter((id) => id !== userId)
            : [...store.selectedUserIds(), userId],
        });
      },

      // Select all users in current group
      selectAllUsersInGroup: () => {
        const groupId = store.selectedGroupId();
        if (!groupId) return;

        const group = store.groups().find((g) => g.id === groupId);
        if (!group) return;

        const userIds = group.users.map((u) => u.id);
        patchState(store, { selectedUserIds: userIds });
      },

      // Deselect all users
      deselectAllUsers: () => {
        patchState(store, { selectedUserIds: [] });
      },

      // Add selected users to the selected group
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

      // Remove selected users from the selected group
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

      // Save all changes to backend
      saveChanges: rxMethod<void>(
        switchMap(() => {
          patchState(store, { isSaving: true, error: null });

          const modifiedGroups = store
            .groups()
            .filter((g) => store.modifiedGroupIds().has(g.id));

          // In a real app, send to backend
          return of(modifiedGroups).pipe(
            tapResponse({
              next: () => {
                patchState(store, {
                  modifiedGroupIds: new Set(),
                  isSaving: false,
                });
              },
              error: (err) => {
                const message =
                  err instanceof Error ? err.message : 'Unknown error';
                patchState(store, {
                  error: message,
                  isSaving: false,
                });
              },
            })
          );
        })
      ),

      // Discard all changes and reload
      discardChanges: () => {
        patchState(store, {
          modifiedGroupIds: new Set(),
          selectedUserIds: [],
          selectedGroupId: null,
        });
        (store as any).loadData();
      },

      // Clear error message
      clearError: () => {
        patchState(store, { error: null });
      },
    };
  }),

// ✅ Define selectedGroup first
  withComputed((store) => ({
    selectedGroup: computed(() => {
      const id = store.selectedGroupId();
      return id ? store.groups().find(g => g.id === id) || null : null;
    }),
  })),

  // ✅ All other computed signals after
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

  // ✅ withHooks last
  withHooks({
    onInit(store) {
      (store as any).loadData();
    },
  })
);

// ============ DUMMY DATA GENERATORS ============

function generateDummyUsers(count: number): User[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    first_name: `User${i + 1}`,
    last_name: `LastName${i + 1}`,
  }));
}

function generateDummyGroups(count: number): Group[] {
  const allUsers = generateDummyUsers(40);
  
  return Array.from({ length: count }, (_, i) => {
    // Assign some users to each group (1-10 users per group)
    const usersPerGroup = Math.floor(Math.random() * 10) + 1;
    const startIdx = (i * usersPerGroup) % 40;
    const groupUsers = Array.from({ length: usersPerGroup }, (_, j) => {
      const idx = (startIdx + j) % 40;
      return allUsers[idx];
    });

    return {
      id: i + 1,
      name: `Group ${i + 1}`,
      address: `Address ${i + 1}`,
      email: `group${i + 1}@example.com`,
      users: groupUsers,
    };
  });
}