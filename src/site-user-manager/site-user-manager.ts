import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { SaveCancelActionsComponent } from '@shared/save-cancel-actions/save-cancel-actions';
import { ThemeService } from '@core/theme/theme.service';
import { SiteUserManagerStore } from '@site-user-manager/site-user-manager.store';
import { UsersStore } from '@users/users.store';

@Component({
  selector: 'app-site-user-manager',
  imports: [
    FormsModule,
    CommonModule,
    MatListModule,
    MatSelectionList,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDividerModule,
    MatTooltip,
    MatToolbarModule,
    SaveCancelActionsComponent,
  ],
  templateUrl: './site-user-manager.html',
  styleUrl: './site-user-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteUserManager {
  themeService = inject(ThemeService);
  readonly store: InstanceType<typeof SiteUserManagerStore> = inject(SiteUserManagerStore);
  readonly usersStore = inject(UsersStore);
  readonly discardLabel = computed(() => {
    const modifiedSiteCount = this.store.modifiedSiteCount();
    return `Discard ${modifiedSiteCount} ${modifiedSiteCount === 1 ? 'Change' : 'Changes'}`;
  });
  readonly siteNames = computed(() => {
    const names = new Map<number, string>();

    this.store.sites().forEach((site) => {
      names.set(site.id, site.name);
    });

    return names;
  });
  readonly siteUserCounts = computed(() => {
    const counts = new Map<number, number>();

    this.usersStore['userEntities']().forEach((user) => {
      const siteId = Number(user.siteId);
      counts.set(siteId, (counts.get(siteId) ?? 0) + 1);
    });

    return counts;
  });

  siteUserCount(siteId: number) {
    return this.siteUserCounts().get(siteId) ?? 0;
  }

  siteName(siteId: string | number) {
    const numericSiteId = Number(siteId);

    if (numericSiteId === 0) {
      return 'Unassigned';
    }

    return this.siteNames().get(numericSiteId) ?? 'Unknown Site';
  }

  onSiteSelected(siteId: number) {
    this.store.selectSite(siteId);
  }

  onUserToggled(userId: string | number) {
    this.store.toggleUserSelection(String(userId));
  }

  addUsersToSite() {
    this.store.addUsersToSite();
  }

  removeUsersFromSite() {
    this.store.removeUsersFromSite();
  }

  saveChanges() {
    this.store.saveChanges();
  }

  discardChanges() {
    this.store.discardChanges();
  }

  toggleSelectAll(event: MatCheckboxChange) {
    if (event.checked) {
      this.store.selectAllUsersInSite();
    } else {
      this.store.deselectAllUsers();
    }
  }
}