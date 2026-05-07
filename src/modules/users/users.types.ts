export interface UserDB {
  id: string;
  email: string;
  password_hash: string | null;
  is_active: boolean;
}
