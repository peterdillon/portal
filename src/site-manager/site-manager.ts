import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatListModule, MatListOption, MatSelectionList, MatSelectionListChange } from '@angular/material/list';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormField, FormRoot, email, form, required, SchemaPathTree } from '@angular/forms/signals';
import { SitesStore } from '@site-manager/sites.store';
import { Site } from '@site-manager/site.model';
import { getFormFieldError } from '@shared/form-field-error/form-field-error';
import { runWithDemoSaveDelay, waitForDemoSaveDelay } from '../app/shared/demo-save-delay';
import { SaveCancelActionsComponent } from '@shared/save-cancel-actions/save-cancel-actions';
import { Spinner } from '@shared/spinner/spinner';
import { UsersStore } from '@users/users.store';
import { SiteGroupRecord, SitesService } from '@app/core/services/sites.service';

interface RemoveSiteDialogData {
  siteName: string;
  assignedUserCount: number;
}

interface SiteFormValue {
  name: string;
  address: string;
  email: string;
  siteGroup: string;
}

@Component({
  selector: 'app-site-manager',
  imports: [
    MatSelectionList,
    MatListOption,
    MatFormField,
    MatError,
    MatLabel,
    MatInput,
    MatSelectModule,
    MatOptionModule,
    FormField,
    FormRoot,
    MatListModule,
    SaveCancelActionsComponent,
  ],
  templateUrl: './site-manager.html',
  styleUrl: './site-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteManager {
  protected readonly getFormFieldError = getFormFieldError;
  readonly store: InstanceType<typeof SitesStore> = inject(SitesStore);
  readonly usersStore = inject(UsersStore);
  readonly isSaving = signal(false);
  private readonly sitesService = inject(SitesService);
  private readonly dialog = inject(MatDialog);
  readonly selectedSiteId = signal<number | null>(null);
  readonly selectedSiteGroupFilter = signal('');
  readonly siteGroups = toSignal(this.sitesService.getSiteGroups(), { initialValue: [] as SiteGroupRecord[] });
  readonly isEditMode = computed(() => this.selectedSiteId() !== null);
  readonly submitLabel = computed(() => this.isEditMode() ? 'Save Site' : 'Add Site');
  readonly changedFieldCount = computed(() => {
    const baselineValue = this.getSiteFormBaseline();
    const currentValue = this.siteForm().value();

    return (Object.keys(baselineValue) as Array<keyof SiteFormValue>).reduce((count, key) => {
      return count + (baselineValue[key] !== currentValue[key] ? 1 : 0);
    }, 0);
  });
  readonly hasUnsavedChanges = computed(() => this.changedFieldCount() > 0);
  readonly discardLabel = computed(() => `Discard ${this.changedFieldCount()} ${this.changedFieldCount() === 1 ? 'Change' : 'Changes'}`);
  readonly filteredSites = computed(() => {
    const selectedGroup = this.selectedSiteGroupFilter();

    if (!selectedGroup) {
      return this.store.sites();
    }

    return this.store.sites().filter((site) => this.normalizeSiteGroup(site.siteGroup) === selectedGroup);
  });
  readonly siteUserCounts = computed(() => {
    const counts = new Map<number, number>();

    this.usersStore['userEntities']().forEach((user) => {
      const siteId = Number(user.siteId);
      counts.set(siteId, (counts.get(siteId) ?? 0) + 1);
    });

    return counts;
  });
  readonly selectedSiteAssignedUsers = computed(() => {
    const siteId = this.selectedSiteId();
    if (siteId == null) {
      return [];
    }

    return this.usersStore['userEntities']().filter((user) => Number(user.siteId) === siteId);
  });

  siteUserCount(siteId: number) {
    return this.siteUserCounts().get(siteId) ?? 0;
  }

  displaySiteGroup(siteGroup: string | undefined) {
    return this.normalizeSiteGroup(siteGroup);
  }

  readonly siteModel = signal<SiteFormValue>(this.createEmptySiteFormValue());
  readonly siteForm = form(this.siteModel, (fieldPath: SchemaPathTree<SiteFormValue>) => {
    required(fieldPath.name, { message: 'Site name is required' });
    required(fieldPath.address, { message: 'Address is required' });
    required(fieldPath.email, { message: 'Email is required' });
    email(fieldPath.email, { message: 'Enter a valid email address' });
  }, {
    submission: {
      action: async (form) => {
        await this.runWithSaveSpinner(async () => {
          const formValue = form().value();
          const site: Site = {
            id: this.selectedSiteId() ?? this.store.nextSiteId(),
            name: formValue.name,
            address: formValue.address,
            email: formValue.email,
            siteGroup: formValue.siteGroup,
          };

          if (this.isEditMode()) {
            this.store.updateSite(site);
          } else {
            this.store.addSite(site);
          }

          this.cancelEdit();
        });
      },
    },
  });

  ngOnInit(): void {
    this.usersStore.initialLoadUsers();
  }

  setSiteGroupFilter(siteGroup: string) {
    this.selectedSiteGroupFilter.set(siteGroup);
  }

  onSiteSelected(event: MatSelectionListChange) {
    const selectedOption = event.options[0];
    const siteId = selectedOption?.selected ? Number(selectedOption.value) : null;

    this.selectedSiteId.set(siteId);
    if (siteId == null) {
      this.siteForm().reset(this.createEmptySiteFormValue());
      return;
    }

    const site = this.store.sites().find((candidate) => candidate.id === siteId);
    if (!site) {
      this.selectedSiteId.set(null);
      this.siteForm().reset(this.createEmptySiteFormValue());
      return;
    }

    this.siteForm().reset(this.toFormValue(site));
  }

  cancelEdit() {
    this.selectedSiteId.set(null);
    this.siteForm().reset(this.createEmptySiteFormValue());
  }

  discardChanges() {
    this.siteForm().reset(this.getSiteFormBaseline());
  }

  removeSelectedSite() {
    const siteId = this.selectedSiteId();
    if (siteId == null) {
      return;
    }

    const site = this.store.sites().find((candidate) => candidate.id === siteId);
    if (!site) {
      return;
    }

    const assignedUsers = this.selectedSiteAssignedUsers();
    const dialogRef = this.dialog.open(RemoveSiteDialogComponent, {
      data: {
        siteName: site.name,
        assignedUserCount: assignedUsers.length,
      },
      width: '380px',
      maxWidth: '92vw',
      panelClass: 'egm-delete-dialog-panel',
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean | undefined) => {
      if (!confirmed) {
        return;
      }

      assignedUsers.forEach((user) => {
        this.usersStore.updateUser({ ...user, siteId: '0' });
      });

      this.store.removeSite(siteId);
      this.cancelEdit();
    });
  }

  private createEmptySiteFormValue(): SiteFormValue {
    return {
      name: '',
      address: '',
      email: '',
      siteGroup: '',
    };
  }

  private toFormValue(site: Site): SiteFormValue {
    return {
      name: site.name,
      address: site.address,
      email: site.email,
      siteGroup: this.normalizeSiteGroup(site.siteGroup),
    };
  }

  private getSiteFormBaseline(): SiteFormValue {
    const selectedSiteId = this.selectedSiteId();

    if (selectedSiteId == null) {
      return this.createEmptySiteFormValue();
    }

    const site = this.store.sites().find((candidate) => candidate.id === selectedSiteId);
    return site ? this.toFormValue(site) : this.createEmptySiteFormValue();
  }

  private normalizeSiteGroup(siteGroup: string | undefined): string {
    if (!siteGroup) {
      return '';
    }

    const siteGroups = this.siteGroups();
    if (siteGroups.some((candidate) => candidate.id === siteGroup)) {
      return siteGroup;
    }

    const legacyIndex = Number(siteGroup);
    if (Number.isInteger(legacyIndex) && legacyIndex > 0) {
      return siteGroups[legacyIndex - 1]?.id ?? siteGroup;
    }

    return siteGroup;
  }

  private async runWithSaveSpinner(action: () => void | Promise<void>) {
    this.isSaving.set(true);

    try {
      await runWithDemoSaveDelay(action);
    } finally {
      this.isSaving.set(false);
    }
  }
}

@Component({
  selector: 'app-remove-site-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatButtonModule, MatIconModule, Spinner],
  template: `
    <h2 mat-dialog-title>Remove Site?</h2>
    <mat-dialog-content>
      <div>{{ data.siteName }}</div>
      @if (data.assignedUserCount > 0) {
        <div>
          This site still has {{ data.assignedUserCount }} assigned user{{ data.assignedUserCount === 1 ? '' : 's' }}.
          Removing it will unassign those users and permanently remove the site.
        </div>
      } @else {
        <div>This will permanently remove the site.</div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button matButton="filled" type="button" mat-dialog-close [disabled]="isDeleting()">Cancel</button>
      <button mat-button matButton="filled" type="button" class="remove-action" [disabled]="isDeleting()" (click)="confirmRemove()">
        <span class="dialog-action-content">
          @if (isDeleting()) {
            <spinner class="dialog-action-indicator"></spinner>
          } @else {
            <mat-icon class="dialog-action-indicator">close</mat-icon>
          }
          <span>{{ isDeleting() ? 'Removing...' : 'Remove Site' }}</span>
        </span>
      </button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoveSiteDialogComponent {
  readonly data = inject<RemoveSiteDialogData>(MAT_DIALOG_DATA);
  readonly isDeleting = signal(false);
  private readonly dialogRef = inject(MatDialogRef<RemoveSiteDialogComponent>);

  async confirmRemove(): Promise<void> {
    if (this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    try {
      await waitForDemoSaveDelay();
      this.dialogRef.close(true);
    } finally {
      this.isDeleting.set(false);
    }
  }
}