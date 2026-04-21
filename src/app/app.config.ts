import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { routes } from '@app/app.routes';
import { authInterceptor } from '@app/core/interceptors/auth.interceptor';
import { FakeBackendInterceptor } from '@app/core/interceptors/fake-backend.interceptor';
import { LoaderInterceptor } from '@app/core/interceptors/loader.interceptor';


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
