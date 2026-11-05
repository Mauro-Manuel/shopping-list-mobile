import { API_BASE_URL } from "../config/api";
import { authFetch } from "./auth.client";
import type { Category } from "../types/category";

const CATEGORY_ENDPOINT = `${API_BASE_URL}/api/v1/categories`;

export interface CreateCategoryRequest {
  name: string;
  icon: string;
}

export interface UpdateCategoryRequest {
  name: string;
  icon: string;
}

// GET - Consultar categorias
export async function getCategories(): Promise<Category[]> {
  const response = await authFetch(CATEGORY_ENDPOINT, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`);
  }

  return response.json();
}

// POST - Criar categoria personalizada
export async function createCategory(
  data: CreateCategoryRequest,
): Promise<Category> {
  const response = await authFetch(CATEGORY_ENDPOINT, {
    method: "POST",
    headers: {
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

  return response.json();
}

// PUT - Actualizar categoria personalizada
export async function updateCategory(
  categoryId: number,
  data: UpdateCategoryRequest,
): Promise<void> {
  const response = await authFetch(`${CATEGORY_ENDPOINT}/${categoryId}`, {
    method: "PUT",
    headers: {
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

// DELETE - Eliminar categoria personalizada
export async function deleteCategory(categoryId: number): Promise<void> {
  const response = await authFetch(`${CATEGORY_ENDPOINT}/${categoryId}`, {
    method: "DELETE",
    headers: {
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
