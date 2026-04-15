import { Component, inject, OnInit, signal } from '@angular/core';
import { UsersStore } from '../store/users/users.store';
import { User } from '../store/users/user.model';
import { MatSelectionList, MatListOption, MatListModule } from '@angular/material/list';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatAnchor } from "@angular/material/button";
import { ThemeService } from '../theme/theme.service'

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    MatSelectionList, MatListOption,
    MatFormField, MatLabel, MatInput,
    ReactiveFormsModule, MatListModule,
    MatAnchor
],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class Users implements OnInit {
  store = inject(UsersStore);
  private fb = inject(FormBuilder);
  
  themeService = inject(ThemeService);
  primaryColor = signal(this.themeService.getPrimaryColor());


  defaultValues = { 
    email: 'pjd@aol.com', 
    displayName: 'Johannes Bach', 
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
    permissions: ['site.delete, site.update']
  });


  constructor() {
    // Update signals if theme changes
    setInterval(() => {
      this.primaryColor.set(this.themeService.getPrimaryColor());
    }, 100);
  }

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
        permissions: formValue.permissions ? formValue.permissions.split(',').map((p: string) => p.trim()) : []
      };
      this.store.addUser(user);
      this.userForm.reset(this.defaultValues);
    }
  }
}   