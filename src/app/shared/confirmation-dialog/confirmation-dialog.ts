import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { waitForDemoSaveDelay } from '../demo-save-delay';
import { Spinner } from '@shared/spinner/spinner';

export interface ConfirmationDialogData {
  title: string;
  bodyLines: string[];
  confirmLabel: string;
  pendingLabel: string;
  confirmIcon?: string;
  destructive?: boolean;
}

@Component({
  selector: 'app-confirmation-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatButtonModule, MatIconModule, Spinner],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      @for (line of data.bodyLines; track $index) {
        <div>{{ line }}</div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button matButton="filled" type="button" mat-dialog-close [disabled]="isPending()">Cancel</button>
      <button
        mat-button
        matButton="filled"
        type="button"
        [class.remove-action]="data.destructive !== false"
        [disabled]="isPending()"
        (click)="confirm()">
        <span class="dialog-action-content">
          @if (isPending()) {
            <spinner class="dialog-action-indicator"></spinner>
          } @else {
            <mat-icon class="dialog-action-indicator">{{ data.confirmIcon ?? 'close' }}</mat-icon>
          }
          <span>{{ isPending() ? data.pendingLabel : data.confirmLabel }}</span>
        </span>
      </button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent {
  readonly data = inject<ConfirmationDialogData>(MAT_DIALOG_DATA);
  readonly isPending = signal(false);
  private readonly dialogRef = inject(MatDialogRef<ConfirmationDialogComponent>);

  async confirm(): Promise<void> {
    if (this.isPending()) {
      return;
    }

    this.isPending.set(true);

    try {
      await waitForDemoSaveDelay();
      this.dialogRef.close(true);
    } finally {
      this.isPending.set(false);
    }
  }
}