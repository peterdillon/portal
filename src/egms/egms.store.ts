import { signalStore, withState, withMethods, patchState, withHooks, withComputed } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators'; 
import { computed } from '@angular/core';
import { Egm } from './egm.model';
import { EgmsService } from '@app/core/services/egms.service';

export const EgmsStore = signalStore(
  { providedIn: 'root' },
  withState({ 
    egms: [] as Egm[], 
    isLoading: false, 
    error: null as string | null,
    selectedEgmId: null as number | null,
    selectedEgmLoading: false
  }),
  withMethods((store) => {
    const egmsService = inject(EgmsService);
    return {
      loadEgms: rxMethod<void>(
        switchMap(() => {
          patchState(store, { isLoading: true, error: null });
          return egmsService.getEgms().pipe(
            tapResponse({
              next: (egms) => patchState(store, { egms }),
              error: (err) => {
                const message = err instanceof Error ? err.message : 'Unknown error';
                patchState(store, { error: message });
              },
              finalize: () => patchState(store, { isLoading: false })
            })
          );
        })
      ),
      selectEgm: (id: number) => {
        patchState(store, { selectedEgmId: id, selectedEgmLoading: false });
      },
      deleteEgm: rxMethod<number>(
        switchMap((id) => {
          patchState(store, { error: null });
          return egmsService.deleteEgm(id).pipe(
            tapResponse({
              next: (egms) => patchState(store, {
                egms,
                selectedEgmId: store.selectedEgmId() === id ? null : store.selectedEgmId(),
              }),
              error: (err) => {
                const message = err instanceof Error ? err.message : 'Unknown error';
                patchState(store, { error: message });
              },
            })
          );
        })
      ),
      updateEgm: rxMethod<Egm>(
        switchMap((egm) => {
          patchState(store, { error: null });
          return egmsService.updateEgm(egm).pipe(
            tapResponse({
              next: (egms) => patchState(store, { egms }),
              error: (err) => {
                const message = err instanceof Error ? err.message : 'Unknown error';
                patchState(store, { error: message });
              },
            })
          );
        })
      )
    };
  }),
  withComputed((store) => {
    return {
      selectedEgm: computed(() => {
        const id = store.selectedEgmId();
        const egms = store.egms();
        return id ? egms.find((egm) => egm.id === id) || null : null;
      })
    };
  }),
  withHooks({
    onInit(store) {
      store.loadEgms();
    }
  })
);