// loader.component.ts
import { Component, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    @if (loaderService.isLoading()) {
      <div class="overlay">
        <mat-spinner mode="indeterminate" diameter="50"></mat-spinner>
      </div>
    }
  `,
  styles: [`
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
  `]
})
export class LoaderComponent {
  loaderService = inject(LoaderService);
}   