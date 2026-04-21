import { Component, inject } from '@angular/core';
import { MatIcon } from "@angular/material/icon";
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatToolbar } from "@angular/material/toolbar";
import { SidenavService } from '../../side-nav/sidenav.service';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-top-toolbar',
  imports: [MatIcon, MatTooltipModule, MatMenuModule, MatBadgeModule, MatToolbar, MatToolbarModule, 
    MatIconModule, MatButtonModule],
  templateUrl: './top-toolbar.html',
  styleUrl: './top-toolbar.scss',
})
export class TopToolbar {

  sidenavService = inject(SidenavService);
  authService = inject(AuthService);

  toggleDarkMode() {
    document.documentElement.classList.toggle('dark-theme');
    // Optional: Save preference to localStorage
    localStorage.setItem('theme', 
      document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light'
    );
  }

  ngOnInit() {
    // Optional: Load saved preference
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark-theme');
    }
  }

  logout() {
    this.authService.logout();
  }

}
