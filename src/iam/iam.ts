import { Component, inject, ViewChild } from '@angular/core';
import { MatListModule, MatListOption } from '@angular/material/list';
import { FormsModule } from '@angular/forms';
import { MatSelectionList } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { IAMStore } from '../store/iam/iam.store';
import { MatTooltip } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-iam',
  imports: [
    FormsModule,
    CommonModule,
    MatListModule,
    MatSelectionList,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDividerModule,
    MatTooltip,
    MatToolbarModule
  ],
  templateUrl: './iam.html',
  styleUrl: './iam.scss',
})
export class Iam {
  // Use a looser type to match the runtime store shape
  // readonly store: any = IAMStore;
  readonly store = inject(IAMStore);

  @ViewChild('groupSelection') groupSelection!: MatSelectionList;
  @ViewChild('userSelection') userSelection!: MatSelectionList;

ngOnInit() {
  console.log('Store:', this.store);
  console.log('hasChanges defined?', 'hasChanges' in this.store);
}
  // Handle group selection
  onGroupSelected(groupId: number) {
    this.store.selectGroup(groupId);
  }

  // Handle user checkbox toggle
  onUserToggled(userId: number) {
    this.store.toggleUserSelection(userId);
  }

  // Add selected users to group
  addUsersToGroup() {
    this.store.addUsersToGroup();
  }

  // Remove selected users from group
  removeUsersFromGroup() {
    this.store.removeUsersFromGroup();
  }

  // Save all changes
  saveChanges() {
    this.store.saveChanges();
  }

  // Discard all changes
  discardChanges() {
    if (confirm('Are you sure you want to discard all changes?')) {
      this.store.discardChanges();
    }
  }

  // Select/deselect all users in group
  toggleSelectAll() {
    if (this.store.areAllGroupUsersSelected()) {
      this.store.deselectAllUsers();
    } else {
      this.store.selectAllUsersInGroup();
    }
  }
}