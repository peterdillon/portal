import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '@shared/confirmation-dialog/confirmation-dialog';
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
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete EGM?',
        bodyLines: [
          `${egm.manufacturer}: ${egm.model}`,
          `Fixed Asset Number: ${egm.fixedAssetNumber}`,
        ],
        confirmLabel: 'Delete',
        pendingLabel: 'Deleting...',
      },
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
