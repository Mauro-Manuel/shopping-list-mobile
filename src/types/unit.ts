export const UNITS = [
  { label: "Unidade", value: "UNIT" },
  { label: "Quilograma (kg)", value: "KG" },
  { label: "Grama (g)", value: "G" },
  { label: "Litro (L)", value: "L" },
  { label: "Mililitro (ml)", value: "ML" },
  { label: "Pacote", value: "PACKAGE" },
  { label: "Caixa", value: "BOX" },
] as const;

export type Unit = (typeof UNITS)[number]["value"];
