export interface Site {
  id: number;
  name: string;
  address: string;
  email: string;
  siteGroup: string;
}

export interface SitesState {
  sites: Site[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  modifiedSiteIds: Set<number>;
}