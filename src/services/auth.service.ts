import { API_BASE_URL } from "../config/api";

type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (response.status === 401) {
    throw new Error("Invalid email or password");
  }

  if (response.status === 429) {
    throw new Error("Too many login attempts. Please try again later.");
  }

  if (!response.ok) {
    throw new Error("Authentication failed");
  }

  return response.json();
}

export async function refreshToken(
  refreshTokenValue: string,
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refreshToken: refreshTokenValue,
    }),
  });

  if (response.status === 401) {
    throw new Error("Invalid or expired refresh token");
  }

  if (!response.ok) {
    throw new Error("Token refresh failed");
  }

  return response.json();
}
