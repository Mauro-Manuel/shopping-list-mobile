import { API_BASE_URL } from "../config/api";
import { authFetch } from "./auth.client";
import type { Unit } from "../types/unit";

export type AddShoppingItemRequest = {
  productId?: number;
  product?: {
    name: string;
    categoryId: number;
  };
  quantity: number;
  unit: Unit;
};

export type UpdateShoppingItemRequest = {
  quantity: number;
  unit: Unit;
};

export class ShoppingItemConflictError extends Error {
  constructor() {
    super("Este produto já existe na lista de compras.");
    this.name = "ShoppingItemConflictError";
  }
}

const SHOPPING_LIST_URL = `${API_BASE_URL}/api/v1/shopping-lists`;

function shoppingItemUrl(listId: number, itemId: number): string {
  return `${SHOPPING_LIST_URL}/${listId}/items/${itemId}`;
}

export async function addShoppingItem(
  listId: number,
  request: AddShoppingItemRequest,
): Promise<void> {
  const response = await authFetch(`${SHOPPING_LIST_URL}/${listId}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(request),
  });

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
  const response = await authFetch(`${shoppingItemUrl(listId, itemId)}/check`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
    },
  });

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
    throw new Error(`Failed to check shopping item: ${response.status}`);
  }
}

export async function uncheckShoppingItem(
  listId: number,
  itemId: number,
): Promise<void> {
  const response = await authFetch(
    `${shoppingItemUrl(listId, itemId)}/uncheck`,
    {
      method: "PATCH",
      headers: {
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
    throw new Error(`Failed to uncheck shopping item: ${response.status}`);
  }
}

export async function updateShoppingItem(
  listId: number,
  itemId: number,
  request: UpdateShoppingItemRequest,
): Promise<void> {
  const response = await authFetch(shoppingItemUrl(listId, itemId), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(request),
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (response.status === 404) {
    throw new Error("Shopping item not found");
  }

  if (response.status === 400 || response.status === 422) {
    throw new Error("Invalid shopping item data");
  }

  if (!response.ok) {
    throw new Error(`Failed to update shopping item: ${response.status}`);
  }
}

export async function deleteShoppingItem(
  listId: number,
  itemId: number,
): Promise<void> {
  const response = await authFetch(shoppingItemUrl(listId, itemId), {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (response.status === 404) {
    throw new Error("Shopping item not found");
  }

  if (!response.ok) {
    throw new Error(`Failed to delete shopping item: ${response.status}`);
  }
}
