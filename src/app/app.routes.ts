import { Routes } from '@angular/router';
import { authGuard, requirePermission } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  {
    path: 'page-two',
    loadComponent: () => import('@features/page-two/page-two').then((m) => m.PageTwo)
  },
  { path: 'unauthorized', 
    loadComponent: () => import('@app/unauthorized/unauthorized').then((m) => m.Unauthorized)
  },
  {
    path: 'login',
    loadComponent: () => import('@app/login/login').then((m) => m.LoginComponent)
  },
  {
    path: 'products', 
    loadComponent: () => import('@products/products').then((m) => m.ProductListComponent),
    canActivate: [authGuard] 
  },
  { path: 'products/:id', 
    loadComponent: () => import('@products/product-detail').then((m) => m.ProductDetail)
  },
  { path: 'group-manager',
    pathMatch: 'full',
    redirectTo: 'site-user-manager'
  },
  { path: 'site-user-manager', 
    loadComponent: () => import('@site-user-manager/site-user-manager').then((m) => m.SiteUserManager),
    canActivate: [authGuard, requirePermission('site.write')]
  },
  { path: 'site-manager',
    loadComponent: () => import('@site-manager/site-manager').then((m) => m.SiteManager),
    canActivate: [authGuard, requirePermission('site.write')]
  },
  { path: 'users', 
    loadComponent: () => import('@users/users').then((m) => m.Users),
    canActivate: [authGuard, requirePermission('user.write')]
  },
  {
    path: 'dialog-example',
    loadComponent: () => import('@features/dialog/dialog').then((m) => m.DialogOverviewExample)
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];