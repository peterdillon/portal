import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatListModule, MatListOption, MatSelectionList, MatSelectionListChange } from '@angular/material/list';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { FormField, FormRoot, form, required, SchemaPathTree } from '@angular/forms/signals';
import { getFormFieldError } from '@shared/form-field-error/form-field-error';
import { runWithDemoSaveDelay } from '../app/shared/demo-save-delay';
import { SaveCancelActionsComponent } from '@shared/save-cancel-actions/save-cancel-actions';
import { PermissionsStore } from '@features/permissions-manager/permissions.store';
import { UsersStore } from '@users/users.store';

interface PermissionFormValue {
  groupName: string;
  permissionName: string;
}

@Component({
  selector: 'app-permissions-manager',
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
  templateUrl: './permissions-manager.html',
  styleUrl: './permissions-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsManager {
  protected readonly getFormFieldError = getFormFieldError;
  readonly store = inject(PermissionsStore);
  readonly usersStore = inject(UsersStore);
  readonly isSaving = signal(false);
  readonly selectedPermissionName = signal<string | null>(null);
  readonly isEditMode = computed(() => this.selectedPermissionName() !== null);
  readonly submitLabel = computed(() => this.isEditMode() ? 'Save Permission' : 'Add Permission');
  readonly submitDisabled = computed(() => this.isSaving() || this.permissionForm().invalid() || this.hasDuplicatePermission());
  readonly changedFieldCount = computed(() => {
    const baselineValue = this.getPermissionFormBaseline();
    const currentValue = this.permissionForm().value();

    return (Object.keys(baselineValue) as Array<keyof PermissionFormValue>).reduce((count, key) => {
      return count + (baselineValue[key] !== currentValue[key] ? 1 : 0);
    }, 0);
  });
  readonly hasUnsavedChanges = computed(() => this.changedFieldCount() > 0);
  readonly discardLabel = computed(() => `Discard ${this.changedFieldCount()} ${this.changedFieldCount() === 1 ? 'Change' : 'Changes'}`);
  readonly permissionModel = signal<PermissionFormValue>(this.createEmptyPermissionFormValue());
  readonly permissionForm = form(this.permissionModel, (fieldPath: SchemaPathTree<PermissionFormValue>) => {
    required(fieldPath.groupName, { message: 'Category is required' });
    required(fieldPath.permissionName, { message: 'Permission name is required' });
  }, {
    submission: {
      action: async (formValueSignal) => {
        await this.runWithSaveSpinner(async () => {
          const formValue = formValueSignal().value();
          const previousPermissionName = this.selectedPermissionName();
          const savedPermissionName = this.store.savePermission({
            originalPermission: previousPermissionName,
            nextPermission: formValue.permissionName,
            groupName: formValue.groupName,
          });

          if (!savedPermissionName) {
            return;
          }

          if (previousPermissionName && previousPermissionName !== savedPermissionName) {
            this.usersStore['userEntities']().forEach((user) => {
              if (!user.permissions.includes(previousPermissionName)) {
                return;
              }

              this.usersStore.updateUser({
                ...user,
                permissions: user.permissions.map((permission) => permission === previousPermissionName ? savedPermissionName : permission),
              });
            });
          }

          this.cancelEdit();
        });
      },
    },
  });

  ngOnInit(): void {
    this.store.initialLoadPermissions();
    this.usersStore.initialLoadUsers();
  }

  duplicatePermissionMessage() {
    const formValue = this.permissionForm().value();
    const trimmedPermissionName = this.store.formatPermissionName(formValue.groupName, formValue.permissionName);
    const selectedPermissionName = this.selectedPermissionName();

    if (!trimmedPermissionName) {
      return null;
    }

    const duplicatePermissionExists = this.store.permissions().some(
      (permission) => permission === trimmedPermissionName && permission !== selectedPermissionName
    );

    return duplicatePermissionExists ? 'Permission already exists' : null;
  }

  permissionNameError() {
    const fieldError = getFormFieldError(this.permissionForm.permissionName);
    return fieldError ?? this.duplicatePermissionMessage();
  }

  onPermissionSelected(event: MatSelectionListChange) {
    const selectedOption = event.options[0];
    const permissionName = selectedOption?.selected ? String(selectedOption.value) : null;

    this.selectedPermissionName.set(permissionName);

    if (!permissionName) {
      this.permissionForm().reset(this.createEmptyPermissionFormValue());
      return;
    }

    const selectedPermission = this.store.permissionEntries().find((entry) => entry.name === permissionName);
    if (!selectedPermission) {
      this.selectedPermissionName.set(null);
      this.permissionForm().reset(this.createEmptyPermissionFormValue());
      return;
    }

    this.store.clearError();
    this.permissionForm().reset({
      groupName: selectedPermission.groupName,
      permissionName: selectedPermission.name,
    });
  }

  cancelEdit() {
    this.selectedPermissionName.set(null);
    this.store.clearError();
    this.permissionForm().reset(this.createEmptyPermissionFormValue());
  }

  discardChanges() {
    this.store.clearError();
    this.permissionForm().reset(this.getPermissionFormBaseline());
  }

  removeSelectedPermission() {
    const permissionName = this.selectedPermissionName();
    if (!permissionName) {
      return;
    }

    this.usersStore['userEntities']().forEach((user) => {
      if (!user.permissions.includes(permissionName)) {
        return;
      }

      this.usersStore.updateUser({
        ...user,
        permissions: user.permissions.filter((permission) => permission !== permissionName),
      });
    });

    this.store.removePermission(permissionName);
    this.cancelEdit();
  }

  private hasDuplicatePermission() {
    return this.duplicatePermissionMessage() !== null;
  }

  private createEmptyPermissionFormValue(): PermissionFormValue {
    return {
      groupName: '',
      permissionName: '',
    };
  }

  private getPermissionFormBaseline(): PermissionFormValue {
    const selectedPermissionName = this.selectedPermissionName();

    if (!selectedPermissionName) {
      return this.createEmptyPermissionFormValue();
    }

    const selectedPermission = this.store.permissionEntries().find((entry) => entry.name === selectedPermissionName);
    return selectedPermission ? {
      groupName: selectedPermission.groupName,
      permissionName: selectedPermission.name,
    } : this.createEmptyPermissionFormValue();
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