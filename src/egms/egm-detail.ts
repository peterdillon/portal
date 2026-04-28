import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormField, FormRoot, form, SchemaPathTree } from '@angular/forms/signals';
import { EgmsStore } from '@egms/egms.store';
import { Egm } from '@egms/egm.model';

interface EgmFormValue {
  id: number;
  manufacturer: string;
  model: string;
  styleName: string;
  comment: string;
  fixedAssetNumber: string;
  serialNumber: string;
  warehouse: string;
  itemLocation: string;
  inServiceDate: string;
  location: string;
  assignedSiteName: string;
  assignedSiteCode: number;
}

@Component({
  selector: 'app-egm-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormField,
    MatLabel,
    MatInput,
    FormField,
    FormRoot,
  ],
  templateUrl: './egm-detail.html',
  styleUrl: './egm-detail.scss'
})
export class EgmDetailComponent implements OnInit {
  store = inject(EgmsStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly egmModel = signal<EgmFormValue>(this.createEmptyEgmFormValue());
  readonly egmForm = form(this.egmModel, (_fieldPath: SchemaPathTree<EgmFormValue>) => {}, {});
  readonly changedFieldCount = computed(() => {
    const egm = this.store.selectedEgm();

    if (!egm) {
      return 0;
    }

    const savedValue = this.toFormValue(egm);
    const currentValue = this.egmForm().value();

    return (Object.keys(savedValue) as Array<keyof EgmFormValue>).reduce((count, key) => {
      return count + (savedValue[key] !== currentValue[key] ? 1 : 0);
    }, 0);
  });
  readonly hasUnsavedChanges = computed(() => this.changedFieldCount() > 0);

  constructor() {
    effect(() => {
      const egm = this.store.selectedEgm();

      if (!egm) {
        return;
      }

      this.egmForm().reset(this.toFormValue(egm));
    });
  }


  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const egmId = parseInt(id, 10);
      this.store.selectEgm(egmId);
    }
  }

  goBack(): void {
    this.router.navigate(['/egms']);
  }

  discardChanges(): void {
    const currentEgm = this.store.selectedEgm();

    if (!currentEgm) {
      return;
    }

    this.egmForm().reset(this.toFormValue(currentEgm));
  }

  saveEgm(event: Event): void {
    event.preventDefault();

    const currentEgm = this.store.selectedEgm();
    if (!currentEgm) {
      return;
    }

    const formValue = this.egmForm().value();
    const updatedEgm: Egm = {
      id: formValue.id,
      fixedAssetNumber: formValue.fixedAssetNumber,
      model: formValue.model,
      manufacturer: formValue.manufacturer,
      serialNumber: formValue.serialNumber,
      inServiceDate: formValue.inServiceDate || undefined,
      warehouse: formValue.warehouse,
      itemLocation: formValue.itemLocation,
      location: formValue.location,
      comment: formValue.comment,
      styleName: formValue.styleName,
      assignedSiteCode: formValue.assignedSiteCode,
      assignedSiteName: formValue.assignedSiteName,
    };

    this.store.updateEgm(updatedEgm);
    this.egmForm().reset(this.toFormValue(updatedEgm));
  }

  private createEmptyEgmFormValue(): EgmFormValue {
    return {
      id: 0,
      manufacturer: '',
      model: '',
      styleName: '',
      comment: '',
      fixedAssetNumber: '',
      serialNumber: '',
      warehouse: '',
      itemLocation: '',
      inServiceDate: '',
      location: '',
      assignedSiteName: '',
      assignedSiteCode: 0,
    };
  }

  private toFormValue(egm: Egm): EgmFormValue {
    return {
      id: egm.id,
      manufacturer: egm.manufacturer,
      model: egm.model,
      styleName: egm.styleName,
      comment: egm.comment,
      fixedAssetNumber: egm.fixedAssetNumber,
      serialNumber: egm.serialNumber,
      warehouse: egm.warehouse,
      itemLocation: egm.itemLocation,
      inServiceDate: egm.inServiceDate ?? '',
      location: egm.location,
      assignedSiteName: egm.assignedSiteName,
      assignedSiteCode: egm.assignedSiteCode,
    };
  }
}