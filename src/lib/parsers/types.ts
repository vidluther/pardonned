const DOJ_BASE = "https://www.justice.gov";

export function resolveUrl(href: string | null | undefined): string | null {
  if (!href) return null;
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }
  if (href.startsWith("/")) {
    return `${DOJ_BASE}${href}`;
  }
  return href;
}

export type OffenseCategory =
  | "violent crime"
  | "fraud"
  | "drug offense"
  | "FACE act"
  | "immigration"
  | "firearms"
  | "financial crime"
  | "other";

export interface ParsedGrant {
  recipient_name: string;
  warrant_url: string | null;
  district: string | null;
  sentence: string | null;
  offense: string;
  offense_category: OffenseCategory;
  pardon_type: "pardon" | "commutation";
  grant_date: string;
  source_url: string;
}

export type PageFormat = "trump2025" | "table-five" | "table-four" | "key-value";

export interface PresidentSource {
  slugs: string[];
  combined?: string;
  pardons?: string;
  commutations?: string;
}

export interface ParsedSentence {
  sentence_in_months: number | null;
  fine: number | null;
  restitution: number | null;
  original_sentence: string | null;
}
