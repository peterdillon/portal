import { Routes } from '@angular/router';
import { PageTwo } from '../page-two/page-two';
import { DialogOverviewExample } from '../dialog/dialog';
import { ProductListComponent } from '../products/products';
import { ProductDetail } from '../product-detail/product-detail';
import { GroupManager } from '../group-manager/group-manager';
import { Users } from '../users/users';
import { authGuard } from '../services/auth.guard';
import { LoginComponent } from './login/login';
import { Unauthorized } from './unauthorized/unauthorized/unauthorized';

export const routes: Routes = [
  {
    path: 'page-two',
    component: PageTwo
  },
  { path: 'unauthorized', 
    component: Unauthorized 
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'products', 
    component: ProductListComponent,
    canActivate: [authGuard] 
  },
  { path: 'products/:id', 
    component: ProductDetail
  },
  { path: 'group-manager', 
    component: GroupManager
  },
  { path: 'users', 
    component: Users
  },
  {
    path: 'dialog-example',
    component: DialogOverviewExample
  },
  {
    path: '**',
    redirectTo: ''
  }
];