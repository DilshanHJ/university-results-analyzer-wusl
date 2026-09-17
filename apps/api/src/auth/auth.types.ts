export const ROLES_KEY = 'roles';
export const IS_PUBLIC_KEY = 'isPublic';
export const REFRESH_COOKIE = 'results_refresh';

export type Role = 'ADMIN' | 'LECTURER' | 'STUDENT';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  indexNumber: string | null;
}

export interface JwtPayload {
  sub: string;
  role: Role;
  type: 'access' | 'refresh';
}
