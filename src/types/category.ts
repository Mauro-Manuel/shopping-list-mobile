export type CategoryType = "DEFAULT" | "CUSTOM";

export type Category = {
  id: number;
  name: string;
  icon: string | null;
  type: CategoryType;
};