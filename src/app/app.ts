import { Component, signal } from '@angular/core';
import { LayoutComponent } from '../layout/layout';
import { LoaderComponent } from './loader/loader';

@Component({
  selector: 'app-root',
  imports: [LayoutComponent, LoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Portal');
}
