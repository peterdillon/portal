import { Component, inject } from '@angular/core';
import { MatListModule } from '@angular/material/list';
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
    FormsModule, CommonModule, MatListModule, MatSelectionList, MatButtonModule, MatIconModule,
    MatCheckboxModule, MatDividerModule, MatTooltip, MatToolbarModule
  ],
  templateUrl: './iam.html',
  styleUrl: './iam.scss',
})
export class Iam {

  readonly store = inject(IAMStore);

  onGroupSelected(groupId: number) {
    this.store.selectGroup(groupId);
  }

  onUserToggled(userId: number) {
    this.store.toggleUserSelection(userId);
  }

  addUsersToGroup() {
    this.store.addUsersToGroup();
  }

  removeUsersFromGroup() {
    this.store.removeUsersFromGroup();
  }

  saveChanges() {
    this.store.saveChanges();
  }

  discardChanges() {
    if (confirm('Are you sure you want to discard all changes?')) {
      this.store.discardChanges();
    }
  }

  toggleSelectAll() {
    if (this.store.areAllGroupUsersSelected()) {
      this.store.deselectAllUsers();
    } else {
      this.store.selectAllUsersInGroup();
    }
  }
}