import { apiFetch } from "./api";
import { LoginRequest, LoginResponse, CreateUserRequest } from "../types/auth";

const API_URL = import.meta.env.VITE_API_URL;

export async function login(
  payload: LoginRequest
): Promise<LoginResponse> {
  const response = await fetch(
    `${API_URL}/v1/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    throw new Error("Login fehlgeschlagen");
  }

  return response.json();
}

/**
 * Creates a new household member from inside the app (dashboard). The
 * backend's /auth/register endpoint logs the newly created user in and
 * returns an access token for *that* user - callers must not store it as
 * the current session's token, or they'd silently switch accounts.
 */
export async function registerUser(
  payload: CreateUserRequest
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateMe(
  payload: { email?: string; currentPassword?: string; newPassword?: string }
): Promise<{ id: string; name: string; email?: string | null }> {
  return apiFetch("/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}