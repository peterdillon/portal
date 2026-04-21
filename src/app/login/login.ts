// login.component.ts
import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, required, SchemaPathTree } from '@angular/forms/signals';
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

  loginModel = signal<LoginData>({ email: '', password: '' });   
  loginForm = form(this.loginModel, (fieldPath: SchemaPathTree<LoginData>) => {
    required(fieldPath.email, { message: 'Email is required' });
    required(fieldPath.password, { message: 'Password is required' });
    }, {
  submission: {
    action: async (form) => {
      const credentials = {
        username: form().value().email,
        password: form().value().password
      };
      // Convert the Observable to a Promise
      await firstValueFrom(this.authService.login(credentials));
    }
  }
});

logout() {
    this.authService.logout();
  }

}   