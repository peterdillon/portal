// group-manager.ts
import { Component, inject, OnInit } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { FormsModule } from '@angular/forms';
import { MatSelectionList } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { GroupManagerStore } from '../store/group-manager/group-manager.store';
import { MatTooltip } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Spinner } from '../spinner/spinner';
import { ThemeService } from '../theme/theme.service';

@Component({
  selector: 'app-iam',
  imports: [
    FormsModule, CommonModule, MatListModule, MatSelectionList, MatButtonModule,
    MatIconModule, MatCheckboxModule, MatDividerModule, MatTooltip, 
    MatToolbarModule, Spinner
  ],
  templateUrl: './group-manager.html',
  styleUrl: './group-manager.scss',
})
export class GroupManager implements OnInit {
  themeService = inject(ThemeService);
  readonly store = inject(GroupManagerStore);

  ngOnInit() {
    this.store.loadGroups();
  }

  onGroupSelected(groupId: number) {
    this.store.selectGroup(groupId);
  }

  onUserToggled(userId: string | number) {
    this.store.toggleUserSelection(String(userId));
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