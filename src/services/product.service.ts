import { API_BASE_URL } from "../config/api";
import { getAuthTokens } from "./auth.storage";
import type { ProductPage } from "../types/product";

const PRODUCT_URL = `${API_BASE_URL}/api/v1/products`;

export async function getProducts(
  page = 0,
  size = 20,
  search = "",
): Promise<ProductPage> {
  const tokens = await getAuthTokens();

  if (!tokens) {
    throw new Error("Authentication required");
  }

  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  if (search.trim()) {
    params.append("search", search.trim());
  }

  const response = await fetch(`${PRODUCT_URL}?${params.toString()}`, {
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
    throw new Error("Failed to fetch products");
  }

  return response.json() as Promise<ProductPage>;
}
