export interface User {
  id: string;
  name: string;
  displayName: string;
  email: string;
  phone: string;
  employeeName: string;
  employeeNumber: string;
  permissions: string[];
  groupId: string;
}

export interface Group {
  id: number;
  name: string;
  address: string;
  email: string;
}

export interface GroupManagerState {
  groups: Group[];
  selectedGroupId: number | null;
  selectedUserIds: string[]; // Changed from number to string (user IDs are strings)
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  modifiedGroupIds: Set<number>;
}