import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

type SubmitButtonType = 'submit' | 'button';

@Component({
  selector: 'app-save-cancel-actions',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="action-bar">
      @if (showRemove()) {
        <button
          mat-button
          matButton="filled"
          type="button"
          class="remove-action"
          [disabled]="removeDisabled()"
          (click)="removeClicked.emit()">
          <span class="button-content-with-indicator">
            <mat-icon class="button-indicator">close</mat-icon>
            <span>{{ removeLabel() }}</span>
          </span>
        </button>
      }

      <div class="secondary-actions secondary-actions-right">
        @if (showDiscard()) {
          <button mat-button matButton="tonal" type="button" [disabled]="discardDisabled()" (click)="discardClicked.emit()">
            {{ discardLabel() }}
          </button>
        }

        <button
          mat-button
          matButton="filled"
          [attr.type]="submitButtonType()"
          [disabled]="submitDisabled()"
          (click)="submitClicked.emit()">
          <span class="button-content-with-indicator">
            @if (showSubmitSpinner()) {
              <mat-spinner class="button-indicator" diameter="20"></mat-spinner>
            } @else if (submitIcon()) {
              <mat-icon class="button-indicator">{{ submitIcon() }}</mat-icon>
            }
            <span>{{ submitLabel() }}</span>
          </span>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./save-cancel-actions.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaveCancelActionsComponent {
  submitButtonType = input<SubmitButtonType>('submit');
  submitLabel = input('Save');
  submitIcon = input<string | null>(null);
  discardLabel = input('Discard Changes');
  removeLabel = input('Remove');
  submitDisabled = input(false);
  showSubmitSpinner = input(false);
  discardDisabled = input(false);
  removeDisabled = input(false);
  showDiscard = input(false);
  showRemove = input(false);

  submitClicked = output<void>();
  discardClicked = output<void>();
  removeClicked = output<void>();
}