// auth.guard.ts
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

// Simple guard for any authenticated user
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Use RedirectCommand for more control
  const loginUrl = router.parseUrl('/login');
  return new RedirectCommand(loginUrl, {
    skipLocationChange: true,
    info: { returnUrl: router.routerState.snapshot.url }
  });
};

// Factory guard for role-based access
export function requireRole(requiredRole: string): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const userRole = authService.userRole();
    if (userRole === requiredRole) {
      return true;
    }

    return router.parseUrl('/unauthorized');
  };
}   

export function requirePermission(requiredPermission: string): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.userPermissions().includes(requiredPermission)) {
      return true;
    }

    return router.parseUrl('/unauthorized');
  };
}

export function requireAnyPermission(requiredPermissions: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (requiredPermissions.some((permission) => authService.userPermissions().includes(permission))) {
      return true;
    }

    return router.parseUrl('/unauthorized');
  };
}

export function requireAllPermissions(requiredPermissions: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (requiredPermissions.every((permission) => authService.userPermissions().includes(permission))) {
      return true;
    }

    return router.parseUrl('/unauthorized');
  };
}