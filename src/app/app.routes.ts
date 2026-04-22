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
    loadComponent: () => import('@group-manager/group-manager').then((m) => m.GroupManager),
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