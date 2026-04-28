import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { EgmsStore } from '@egms/egms.store';
import { Egm } from '@egms/egm.model';

@Component({
  selector: 'app-egms',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  styleUrls: ['./egms.scss'],
  templateUrl: './egms.html'
})
export class EgmsComponent {
  store = inject(EgmsStore);
  private readonly dialog = inject(MatDialog);

  deleteEgm(egm: Egm): void {
    const dialogRef = this.dialog.open(DeleteEgmDialogComponent, {
      data: egm,
      width: '360px',
      maxWidth: '92vw',
      panelClass: 'egm-delete-dialog-panel'
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean | undefined) => {
      if (confirmed) {
        this.store.deleteEgm(egm.id);
      }
    });
  }
}

@Component({
  selector: 'app-delete-egm-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatButtonModule],
  styleUrls: ['./egms.scss'],
  template: `
    <h2 mat-dialog-title>Delete EGM?</h2>
    <mat-dialog-content>
      {{ data.manufacturer }}: {{ data.model }} <br>
      Fixed Asset Number: {{ data.fixedAssetNumber }}
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button matButton="filled" type="button" mat-dialog-close>Cancel</button>
      <button mat-button matButton="filled" type="button" class="remove-action" [mat-dialog-close]="true">Delete</button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteEgmDialogComponent {
  readonly data = inject<Egm>(MAT_DIALOG_DATA);
}