import { Component, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-spinner',
  templateUrl: 'spinner.html',
  imports: [MatProgressSpinnerModule],
})
export class Spinner {

  isLoading = signal(false);
}