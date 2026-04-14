// layout.component.ts
import { Component, inject } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { SidenavModeExample } from '../side-nav/sidenav';
import { SidenavService } from '../side-nav/sidenav.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { TopToolbar } from '../top-toolbar/top-toolbar/top-toolbar';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.html',
  styleUrls: ['./layout.scss'],
  standalone: true,
  imports: [
    RouterModule, MatMenuModule, MatBadgeModule, TopToolbar,
    SidenavModeExample, MatSidenavModule, MatToolbarModule ]
})
export class LayoutComponent {
    sidenavService = inject(SidenavService);
    logoUrl = 'assets/phoenix-invert.jpg';
}