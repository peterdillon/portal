// iam.model.ts
export interface User {
  id: number;
  first_name: string;
  last_name: string;
}

export interface Group {
  id: number;
  name: string;
  address: string;
  email: string;
  users: User[];
}

export interface GroupManagerState {
  groups: Group[];
  allUsers: User[];
  selectedGroupId: number | null;
  selectedUserIds: number[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  modifiedGroupIds: Set<number>;
}
