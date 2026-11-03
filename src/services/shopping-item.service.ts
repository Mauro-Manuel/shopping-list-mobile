import { API_BASE_URL } from "../config/api";
import { getAuthTokens } from "./auth.storage";

export type AddShoppingItemRequest = {
  productId?: number;
  product?: {
    name: string;
    categoryId: number;
  };
  quantity: number;
  unit: string;
};

export class ShoppingItemConflictError extends Error {
  constructor() {
    super("Este produto já existe na lista de compras.");
    this.name = "ShoppingItemConflictError";
  }
}

export async function addShoppingItem(
  listId: number,
  request: AddShoppingItemRequest,
): Promise<void> {
  const tokens = await getAuthTokens();

  if (!tokens) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/shopping-lists/${listId}/items`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(request),
    },
  );

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (response.status === 409) {
    throw new ShoppingItemConflictError();
  }

  if (response.status === 400 || response.status === 422) {
    throw new Error("Invalid shopping item data");
  }

  if (!response.ok) {
    console.error("Failed to add shopping item:", {
      status: response.status,
      statusText: response.statusText,
    });

    throw new Error("Failed to add shopping item");
  }
}

export async function checkShoppingItem(
  listId: number,
  itemId: number,
): Promise<void> {
  const tokens = await getAuthTokens();

  if (!tokens) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/shopping-lists/${listId}/items/${itemId}/check`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        Accept: "application/json",
      },
    },
  );

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (response.status === 404) {
    throw new Error("Shopping item not found");
  }

  if (response.status === 409) {
    throw new Error("Shopping item conflict");
  }

  if (!response.ok) {
    throw new Error(
      `Failed to check shopping item: ${response.status}`,
    );
  }
}


export async function uncheckShoppingItem(
  listId: number,
  itemId: number,
): Promise<void> {
  const tokens = await getAuthTokens();

  if (!tokens) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/shopping-lists/${listId}/items/${itemId}/uncheck`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        Accept: "application/json",
      },
    },
  );

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (response.status === 404) {
    throw new Error("Shopping item not found");
  }

  if (!response.ok) {
    throw new Error(
      `Failed to uncheck shopping item: ${response.status}`,
    );
  }
}