// src/types/auth.ts

export interface User {
  _id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  avatar?: string;
}

export interface AuthResponse {
  _id: string;
  username: string;
  email: string;
  token: string;
}

export interface LoginPayload {
  username: string; // <--- QUAN TRỌNG: Phải là username
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}