import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatListModule, MatListOption, MatSelectionList, MatSelectionListChange } from '@angular/material/list';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { FormField, FormRoot, email, form, required, SchemaPathTree } from '@angular/forms/signals';
import { SitesStore } from '@site-manager/sites.store';
import { Site } from '@site-manager/site.model';
import { ConfirmationDialogComponent } from '@shared/confirmation-dialog/confirmation-dialog';
import { getFormFieldError } from '@shared/form-field-error/form-field-error';
import { runWithDemoSaveDelay } from '../app/shared/demo-save-delay';
import { SaveCancelActionsComponent } from '@shared/save-cancel-actions/save-cancel-actions';
import { UsersStore } from '@users/users.store';
import { SiteGroupRecord, SitesService } from '@app/core/services/sites.service';

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
export class SiteManager implements OnInit {
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

    return (Object.keys(baselineValue) as (keyof Site)[]).reduce((count, key) => {
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

    return this.store.sites().filter((site) => site.siteGroup === selectedGroup);
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

  displaySiteGroup(siteGroup: string) {
    return siteGroup;
  }

  readonly siteModel = signal<Site>(this.createEmptySite());
  readonly siteForm = form(this.siteModel, (fieldPath: SchemaPathTree<Site>) => {
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
      this.siteForm().reset(this.createEmptySite());
      return;
    }

    const site = this.store.sites().find((candidate) => candidate.id === siteId);
    if (!site) {
      this.selectedSiteId.set(null);
      this.siteForm().reset(this.createEmptySite());
      return;
    }

    this.siteForm().reset(site);
  }

  cancelEdit() {
    this.selectedSiteId.set(null);
    this.siteForm().reset(this.createEmptySite());
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
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Remove Site?',
        bodyLines: assignedUsers.length > 0
          ? [
              site.name,
              `This site still has ${assignedUsers.length} assigned user${assignedUsers.length === 1 ? '' : 's'}.`,
              'Removing it will unassign those users and permanently remove the site.',
            ]
          : [site.name, 'This will permanently remove the site.'],
        confirmLabel: 'Remove Site',
        pendingLabel: 'Removing...',
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

  private createEmptySite(): Site {
    return {
      id: 0,
      name: '',
      address: '',
      email: '',
      siteGroup: '',
    };
  }

  private getSiteFormBaseline(): Site {
    const selectedSiteId = this.selectedSiteId();

    if (selectedSiteId == null) {
      return this.createEmptySite();
    }

    const site = this.store.sites().find((candidate) => candidate.id === selectedSiteId);
    return site ?? this.createEmptySite();
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
