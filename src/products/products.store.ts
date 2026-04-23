import { signalStore, withState, withMethods, patchState, withHooks, withComputed } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators'; 
import { computed } from '@angular/core';
import { Product } from './product.model';

export const ProductsStore = signalStore(
  { providedIn: 'root' },
  withState({ 
    products: [] as Product[], 
    isLoading: false, 
    error: null as string | null,
    selectedProductId: null as number | null,
    selectedProductLoading: false
  }),
  withMethods((store) => {
    const http = inject(HttpClient);
    return {
      loadProducts: rxMethod<void>(
        switchMap(() => {
          patchState(store, { isLoading: true, error: null });
          return http.get<Product[]>('/assets/products.json').pipe(
            tapResponse({
              next: (products) => patchState(store, { products }),
              error: (err) => {
                const message = err instanceof Error ? err.message : 'Unknown error';
                patchState(store, { error: message });
              },
              finalize: () => patchState(store, { isLoading: false })
            })
          );
        })
      ),
      selectProduct: (id: number) => {
        patchState(store, { selectedProductId: id, selectedProductLoading: false });
      }
    };
  }),
  withComputed((store) => {
    return {
      selectedProduct: computed(() => {
        const id = store.selectedProductId();
        const products = store.products();
        return id ? products.find(p => p.id === id) || null : null;
      })
    };
  }),
  withHooks({
    onInit(store) {
      store.loadProducts();
    }
  })
);