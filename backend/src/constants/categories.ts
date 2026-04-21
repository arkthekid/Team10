export const CATEGORIES = [
  "electronics",
  "textbooks",
  "furniture",
  "clothing",
  "appliances",
  "other",
] as const;

export type Category = typeof CATEGORIES[number];