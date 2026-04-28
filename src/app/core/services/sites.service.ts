import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { delay, map, Observable, of, tap } from 'rxjs';
import { Site } from '@site-manager/site.model';

export interface SiteGroupRecord {
  id: string;
  details: string;
  sites: string[];
  displayName: string;
  siteGroupType: string;
  siteCount: number;
  isDisabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class SitesService {
  private http = inject(HttpClient);
  private readonly baselineSites = signal<Site[] | null>(null);
  private readonly sessionSites = signal<Site[] | null>(null);
  private readonly siteGroups = signal<SiteGroupRecord[] | null>(null);

  getSites(): Observable<Site[]> {
    const cachedSites = this.sessionSites();

    if (cachedSites) {
      return of(cachedSites);
    }

    return this.http.get<Site[]>('assets/iam/group-data.json').pipe(
      tap((sites) => {
        this.baselineSites.set(sites);
        this.sessionSites.set(sites);
      })
    );
  }

  getSiteGroups(): Observable<SiteGroupRecord[]> {
    const cachedSiteGroups = this.siteGroups();

    if (cachedSiteGroups) {
      return of(cachedSiteGroups);
    }

    return this.http.get<SiteGroupRecord[]>('assets/iam/site-groups.json').pipe(
      tap((siteGroups) => this.siteGroups.set(siteGroups))
    );
  }

  addSite(site: Site): Observable<Site[]> {
    return this.updateSessionSites((sites) => [site, ...sites]);
  }

  updateSite(site: Site): Observable<Site[]> {
    return this.updateSessionSites((sites) => sites.map((candidate) => candidate.id === site.id ? site : candidate));
  }

  removeSite(siteId: number): Observable<Site[]> {
    return this.updateSessionSites((sites) => sites.filter((site) => site.id !== siteId));
  }

  saveChanges(): Observable<Site[]> {
    return this.getSites().pipe(
      delay(300),
      tap((sites) => this.baselineSites.set(sites))
    );
  }

  discardChanges(): Observable<Site[]> {
    return this.getSites().pipe(
      map(() => this.baselineSites() ?? []),
      tap((sites) => this.sessionSites.set(sites))
    );
  }

  private updateSessionSites(transform: (sites: Site[]) => Site[]): Observable<Site[]> {
    return this.getSites().pipe(
      map((sites) => transform(sites)),
      tap((sites) => this.sessionSites.set(sites))
    );
  }
}