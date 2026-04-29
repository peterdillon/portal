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
import { runWithDemoSaveDelay } from '../app/shared/demo-save-delay';
import { EgmsStore } from '@egms/egms.store';
import { Egm } from '@egms/egm.model';

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
  readonly isSaving = signal(false);
  readonly egmModel = signal<Egm>(this.createEmptyEgm());
  readonly egmForm = form(this.egmModel, (_fieldPath: SchemaPathTree<Egm>) => {}, {});
  readonly changedFieldCount = computed(() => {
    const egm = this.store.selectedEgm();

    if (!egm) {
      return 0;
    }

    const currentValue = this.egmForm().value();

    return (Object.keys(egm) as Array<keyof Egm>).reduce((count, key) => {
      return count + (egm[key] !== currentValue[key] ? 1 : 0);
    }, 0);
  });
  readonly hasUnsavedChanges = computed(() => this.changedFieldCount() > 0);

  constructor() {
    effect(() => {
      const egm = this.store.selectedEgm();

      if (!egm) {
        return;
      }

      this.egmForm().reset(egm);
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

    this.egmForm().reset(currentEgm);
  }

  async saveEgm(event: Event): Promise<void> {
    event.preventDefault();

    const currentEgm = this.store.selectedEgm();
    if (!currentEgm) {
      return;
    }

    this.isSaving.set(true);

    try {
      await runWithDemoSaveDelay(async () => {
        const updatedEgm: Egm = this.egmForm().value();

        this.store.updateEgm(updatedEgm);
        this.egmForm().reset(updatedEgm);
      });
    } finally {
      this.isSaving.set(false);
    }
  }

  private createEmptyEgm(): Egm {
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
}