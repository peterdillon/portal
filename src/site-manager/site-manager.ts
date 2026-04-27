import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatListModule, MatListOption, MatSelectionList, MatSelectionListChange } from '@angular/material/list';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { FormField, FormRoot, email, form, required, SchemaPathTree } from '@angular/forms/signals';
import { SitesStore } from '@site-manager/sites.store';
import { Site } from '@site-manager/site.model';
import { getFormFieldError } from '@shared/form-field-error/form-field-error';
import { SaveCancelActionsComponent } from '@shared/save-cancel-actions/save-cancel-actions';
import { UsersStore } from '@users/users.store';

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
  readonly selectedSiteId = signal<number | null>(null);
  readonly selectedSiteGroupFilter = signal('');
  readonly siteGroups = ['1', '2', '3'];
  readonly isEditMode = computed(() => this.selectedSiteId() !== null);
  readonly submitLabel = computed(() => this.isEditMode() ? 'Save Site' : 'Add Site');
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

  readonly siteModel = signal<SiteFormValue>(this.createEmptySiteFormValue());
  readonly siteForm = form(this.siteModel, (fieldPath: SchemaPathTree<SiteFormValue>) => {
    required(fieldPath.name, { message: 'Site name is required' });
    required(fieldPath.address, { message: 'Address is required' });
    required(fieldPath.email, { message: 'Email is required' });
    email(fieldPath.email, { message: 'Enter a valid email address' });
  }, {
    submission: {
      action: async (form) => {
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

  removeSelectedSite() {
    const siteId = this.selectedSiteId();
    if (siteId == null) {
      return;
    }

    const assignedUsers = this.selectedSiteAssignedUsers();
    if (assignedUsers.length > 0) {
      const confirmed = confirm(`This site still has ${assignedUsers.length} assigned user${assignedUsers.length === 1 ? '' : 's'}. Remove the site and unassign those users?`);
      if (!confirmed) {
        return;
      }

      assignedUsers.forEach((user) => {
        this.usersStore.updateUser({ ...user, siteId: '0' });
      });
    }

    this.store.removeSite(siteId);
    this.cancelEdit();
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
      siteGroup: site.siteGroup ?? '',
    };
  }
}