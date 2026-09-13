export interface LoginRequest {
  name: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email?: string | null;
  };
}

export interface CreateUserRequest {
  name: string;
  password: string;
  email?: string;
}
