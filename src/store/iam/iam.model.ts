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
  users: User[]; // Array of user objects in this group
}

export interface IAMState {
  groups: Group[];
  allUsers: User[]; // All available users for assignment
  selectedGroupId: number | null;
  selectedUserIds: number[]; // Users selected for bulk operations
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  modifiedGroupIds: Set<number>; // Track which groups have been modified
}
