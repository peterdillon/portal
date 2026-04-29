import { Component, computed, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDrawerMode, MatSidenavModule } from '@angular/material/sidenav';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { RouterModule, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { SidenavService } from './sidenav.service';

interface NavigationItem {
  name: string;
  path: string;
  subTitle: string;
  requiredPermission?: string;
}

@Component({
  selector: 'sidenav-mode-example',
  templateUrl: 'sidenav.html',
  styleUrl: 'sidenav.scss',
  imports: [MatListModule, RouterModule, MatSidenavModule, MatButtonModule, MatRadioModule, FormsModule, ReactiveFormsModule, RouterLink],
})
export class SidenavMode {

  mode = new FormControl('over' as MatDrawerMode);
  private sidenavService = inject(SidenavService);
  private authService = inject(AuthService);

  private navigationItems: NavigationItem[] = [
    { name: 'Login', path: '/login', subTitle: 'Login Page' },
    { name: 'User Manager', path: '/users', subTitle: 'User & Permission Management', requiredPermission: 'user.write' },
    { name: 'Permissions Manager', path: '/permissions', subTitle: 'Permission Catalog Management', requiredPermission: 'config.write' },
    { name: 'Site Manager', path: '/site-manager', subTitle: 'Site Management', requiredPermission: 'site.write' },
    { name: 'Site User Manager', path: '/site-user-manager', subTitle: 'Site User Management', requiredPermission: 'site.write' },
    { name: 'EGMs', path: '/egms', subTitle: 'Electronic Gaming Machines' },
    { name: 'Table', path: '/page-two', subTitle: 'An example table' },
  ];

  navigationData = computed(() => {
    const userPermissions = this.authService.userPermissions();

    return this.navigationItems.filter((item) => !item.requiredPermission || userPermissions.includes(item.requiredPermission));
  });

  closeSidenav() {
    this.sidenavService.close();
  }
}
