import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { Egm } from '@egms/egm.model';

@Injectable({ providedIn: 'root' })
export class EgmsService {
  private http = inject(HttpClient);
  private readonly sessionEgms = signal<Egm[] | null>(null);

  getEgms(): Observable<Egm[]> {
    const cachedEgms = this.sessionEgms();

    if (cachedEgms) {
      return of(cachedEgms);
    }

    return this.http.get<Egm[]>('/assets/egms.json').pipe(
      tap((egms) => this.sessionEgms.set(egms))
    );
  }

  updateEgm(egm: Egm): Observable<Egm[]> {
    return this.updateSessionEgms((currentEgms) => currentEgms.map((candidate) => candidate.id === egm.id ? egm : candidate));
  }

  deleteEgm(id: number): Observable<Egm[]> {
    return this.updateSessionEgms((currentEgms) => currentEgms.filter((candidate) => candidate.id !== id));
  }

  private updateSessionEgms(transform: (egms: Egm[]) => Egm[]): Observable<Egm[]> {
    return this.getEgms().pipe(
      map((egms) => transform(egms)),
      tap((egms) => this.sessionEgms.set(egms))
    );
  }
}