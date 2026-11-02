import { API_BASE_URL } from "../config/api";
import { getAuthTokens } from "./auth.storage";

import type { Category } from "../types/category";

const CATEGORY_URL = `${API_BASE_URL}/api/v1/categories`;

export async function getCategories(): Promise<Category[]> {
  const tokens = await getAuthTokens();

  if (!tokens) {
    throw new Error("Authentication required");
  }

  const response = await fetch(CATEGORY_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      Accept: "application/json",
    },
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  return response.json();
}
