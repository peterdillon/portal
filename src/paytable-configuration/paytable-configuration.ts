import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormField, FormRoot, form, required, SchemaPathTree } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { getFormFieldError } from '@shared/form-field-error/form-field-error';
import { PaytableConfigurationStore } from './paytable-configuration.store';

interface PaytableConfigurationFormValue {
  gameName: string;
  payTable: string;
}

@Component({
  selector: 'app-paytable-configuration',
  imports: [
    FormField,
    FormRoot,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './paytable-configuration.html',
  styleUrl: './paytable-configuration.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaytableConfigurationComponent implements OnInit {
  protected readonly getFormFieldError = getFormFieldError;
  readonly store = inject(PaytableConfigurationStore);
  readonly formModel = signal<PaytableConfigurationFormValue>(this.createEmptyFormValue());
  readonly form = form(this.formModel, (fieldPath: SchemaPathTree<PaytableConfigurationFormValue>) => {
    required(fieldPath.gameName, { message: 'Select a game' });
    required(fieldPath.payTable, { message: 'Enter a pay table code' });
  }, {
    submission: {
      action: async (formValueSignal) => {
        const formValue = formValueSignal().value();
        const payTable = this.normalizePayTable(formValue.payTable);

        if (!this.isValidPayTable(payTable)) {
          return;
        }

        this.store.addConfiguration({
          gameName: formValue.gameName,
          payTable,
        });

        this.form().reset(this.createEmptyFormValue());
      },
    },
  });
  readonly submitDisabled = computed(() => this.store.isLoading() || this.form().invalid() || this.hasInvalidPayTable());

  ngOnInit(): void {
    this.store.initialLoadGames();
  }

  removeConfiguration(index: number) {
    this.store.removeConfiguration(index);
  }

  onPayTableBlur() {
    const currentValue = this.form().value();
    const normalizedValue = this.normalizePayTable(currentValue.payTable);

    if (normalizedValue !== currentValue.payTable) {
      this.form().reset({
        ...currentValue,
        payTable: normalizedValue,
      });
    }
  }

  payTableError() {
    const fieldError = getFormFieldError(this.form.payTable);
    if (fieldError) {
      return fieldError;
    }

    return this.showPayTableFormatError() ? 'Use the format 12345A' : null;
  }

  private hasInvalidPayTable() {
    const payTable = this.normalizePayTable(this.form().value().payTable);
    return payTable.length > 0 && !this.isValidPayTable(payTable);
  }

  private showPayTableFormatError() {
    const payTableField = this.form.payTable();
    return payTableField.touched() && this.hasInvalidPayTable();
  }

  private normalizePayTable(value: string) {
    return value.trim().toUpperCase();
  }

  private isValidPayTable(value: string) {
    return /^\d{5}[A-Z]$/.test(value);
  }

  private createEmptyFormValue(): PaytableConfigurationFormValue {
    return {
      gameName: '',
      payTable: '',
    };
  }
}