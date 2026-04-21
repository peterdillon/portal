// users.ts
import { Component, inject, OnInit } from '@angular/core';
import { MatSelectionList, MatListOption, MatListModule } from '@angular/material/list';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatAnchor } from "@angular/material/button";
import { ThemeService } from '@core/theme/theme.service';
import { User } from '@users/user.model';
import { UsersStore } from '@users/users.store';

@Component({
  selector: 'app-users',
  imports: [
    MatSelectionList, MatListOption, MatFormField, MatLabel, MatInput,
    ReactiveFormsModule, MatListModule, MatAnchor
],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class Users implements OnInit {

  store = inject(UsersStore);
  private fb = inject(FormBuilder);
  themeService = inject(ThemeService);
  defaultValues = { 
    email: 'pjd@aol.com', 
    displayName: 'Johann Bach', 
    name: 'johannes.bach',
    permissions: 'site.write, site.delete, user.read'
  };
  userForm: FormGroup = this.fb.group({
    name: ['peter.dillon',],
    displayName: ['Peter Dillon', Validators.required],
    email: ['pjd@aol.com'],
    phone: ['123-456-7890'],
    employeeName: ['Golden Route Operations'],
    employeeNumber: ['98761234'],
    groupId: [8],
    permissions: ['site.delete, site.update']
  });

  ngOnInit(): void {
    this.store.loadUsers();
  }

  onCreateUser() {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      const user: User = {
        id: `usr-${Date.now()}`,
        name: formValue.name,
        displayName: formValue.displayName,
        email: formValue.email,
        phone: formValue.phone,
        employeeName: formValue.employeeName,
        employeeNumber: formValue.employeeNumber,
        permissions: formValue.permissions ? formValue.permissions.split(',').map((p: string) => p.trim()) : [],
        groupId: formValue.groupId,
      };
      this.store.addUser(user);
      this.userForm.reset(this.defaultValues);
    }
  }
}   