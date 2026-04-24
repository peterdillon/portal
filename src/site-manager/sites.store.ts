import { computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withComputed, withHooks, withMethods, withState, patchState } from '@ngrx/signals';
import { withDevtools, withGlitchTracking } from '@angular-architects/ngrx-toolkit';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { Site, SitesState } from '@site-manager/site.model';

const initialState: SitesState = {
  sites: [],
  isLoading: false,
  isSaving: false,
  error: null,
  modifiedSiteIds: new Set<number>(),
};

export const SitesStore = signalStore(
  { providedIn: 'root' },
  withDevtools('sites-store', withGlitchTracking()),
  withState(initialState),
  withMethods((store, http = inject(HttpClient)) => ({
    loadSites: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => http.get<Site[]>('assets/iam/group-data.json')),
        tapResponse({
          next: (sites) => {
            patchState(store, {
              sites,
              isLoading: false,
              modifiedSiteIds: new Set<number>(),
            });
          },
          error: (err) => {
            const message = err instanceof Error ? err.message : 'Failed to load sites';
            patchState(store, { error: message, isLoading: false });
          },
        })
      )
    ),

    addSite: (site: Site) => {
      patchState(store, {
        sites: [site, ...store.sites()],
        modifiedSiteIds: new Set([...store.modifiedSiteIds(), site.id]),
      });
    },

    updateSite: (site: Site) => {
      patchState(store, {
        sites: store.sites().map((candidate) => candidate.id === site.id ? site : candidate),
        modifiedSiteIds: new Set([...store.modifiedSiteIds(), site.id]),
      });
    },

    removeSite: (siteId: number) => {
      patchState(store, {
        sites: store.sites().filter((site) => site.id !== siteId),
        modifiedSiteIds: new Set([...store.modifiedSiteIds(), siteId]),
      });
    },

    saveChanges: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isSaving: true, error: null })),
        switchMap(() => new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 300);
        })),
        tapResponse({
          next: () => {
            patchState(store, { isSaving: false, modifiedSiteIds: new Set<number>() });
          },
          error: (err) => {
            const message = err instanceof Error ? err.message : 'Failed to save sites';
            patchState(store, { error: message, isSaving: false });
          },
        })
      )
    ),

    discardChanges: () => {
      patchState(store, { error: null, modifiedSiteIds: new Set<number>() });
      (store as unknown as { loadSites: () => void }).loadSites();
    },

    clearError: () => {
      patchState(store, { error: null });
    },
  })),
  withComputed((store) => ({
    hasChanges: computed(() => store.modifiedSiteIds().size > 0),
    modifiedSiteCount: computed(() => store.modifiedSiteIds().size),
    nextSiteId: computed(() => {
      const siteIds = store.sites().map((site) => site.id);
      return siteIds.length ? Math.max(...siteIds) + 1 : 1;
    }),
  })),
  withHooks({
    onInit(store) {
      (store as unknown as { loadSites: () => void }).loadSites();
    },
  })
);