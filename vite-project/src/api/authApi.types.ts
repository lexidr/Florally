export interface ISignUp {
  username: string;
  email: string;
  password: string;
}

export interface ISignIn {
  email: string;
  password: string;
}

export interface IAuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  user?: {
    id: number | string;
    username: string;
    email: string;
    created_at?: string;
    updated_at?: string;
  };
}
