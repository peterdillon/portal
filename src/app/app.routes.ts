import { Routes } from '@angular/router';
import { PageTwo } from '../page-two/page-two';
import { DialogOverviewExample } from '../dialog/dialog';
import { ProductListComponent } from '../products/products';
import { ProductDetail } from '../product-detail/product-detail';
import { Iam } from '../iam/iam';
import { Users } from '../users/users';

export const routes: Routes = [
  {
    path: 'page-two',
    component: PageTwo
  },
  {
    path: 'products',
    component: ProductListComponent
  },
  { path: 'products/:id', 
    component: ProductDetail
  },
  { path: 'iam', 
    component: Iam
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