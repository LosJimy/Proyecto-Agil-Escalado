export interface UserDB {
  id: string;
  email: string;
  password_hash: string | null;
  is_active: boolean;
}

export interface RefreshTokenDB {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked: boolean;
}

export interface OtpCodeDB {
  id: string;
  user_id: string;
  code: string;
  expires_at: Date;
  used: boolean;
}

export interface JwtKeyDB {
  id: string;
  kid: string;
  private_key: string;
  public_key: string;
  is_active: boolean;
  created_at: Date;
}
