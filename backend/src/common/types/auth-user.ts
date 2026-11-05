export type UserRole = 'LANDLORD' | 'TENANT' | 'ADMIN';

export interface AuthUser {
  id: number;
  role: UserRole;
}

