import { Component, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDrawerMode, MatSidenavModule } from '@angular/material/sidenav';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { RouterModule, RouterLink } from '@angular/router';
import { SidenavService } from './sidenav.service';

@Component({
  selector: 'sidenav-mode-example',
  templateUrl: 'sidenav.html',
  styleUrl: 'sidenav.scss',
  imports: [MatListModule, RouterModule, MatSidenavModule, MatButtonModule, MatRadioModule, FormsModule, ReactiveFormsModule, RouterLink],
})
export class SidenavModeExample {

  mode = new FormControl('over' as MatDrawerMode);
  private sidenavService = inject(SidenavService);
  navigationData = signal([
    { name: 'Products', path: '/products', subTitle: 'Electronic Gaming Machines' },
    { name: 'Group Manager', path: '/group-manager', subTitle: 'Group Management' },
    { name: 'Users', path: '/users', subTitle: 'Users & Permission Management' },
    { name: 'Table', path: '/page-two', subTitle: 'An example table' },
    { name: 'Dialog', path: '/dialog-example', subTitle: 'An example dialog' },
  ]);
  closeSidenav() {
    this.sidenavService.close();
  }
}
