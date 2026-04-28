// users.ts
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatSelectionList, MatListOption, MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormField, FormRoot, email, form, minLength, required, SchemaPathTree } from '@angular/forms/signals';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule, MatPseudoCheckboxModule } from '@angular/material/core';
import { ThemeService } from '@core/theme/theme.service';
import { getFormFieldError } from '@shared/form-field-error/form-field-error';
import { PermissionGroup } from '@users/permission-group.model';
import { SaveCancelActionsComponent } from '@shared/save-cancel-actions/save-cancel-actions';
import { User } from '@users/user.model';
import { UsersStore } from '@users/users.store';
import { PermissionsStore } from '@features/permissions-manager/permissions.store';

interface UserFormValue {
  name: string;
  displayName: string;
  email: string;
  phone: string;
  employeeName: string;
  employeeNumber: string;
  siteId: string;
  permissions: string[];
}

@Component({
  selector: 'app-users',
  imports: [ MatSelectionList, MatListOption, MatFormField, MatLabel, MatInput,
    FormField, FormRoot, MatListModule, MatSelectModule, MatOptionModule, MatPseudoCheckboxModule, SaveCancelActionsComponent
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Users implements OnInit {

  protected readonly getFormFieldError = getFormFieldError;
  store = inject(UsersStore);
  themeService = inject(ThemeService);
  permissionsStore = inject(PermissionsStore);
  selectedUserId = signal<string | null>(null);
  submitAttempted = signal(false);

  readonly isEditMode = computed(() => this.selectedUserId() !== null);
  readonly submitLabel = computed(() => this.isEditMode() ? 'Save User' : 'Add User');
  readonly changedFieldCount = computed(() => {
    const baselineValue = this.getUserFormBaseline();
    const currentValue = this.userForm().value();

    return (Object.keys(baselineValue) as Array<keyof UserFormValue>).reduce((count, key) => {
      if (key === 'permissions') {
        const baselinePermissions = [...baselineValue.permissions].sort();
        const currentPermissions = [...currentValue.permissions].sort();

        return count + (JSON.stringify(baselinePermissions) !== JSON.stringify(currentPermissions) ? 1 : 0);
      }

      return count + (baselineValue[key] !== currentValue[key] ? 1 : 0);
    }, 0);
  });
  readonly hasUnsavedChanges = computed(() => this.changedFieldCount() > 0);
  readonly discardLabel = computed(() => `Discard ${this.changedFieldCount()} ${this.changedFieldCount() === 1 ? 'Change' : 'Changes'}`);
  readonly currentUserSiteId = computed(() => this.userForm().value().siteId);
  readonly permissionGroups = this.permissionsStore.permissionGroups;
  
  userModel = signal<UserFormValue>(this.createEmptyUserFormValue());
  userForm = form(this.userModel, (fieldPath: SchemaPathTree<UserFormValue>) => {
    required(fieldPath.name, { message: 'Name is required' });
    required(fieldPath.displayName, { message: 'Display name is required' });
    required(fieldPath.email, { message: 'Email is required' });
    email(fieldPath.email, { message: 'Enter a valid email address' });
    required(fieldPath.phone, { message: 'Phone is required' });
    required(fieldPath.employeeName, { message: 'Employee name is required' });
    required(fieldPath.employeeNumber, { message: 'Employee number is required' });
    minLength(fieldPath.permissions, 1, { message: 'Select at least one permission' });
  }, {
    submission: {
      action: async (form) => {
        const formValue = form().value();
        const existingUser = this.selectedUserId()
          ? this.store['userEntities']().find((user) => user.id === this.selectedUserId())
          : null;
        const user: User = {
          id: this.selectedUserId() ?? `usr-${Date.now()}`,
          name: formValue.name,
          displayName: formValue.displayName,
          email: formValue.email,
          phone: formValue.phone,
          employeeName: formValue.employeeName,
          employeeNumber: formValue.employeeNumber,
          permissions: formValue.permissions,
          siteId: existingUser?.siteId ?? '0',
        };

        if (this.isEditMode()) {
          this.store.updateUser(user);
        } else {
          this.store.addUser(user);
        }

        this.cancelEdit();
      }
    }
  });

  ngOnInit(): void {
    this.store.initialLoadUsers();
    this.permissionsStore.initialLoadPermissions();
  }

  showFieldError(field: () => { invalid(): boolean; touched(): boolean; errors(): Array<{ message?: string }> }) {
    const state = field();

    if (state.invalid() && (state.touched() || this.submitAttempted())) {
      return state.errors()[0]?.message ?? null;
    }

    return null;
  }

  onSubmitAttempt() {
    this.submitAttempted.set(true);
  }

  togglePermissionGroup(group: PermissionGroup) {
    const selectedPermissions = this.userForm().value().permissions;
    const groupFullySelected = this.groupPermissionsSelectedCount(group) === group.permissions.length;
    const nextPermissions = groupFullySelected
      ? selectedPermissions.filter((permission) => !group.permissions.includes(permission))
      : [...new Set([...selectedPermissions, ...group.permissions])];

    const currentFormValue = this.userForm().value();
    this.userForm().reset({
      ...currentFormValue,
      permissions: nextPermissions,
    });
  }

  groupPermissionsSelectedCount(group: PermissionGroup) {
    const selectedPermissions = this.userForm().value().permissions;
    return group.permissions.filter((permission) => selectedPermissions.includes(permission)).length;
  }

  groupSelectionState(group: PermissionGroup): 'checked' | 'indeterminate' | 'unchecked' {
    const selectedCount = this.groupPermissionsSelectedCount(group);

    if (selectedCount === group.permissions.length && group.permissions.length > 0) {
      return 'checked';
    }

    if (selectedCount > 0) {
      return 'indeterminate';
    }

    return 'unchecked';
  }

  permissionsTriggerLabel() {
    if (!this.permissionsStore.hasLoadedCatalog()) {
      return 'Loading permissions...';
    }

    return this.permissionGroups()
      .map((group) => `${group.name} ${this.groupPermissionsSelectedCount(group)}/${group.permissions.length}`)
      .join(' - ');
  }

  cancelEdit() {
    this.selectedUserId.set(null);
    this.submitAttempted.set(false);
    this.userForm().reset(this.createEmptyUserFormValue());
  }

  discardChanges() {
    this.submitAttempted.set(false);
    this.userForm().reset(this.getUserFormBaseline());
  }

  removeSelectedUser() {
    const userId = this.selectedUserId();
    if (!userId) {
      return;
    }

    this.store.removeUser(userId);
    this.cancelEdit();
  }

  onUserSelected(event: MatSelectionListChange) {
    const selectedOption = event.options[0];
    const selectedUserId = selectedOption?.selected ? String(selectedOption.value) : null;

    this.selectedUserId.set(selectedUserId);
    this.submitAttempted.set(false);

    if (!selectedUserId) {
      this.userForm().reset(this.createEmptyUserFormValue());
      return;
    }

    const selectedUser = this.store['userEntities']().find((user) => user.id === selectedUserId);
    if (!selectedUser) {
      this.selectedUserId.set(null);
      this.userForm().reset(this.createEmptyUserFormValue());
      return;
    }

    this.userForm().reset(this.toFormValue(selectedUser));
  }

  private createEmptyUserFormValue(): UserFormValue {
    return {
      name: '',
      displayName: '',
      email: '',
      phone: '',
      employeeName: '',
      employeeNumber: '',
      siteId: '',
      permissions: []
    };
  }

  private toFormValue(user: User): UserFormValue {
    return {
      name: user.name,
      displayName: user.displayName,
      email: user.email,
      phone: user.phone,
      employeeName: user.employeeName,
      employeeNumber: user.employeeNumber,
      siteId: user.siteId,
      permissions: [...user.permissions]
    };
  }

  private getUserFormBaseline(): UserFormValue {
    const selectedUserId = this.selectedUserId();

    if (!selectedUserId) {
      return this.createEmptyUserFormValue();
    }

    const selectedUser = this.store['userEntities']().find((user) => user.id === selectedUserId);
    return selectedUser ? this.toFormValue(selectedUser) : this.createEmptyUserFormValue();
  }
}   