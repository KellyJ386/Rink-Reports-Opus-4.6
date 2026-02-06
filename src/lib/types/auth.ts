export type UserRole =
  | "super_admin"
  | "facility_admin"
  | "manager"
  | "supervisor"
  | "staff"
  | "read_only";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  facility_id: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}
