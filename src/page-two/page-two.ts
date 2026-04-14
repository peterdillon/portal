import { Component, signal, effect, inject, viewChild } from '@angular/core';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { SelectionModel } from '@angular/cdk/collections';
import { MatIcon } from "@angular/material/icon";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface PeriodicElement {
  position: number;
  name: string;
  weight: number;
  symbol: string;
  editing?: boolean;
}

const COLUMN_DEFS = [
  { def: 'position', width: '10%' },
  { def: 'name', width: '40%' },
  { def: 'weight', width: '20%' },
  { def: 'symbol', width: '30%' }
];

const ELEMENT_DATA: PeriodicElement[] = [
  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },
  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },
  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },
  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },
  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },
  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },
  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },
  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },
  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },
  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },
  { position: 11, name: 'Sodium', weight: 22.9897, symbol: 'Na' },
  { position: 12, name: 'Magnesium', weight: 24.305, symbol: 'Mg' },
  { position: 13, name: 'Aluminum', weight: 26.9815, symbol: 'Al' },
  { position: 14, name: 'Silicon', weight: 28.0855, symbol: 'Si' },
  { position: 15, name: 'Phosphorus', weight: 30.9738, symbol: 'P' },
  { position: 16, name: 'Sulfur', weight: 32.065, symbol: 'S' },
  { position: 17, name: 'Chlorine', weight: 35.453, symbol: 'Cl' },
  { position: 18, name: 'Argon', weight: 39.948, symbol: 'Ar' },
  { position: 19, name: 'Potassium', weight: 39.0983, symbol: 'K' },
  { position: 20, name: 'Calcium', weight: 40.078, symbol: 'Ca' }
];

@Component({
  selector: 'app-page-two',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatSortModule, MatPaginatorModule, MatIcon, MatCheckboxModule, FormsModule, MatInputModule],
  templateUrl: './page-two.html',
  styleUrl: './page-two.scss',
})
export class PageTwo {


  dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);
  displayedColumns: string[] = ['select', 'position', 'name', 'weight', 'symbol', 'actions'];
  sort = viewChild.required<MatSort>('sort');
  paginator = viewChild.required<MatPaginator>('paginator');
  selection = new SelectionModel<PeriodicElement>(true, []);
  originalData: PeriodicElement | null = null;

  constructor() {
    effect(() => {
      this.dataSource.sort = this.sort();
      this.dataSource.paginator = this.paginator();
    });
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }
   startEdit(row: PeriodicElement) {
    this.originalData = { ...row }; // Store original
    row.editing = true;
  }

  saveEdit(row: PeriodicElement) {
    row.editing = false;
  }

  cancelEdit(row: PeriodicElement) {
    if (this.originalData) {
      Object.assign(row, this.originalData);
    }
    row.editing = false;
  }

}
