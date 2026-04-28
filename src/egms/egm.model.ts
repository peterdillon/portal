export interface Egm {
  id: number;
  fixedAssetNumber: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  inServiceDate?: string;
  warehouse: string;
  itemLocation: string;
  location: string;
  comment: string;
  styleName: string;
  assignedSiteCode: number;
  assignedSiteName: string;
}