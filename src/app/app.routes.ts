import { Routes } from '@angular/router';
import { PageTwo } from '../page-two/page-two';
import { DialogOverviewExample } from '../dialog/dialog';
import { ProductListComponent } from '../products/products';
import { ProductDetail } from '../product-detail/product-detail';
import { GroupManager } from '../group-manager/group-manager';
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