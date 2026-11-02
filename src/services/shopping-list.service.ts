import { API_BASE_URL } from "../config/api";
import { getAuthTokens } from "./auth.storage";

import type {
  ShoppingListPage,
  ShoppingListDetails,
  ShoppingListSummary,
} from "../types/shopping-list";

const SHOPPING_LIST_URL = `${API_BASE_URL}/api/v1/shopping-lists`;

async function getAuthorizationHeaders() {
  const tokens = await getAuthTokens();

  if (!tokens) {
    throw new Error("Authentication required");
  }

  return {
    Authorization: `Bearer ${tokens.accessToken}`,
  };
}

export async function getShoppingLists(): Promise<ShoppingListPage> {
  const headers = await getAuthorizationHeaders();

  const response = await fetch(SHOPPING_LIST_URL, {
    method: "GET",
    headers,
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch shopping lists");
  }

  return response.json();
}

export async function getShoppingListById(
  listId: number,
): Promise<ShoppingListDetails> {
  const headers = await getAuthorizationHeaders();

  const response = await fetch(`${SHOPPING_LIST_URL}/${listId}`, {
    method: "GET",
    headers,
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch shopping list");
  }

  return response.json();
}

export async function createShoppingList(
  name: string,
): Promise<ShoppingListSummary> {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Shopping list name is required");
  }

  const headers = await getAuthorizationHeaders();

  const response = await fetch(SHOPPING_LIST_URL, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: trimmedName,
    }),
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (response.status === 400 || response.status === 422) {
    throw new Error("Invalid shopping list name");
  }

  if (!response.ok) {
    throw new Error("Failed to create shopping list");
  }

  return response.json();
}


