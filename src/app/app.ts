import { Component, signal } from '@angular/core';
import { LoaderComponent } from '@app/loader/loader';
import { LayoutComponent } from '@shared/layout/layout';

@Component({
  selector: 'app-root',
  imports: [LayoutComponent, LoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Portal');
}
