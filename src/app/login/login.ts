// login.component.ts
import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorStateMatcher } from '@angular/material/core';
import { FormField, FormRoot, email, form, required, SchemaPathTree } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCard, MatCardTitle, MatCardContent, MatCardActions } from "@angular/material/card";
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/theme/theme.service';

interface LoginData {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormField, FormRoot, MatFormFieldModule, MatInputModule, MatCard, MatCardTitle, MatCardContent, MatCardActions, MatButtonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class LoginComponent {
  private authService = inject(AuthService);
  themeService = inject(ThemeService);
  loginError = signal<string | null>(null);
  readonly loginErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: (control, form) => {
      const hasControlError = !!control && control.invalid && (control.touched || !!form?.submitted);
      return hasControlError || this.loginError() !== null;
    }
  };

  loginModel = signal<LoginData>({ email: '', password: '' });   
  loginForm = form(this.loginModel, (fieldPath: SchemaPathTree<LoginData>) => {
    required(fieldPath.email, { message: 'Email is required' });
    email(fieldPath.email, { message: 'Enter a valid email address' });
    required(fieldPath.password, { message: 'Password is required' });
    }, {
  submission: {
    action: async (form) => {
      const credentials = {
        username: form().value().email,
        password: form().value().password
      };
      this.loginError.set(null);

      try {
        await firstValueFrom(this.authService.login(credentials));
      } catch (error) {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.loginError.set('Email not found');
          return;
        }

        throw error;
      }
    }
  }
});

logout() {
    this.authService.logout();
  }

  clearLoginError() {
    this.loginError.set(null);
  }

  emailErrorMessage() {
    if (this.loginError()) {
      return this.loginError();
    }

    if (this.loginForm.email().invalid() && this.loginForm.email().touched()) {
      return this.loginForm.email().errors()[0]?.message ?? null;
    }

    return null;
  }

  passwordErrorMessage() {
    if (this.loginForm.password().invalid() && this.loginForm.password().touched()) {
      return this.loginForm.password().errors()[0]?.message ?? null;
    }

    return null;
  }

}   