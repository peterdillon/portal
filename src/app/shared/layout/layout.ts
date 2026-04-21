// layout.component.ts
import { Component, inject } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { SidenavMode } from '@shared/side-nav/sidenav';
import { SidenavService } from '@shared/side-nav/sidenav.service';
import { TopToolbar } from '@shared/top-toolbar/top-toolbar';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.html',
  styleUrls: ['./layout.scss'],
  standalone: true,
  imports: [
    RouterModule, MatMenuModule, MatBadgeModule, TopToolbar,
    SidenavMode, MatSidenavModule, MatToolbarModule ]
})
export class LayoutComponent {
    sidenavService = inject(SidenavService);
    logoUrl = 'assets/phoenix-invert.jpg';
}