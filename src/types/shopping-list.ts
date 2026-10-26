export type ShoppingListStatus = "ACTIVE" | "COMPLETED";

export type ShoppingListSummary = {
  id: number;
  name: string;
  status: ShoppingListStatus;
  totalItems: number;
  checkedItems: number;
  pendingItems: number;
  progress: number;
  createdAt: string;
};

export type ShoppingListPage = {
  content: ShoppingListSummary[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
};

export type ShoppingListItem = {
  id: number;
  product: {
    id: number;
    name: string;
  };
  category: {
    id: number;
    name: string;
    icon: string;
  };
  quantity: number;
  unit: string;
  checked: boolean;
};

export type ShoppingListDetails = ShoppingListSummary & {
  completedAt: string | null;
  items: ShoppingListItem[];
};
