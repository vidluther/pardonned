// Category configuration
export type CategoryKey =
  | "j6"
  | "face"
  | "fraud"
  | "crypto"
  | "political"
  | "drug"
  | "other";

export interface CategoryConfig {
  key: CategoryKey;
  name: string;
  color: string;
}

export const categoryColors: Record<CategoryKey, string> = {
  j6: "#C23B22",
  face: "#B8652A",
  fraud: "#8A6B1E",
  crypto: "#2A6A7A",
  political: "#6A4B7A",
  drug: "#3A6A4A",
  other: "#7A7870",
};

export const categories: CategoryConfig[] = [
  { key: "j6", name: "January 6", color: categoryColors.j6 },
  { key: "face", name: "FACE Act", color: categoryColors.face },
  { key: "fraud", name: "Financial Fraud", color: categoryColors.fraud },
  { key: "crypto", name: "Crypto & Securities", color: categoryColors.crypto },
  {
    key: "political",
    name: "Political Corruption",
    color: categoryColors.political,
  },
  { key: "drug", name: "Drug Offenses", color: categoryColors.drug },
  { key: "other", name: "Other", color: categoryColors.other },
];

// Helper to get category by key
export function getCategory(key: CategoryKey): CategoryConfig | undefined {
  return categories.find((c) => c.key === key);
}
