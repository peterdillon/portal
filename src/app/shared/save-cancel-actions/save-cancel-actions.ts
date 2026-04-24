import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-save-cancel-actions',
  imports: [MatButtonModule],
  template: `
    <div class="action-bar">
      <button mat-button matButton="filled" type="submit" [disabled]="submitDisabled()">
        {{ submitLabel() }}
      </button>

      @if (hasSecondaryActions()) {
        <div class="secondary-actions">
          @if (showCancel()) {
            <button mat-button matButton="tonal" type="button" [disabled]="cancelDisabled()" (click)="cancelClicked.emit()">
              {{ cancelLabel() }}
            </button>
          }

          @if (showRemove()) {
            <button
              mat-button
              matButton="filled"
              type="button"
              class="remove-action"
              [disabled]="removeDisabled()"
              (click)="removeClicked.emit()">
              {{ removeLabel() }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styleUrls: ['./save-cancel-actions.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaveCancelActionsComponent {
  submitLabel = input('Save');
  cancelLabel = input('Cancel');
  removeLabel = input('Remove');
  submitDisabled = input(false);
  cancelDisabled = input(false);
  removeDisabled = input(false);
  showCancel = input(true);
  showRemove = input(false);

  cancelClicked = output<void>();
  removeClicked = output<void>();

  protected readonly hasSecondaryActions = computed(() => this.showCancel() || this.showRemove());
}