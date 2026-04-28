import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withHooks, withMethods, withState, patchState } from '@ngrx/signals';
import { withDevtools, withGlitchTracking } from '@angular-architects/ngrx-toolkit';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { Site, SitesState } from '@site-manager/site.model';
import { SitesService } from '@app/core/services/sites.service';

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
  withMethods((store, sitesService = inject(SitesService)) => ({
    loadSites: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => sitesService.getSites()),
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

    addSite: rxMethod<Site>(
      pipe(
        tap((site) => patchState(store, {
          isSaving: true,
          error: null,
          modifiedSiteIds: new Set([...store.modifiedSiteIds(), site.id]),
        })),
        switchMap((site) => sitesService.addSite(site)),
        tapResponse({
          next: (sites) => {
            patchState(store, {
              sites,
              isSaving: false,
            });
          },
          error: (err) => {
            const message = err instanceof Error ? err.message : 'Failed to add site';
            patchState(store, { error: message, isSaving: false });
          },
        })
      )
    ),

    updateSite: rxMethod<Site>(
      pipe(
        tap((site) => patchState(store, {
          isSaving: true,
          error: null,
          modifiedSiteIds: new Set([...store.modifiedSiteIds(), site.id]),
        })),
        switchMap((site) => sitesService.updateSite(site)),
        tapResponse({
          next: (sites) => {
            patchState(store, {
              sites,
              isSaving: false,
            });
          },
          error: (err) => {
            const message = err instanceof Error ? err.message : 'Failed to update site';
            patchState(store, { error: message, isSaving: false });
          },
        })
      )
    ),

    removeSite: rxMethod<number>(
      pipe(
        tap((siteId) => patchState(store, {
          isSaving: true,
          error: null,
          modifiedSiteIds: new Set([...store.modifiedSiteIds(), siteId]),
        })),
        switchMap((siteId) => sitesService.removeSite(siteId)),
        tapResponse({
          next: (sites) => {
            patchState(store, {
              sites,
              isSaving: false,
            });
          },
          error: (err) => {
            const message = err instanceof Error ? err.message : 'Failed to remove site';
            patchState(store, { error: message, isSaving: false });
          },
        })
      )
    ),

    saveChanges: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isSaving: true, error: null })),
        switchMap(() => sitesService.saveChanges()),
        tapResponse({
          next: (sites) => {
            patchState(store, { isSaving: false, modifiedSiteIds: new Set<number>() });
            patchState(store, { sites });
          },
          error: (err) => {
            const message = err instanceof Error ? err.message : 'Failed to save sites';
            patchState(store, { error: message, isSaving: false });
          },
        })
      )
    ),

    discardChanges: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => sitesService.discardChanges()),
        tapResponse({
          next: (sites) => {
            patchState(store, {
              sites,
              isLoading: false,
              modifiedSiteIds: new Set<number>(),
            });
          },
          error: (err) => {
            const message = err instanceof Error ? err.message : 'Failed to discard site changes';
            patchState(store, { error: message, isLoading: false });
          },
        })
      )
    ),

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