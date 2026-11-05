import { API_BASE_URL } from "../config/api";
import { getAuthTokens } from "./auth.storage";

import type { Category } from "../types/category";

const CATEGORY_URL = `${API_BASE_URL}/api/v1/categories`;

export interface CreateCategoryRequest {
  name: string;
  icon: string;
}

export interface UpdateCategoryRequest {
  name: string;
  icon: string;
}

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

export interface CreateCategoryRequest {
  name: string;
  icon: string;
}

export async function createCategory(
  data: CreateCategoryRequest,
): Promise<Category> {
  const tokens = await getAuthTokens();

  if (!tokens?.accessToken) {
    throw new Error("Unauthorized");
  }

  const response = await fetch(CATEGORY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (response.status === 409) {
    throw new Error("Category already exists");
  }

  if (!response.ok) {
    throw new Error(`Failed to create category: ${response.status}`);
  }

  return (await response.json()) as Category;
}

export async function deleteCategory(categoryId: number): Promise<void> {
  const tokens = await getAuthTokens();

  if (!tokens?.accessToken) {
    throw new Error("Unauthorized");
  }

  const response = await fetch(`${CATEGORY_URL}/${categoryId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      Accept: "*/*",
    },
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (response.status === 404) {
    throw new Error("Category not found");
  }

  if (!response.ok) {
    throw new Error(`Failed to delete category: ${response.status}`);
  }
}

export async function updateCategory(
  categoryId: number,
  data: UpdateCategoryRequest,
): Promise<void> {
  const tokens = await getAuthTokens();

  if (!tokens?.accessToken) {
    throw new Error("Unauthorized");
  }

  const response = await fetch(`${CATEGORY_URL}/${categoryId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    body: JSON.stringify(data),
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (response.status === 404) {
    throw new Error("Category not found");
  }

  if (response.status === 409) {
    throw new Error("Category already exists");
  }

  if (!response.ok) {
    throw new Error(`Failed to update category: ${response.status}`);
  }
}
