// auth.guard.spec.ts
import { TestBed } from '@angular/core/testing';
import type * as jasmine from 'jasmine';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
//   let authService: SpyObj<AuthService>;
let authServiceSpy: jasmine.SpyObj<AuthService>;

  let router: Router;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: spy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
  });

  it('should allow activation when authenticated', () => {
    // Arrange
    authService.isAuthenticated.and.returnValue(true);

    // Act: Use runInInjectionContext to create the required context for `inject()`
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    // Assert
    expect(result).toBeTrue();
  });

  it('should deny activation when not authenticated', () => {
    // Arrange
    authService.isAuthenticated.and.returnValue(false);
    spyOn(router, 'parseUrl').and.callThrough();

    // Act
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    // Assert
    expect(router.parseUrl).toHaveBeenCalledWith('/login');
    expect(result).not.toBeTrue();
  });
});   