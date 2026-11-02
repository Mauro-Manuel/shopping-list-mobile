export type Product = {
  id: number;
  name: string;
  active: boolean;
  category: {
    id: number;
    name: string;
    icon: string | null;
  };
};

export type ProductPage = {
  content: Product[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
};
