import { API_BASE_URL } from "../config/api";
import { authFetch } from "./auth.client";
import type { UserProfile } from "../types/user";

const USER_PROFILE_URL = `${API_BASE_URL}/api/v1/users/me`;

export async function getMyProfile(): Promise<UserProfile> {
  const response = await authFetch(USER_PROFILE_URL, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.status}`);
  }

  return response.json();
}
