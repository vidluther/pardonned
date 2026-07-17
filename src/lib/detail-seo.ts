import { formatGrantDateLong } from "./format";
import { truncateText } from "./seo";
import { siteConfig } from "../config/site";

/** SERP snippet budget — Google truncates descriptions around this length. */
const MAX_DESCRIPTION_LENGTH = 155;

/**
 * SERP-presentation policy for pardon detail pages.
 *
 * All search-facing strings (title, meta description) are built here so
 * templates never assemble them ad hoc. Exported input type follows the
 * narrow-structural convention of `AdministrationIndexInput`: pass either a
 * real collection entry's `data` or an inline fixture with just these fields.
 */

export interface DetailSeoInput {
  slug: string;
  recipient_name: string;
  clemency_type: string;
  grant_date: string;
  president_name: string;
  offense?: string | null;
  district?: string | null;
  original_sentence?: string | null;
}

export interface DetailSeo {
  title: string;
  metaDescription: string;
  /** Serialized Article JSON-LD for a <script type="application/ld+json"> block. */
  jsonLd: string;
}

/**
 * Conversational short names where stripping the middle initial is wrong
 * (nicknames) or ambiguous (the two Bushes). Everyone else gets the single
 * middle initial dropped, e.g. "Barack H. Obama" → "Barack Obama".
 */
const PRESIDENT_SHORT_NAMES: Record<string, string> = {
  "Joseph R. Biden": "Joe Biden",
  "William J. Clinton": "Bill Clinton",
  "George W. Bush": "George W. Bush",
  "George H.W. Bush": "George H.W. Bush",
};

function shortPresidentName(name: string): string {
  return PRESIDENT_SHORT_NAMES[name] ?? name.replace(/ [A-Z]\. /, " ");
}

const CLEMENCY_LABELS: Record<string, string> = {
  pardon: "Pardon",
  commutation: "Commutation",
};

function clemencyLabel(type: string): string {
  return CLEMENCY_LABELS[type] ?? type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * DOJ HTML uses &nbsp; inside some recipient names (repo gotcha). SERP-facing
 * strings must show regular spaces; slug/override lookups elsewhere must NOT
 * use this (they are byte-exact).
 */
function normalizeSpaces(s: string): string {
  return s.replace(/\u00A0/g, " ");
}

export function buildDetailSeo(input: DetailSeoInput): DetailSeo {
  const name = normalizeSpaces(input.recipient_name);
  const president = shortPresidentName(input.president_name);
  const year = input.grant_date.slice(0, 4);
  const label = clemencyLabel(input.clemency_type);
  const title = `${name} — ${label} by ${president} (${year})`;

  const sentences = [
    `${label} granted to ${name} by ${president} on ${formatGrantDateLong(input.grant_date)}.`,
  ];
  if (input.offense) {
    const where = input.district ? ` in the ${normalizeSpaces(input.district)}` : "";
    sentences.push(`Convicted of ${normalizeSpaces(input.offense)}${where}.`);
  }
  if (input.original_sentence) {
    const sentence = normalizeSpaces(input.original_sentence).replace(/\.$/, "");
    sentences.push(`Original sentence: ${sentence}.`);
  }
  const metaDescription = truncateText(sentences.join(" "), MAX_DESCRIPTION_LENGTH);

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: metaDescription,
    datePublished: input.grant_date,
    about: { "@type": "Person", name },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.siteUrl,
    },
    mainEntityOfPage: `${siteConfig.siteUrl}/pardon/details/${input.slug}/`,
  });

  return { title, metaDescription, jsonLd };
}
