// users.ts
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatSelectionList, MatListOption, MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormField, FormRoot, email, form, minLength, required, SchemaPathTree } from '@angular/forms/signals';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { ThemeService } from '@core/theme/theme.service';
import { getFormFieldError } from '@shared/form-field-error/form-field-error';
import { SaveCancelActionsComponent } from '@shared/save-cancel-actions/save-cancel-actions';
import { User } from '@users/user.model';
import { UsersStore } from '@users/users.store';

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
    FormField, FormRoot, MatListModule, MatSelectModule, MatOptionModule, SaveCancelActionsComponent
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Users implements OnInit {

  protected readonly getFormFieldError = getFormFieldError;
  store = inject(UsersStore);
  themeService = inject(ThemeService);
  selectedUserId = signal<string | null>(null);
  readonly isEditMode = computed(() => this.selectedUserId() !== null);
  readonly submitLabel = computed(() => this.isEditMode() ? 'Save User' : 'Add User');
  readonly availablePermissions = [
    'site.read',
    'site.write',
    'site.delete',
    'user.read',
    'user.write',
    'user.delete',
    'config.read',
    'config.write',
    'audit.read',
    'billing.read'
  ];
  userModel = signal<UserFormValue>(this.createEmptyUserFormValue());
  userForm = form(this.userModel, (fieldPath: SchemaPathTree<UserFormValue>) => {
    required(fieldPath.name, { message: 'Name is required' });
    required(fieldPath.displayName, { message: 'Display name is required' });
    required(fieldPath.email, { message: 'Email is required' });
    email(fieldPath.email, { message: 'Enter a valid email address' });
    required(fieldPath.phone, { message: 'Phone is required' });
    required(fieldPath.employeeName, { message: 'Employee name is required' });
    required(fieldPath.employeeNumber, { message: 'Employee number is required' });
    required(fieldPath.siteId, { message: 'Site ID is required' });
    minLength(fieldPath.permissions, 1, { message: 'Select at least one permission' });
  }, {
    submission: {
      action: async (form) => {
        const formValue = form().value();
        const user: User = {
          id: this.selectedUserId() ?? `usr-${Date.now()}`,
          name: formValue.name,
          displayName: formValue.displayName,
          email: formValue.email,
          phone: formValue.phone,
          employeeName: formValue.employeeName,
          employeeNumber: formValue.employeeNumber,
          permissions: formValue.permissions,
          siteId: formValue.siteId,
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
    this.store.ensureUsersLoaded();
  }

  cancelEdit() {
    this.selectedUserId.set(null);
    this.userForm().reset(this.createEmptyUserFormValue());
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
}   