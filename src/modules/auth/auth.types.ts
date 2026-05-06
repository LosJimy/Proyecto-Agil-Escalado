export interface UserDB {
  id: string;
  email: string;
  password_hash: string;
  is_active: boolean;
}

export interface RefreshTokenDB {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked: boolean;
}
