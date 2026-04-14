// sidenav.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidenavService {
  private isOpen = signal(true);
  isOpen$ = this.isOpen.asReadonly();

  toggle() { this.isOpen.update(value => !value); }
  open() { this.isOpen.set(true); }
  close() { this.isOpen.set(false); }
}   