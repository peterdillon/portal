import { inject } from '@angular/core';
import { signalStore, withState, withMethods, type, patchState } from '@ngrx/signals';
import { withEntities, prependEntity, removeEntity, setAllEntities, updateEntity } from '@ngrx/signals/entities';
import { withDevtools, withGlitchTracking } from '@angular-architects/ngrx-toolkit';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { UsersService } from '@core/services/user.service';
import { User } from '@users/user.model';

const userEntityConfig = { entity: type<User>(), collection: 'user' };

export const UsersStore = signalStore(
  { providedIn: 'root' },
  withDevtools('users-store', withGlitchTracking()),
  withEntities(userEntityConfig),
  withState({ hasLoaded: false }),
  withMethods((store, usersService = inject(UsersService)) => ({
    ensureUsersLoaded: () => {
      if (!store.hasLoaded()) {
        (store as unknown as { loadUsers: () => void }).loadUsers();
      }
    },

    reloadUsers: () => {
      (store as unknown as { loadUsers: () => void }).loadUsers();
    },

    addUser: (user: User) => {
      patchState(store, prependEntity(user, userEntityConfig));
    },

    // Update a user (e.g., change siteId)
    updateUser: (user: User) => {
      patchState(store, updateEntity({ id: user.id, changes: user }, userEntityConfig));
    },

    removeUser: (userId: string) => {
      patchState(store, removeEntity(userId, userEntityConfig));
    },

    loadUsers: rxMethod<void>(
      pipe(
        switchMap(() => usersService.getUsers()),
        tapResponse({
          next: (users) => patchState(store, setAllEntities(users, userEntityConfig), { hasLoaded: true }),
          error: (err) => console.error('Failed to load users', err),
          finalize: () => console.log('User loading complete')
        })
      )
    )
  }))
);