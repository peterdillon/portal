import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { LoaderInterceptor } from './core/interceptors/loader.interceptor';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { FakeBackendInterceptor } from './core/interceptors/fake-backend.interceptor';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor]),
      withInterceptorsFromDi()),
      { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true },
      { provide: HTTP_INTERCEPTORS, useClass: FakeBackendInterceptor, multi: true } // Add this

  ]
};
