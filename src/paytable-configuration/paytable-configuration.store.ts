import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods, withState, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { GamesService } from '@core/services/games.service';
import { Game } from './game.model';
import { PaytableConfiguration } from './paytable-configuration.model';

interface PaytableConfigurationState {
  games: Game[];
  paytableConfigurations: PaytableConfiguration[];
  hasLoadedGames: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: PaytableConfigurationState = {
  games: [],
  paytableConfigurations: [],
  hasLoadedGames: false,
  isLoading: false,
  error: null,
};

export const PaytableConfigurationStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, gamesService = inject(GamesService)) => {
    const loadGames = rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => gamesService.getGames()),
        tapResponse({
          next: (games) => {
            patchState(store, {
              games,
              hasLoadedGames: true,
              isLoading: false,
              error: null,
            });
          },
          error: (err) => {
            const message = err instanceof Error ? err.message : 'Failed to load games';
            patchState(store, { error: message, isLoading: false });
          },
        })
      )
    );

    return {
      initialLoadGames: () => {
        if (!store.hasLoadedGames()) {
          loadGames();
        }
      },

      reloadGamesFromSource: () => {
        loadGames();
      },

      addConfiguration: (configuration: PaytableConfiguration) => {
        patchState(store, {
          paytableConfigurations: [...store.paytableConfigurations(), configuration],
          error: null,
        });
      },

      removeConfiguration: (index: number) => {
        patchState(store, {
          paytableConfigurations: store.paytableConfigurations().filter((_, candidateIndex) => candidateIndex !== index),
          error: null,
        });
      },

      clearError: () => {
        patchState(store, { error: null });
      },

      loadGames,
    };
  }),
  withComputed((store) => ({
    gameOptions: computed(() => store.games().map((game) => game.name)),
  }))
);