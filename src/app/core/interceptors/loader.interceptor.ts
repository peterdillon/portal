// loader.interceptor.ts
import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { finalize, delay, switchMap } from 'rxjs/operators';
import { LoaderService } from '@core/services/loader.service';

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {
  private loaderService = inject(LoaderService);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this.loaderService.show();
    const minDuration$ = of(null).pipe(delay(2000)); // Minimum 3s delay

    return next.handle(request).pipe(
      // switchMap(event => minDuration$.pipe(switchMap(() => of(event)))),
      finalize(() => this.loaderService.hide())
    );
  }
}   