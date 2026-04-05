// Category configuration
export type CategoryKey =
  | "fraud"
  | "firearms"
  | "drug offense"
  | "FACE act"
  | "financial crime"
  | "violent crime"
  | "other";

export interface CategoryConfig {
  key: CategoryKey;
  name: string;
  color: string;
}

export const categoryColors: Record<CategoryKey, string> = {
  fraud: "#8A6B1E",
  "drug offense": "#3A6A4A",
  firearms: "#C23B22",
  "FACE act": "#B8652A",
  "financial crime": "#2A6A7A",
  "violent crime": "#6A4B7A",
  other: "#7A7870",
};

export const categories: CategoryConfig[] = [
  { key: "fraud", name: "Fraud", color: categoryColors.fraud },
  {
    key: "drug offense",
    name: "Drug Offenses",
    color: categoryColors["drug offense"],
  },
  { key: "firearms", name: "Firearms", color: categoryColors.firearms },
  { key: "FACE act", name: "FACE Act", color: categoryColors["FACE act"] },
  {
    key: "financial crime",
    name: "Financial Crime",
    color: categoryColors["financial crime"],
  },
  {
    key: "violent crime",
    name: "Violent Crime",
    color: categoryColors["violent crime"],
  },
  { key: "other", name: "Other", color: categoryColors.other },
];

// Helper to get category by key
export function getCategory(key: CategoryKey): CategoryConfig | undefined {
  return categories.find((c) => c.key === key);
}
