import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withState, withMethods, type, patchState } from '@ngrx/signals';
import { withEntities, addEntities, prependEntity } from '@ngrx/signals/entities';
import { User } from './user.model';
import { withDevtools, withGlitchTracking } from '@angular-architects/ngrx-toolkit';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  readonly users$ = this.http.get<User[]>('/assets/users.json');
}
const userEntityConfig = { entity: type<User>(), collection: 'user' };

export const UsersStore = signalStore(
  { providedIn: 'root' },
  withDevtools('users-store', withGlitchTracking()),
  withEntities(userEntityConfig),
  withState({}),
  withMethods((store, usersService = inject(UsersService)) => ({
    addUser: (user: User) => {
      patchState(store, prependEntity(user, userEntityConfig));
    },
     loadUsers: rxMethod<void>(
      pipe(
        switchMap(() => usersService.users$),
        tapResponse({
          next: (users) => patchState(store, addEntities(users, userEntityConfig)),
          error: (err) => console.error('Failed to load users', err),
          finalize: () => console.log('User loading complete')
        })
      )
    )
  }))
);   