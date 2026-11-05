import { API_BASE_URL } from "../config/api";
import { authFetch } from "./auth.client";
import type { ProductPage } from "../types/product";

const PRODUCTS_URL = `${API_BASE_URL}/api/v1/products`;

export async function getProducts(
  page = 0,
  size = 20,
  search = "",
): Promise<ProductPage> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    search: search.trim(),
  });

  const response = await authFetch(`${PRODUCTS_URL}?${params.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }

  return response.json();
}
