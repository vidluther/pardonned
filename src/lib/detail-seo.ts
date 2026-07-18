import { formatCompactMoney, formatGrantDateLong } from "./format";
import { serializeJsonLd, truncateText } from "./seo";
import { siteConfig } from "../config/site";
import { cleanClause, normalizeSpaces, OFFENSE_SENTINELS, realClause } from "./pardon-clause";

/** SERP snippet budget — Google truncates descriptions around this length. */
const MAX_DESCRIPTION_LENGTH = 155;
/** Google truncates titles around 60 chars and recommends headlines ≤110. */
const MAX_TITLE_LENGTH = 110;

/**
 * SERP-presentation policy for pardon detail pages (ADR-0003, ADR-0004).
 *
 * All search-facing strings (title, meta description, Article JSON-LD) are
 * built here so templates never assemble them ad hoc. Exported input type
 * follows the narrow-structural convention of `AdministrationIndexInput`: pass
 * either a real collection entry's `data` or an inline fixture with these
 * fields.
 *
 * Pardon record fields cannot be trusted raw: preemptive pardons carry
 * "For any offenses…" legalese with no conviction; scraper sentinels leak
 * through (`district = "N/A"`, `offense = "Download PDF Clemency Warrant"`);
 * abbreviated districts end in `.`; group clemencies have 300+ char names.
 * The clause guards live in `pardon-clause.ts` (shared with the page
 * templates, so SERP strings and rendered pages can never disagree about
 * whether a conviction exists); the guards here keep the SERP strings from
 * ever stating a false conviction.
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
  restitution?: number | null;
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

// A trailing corporate designator: "… LLC", "… , Inc.", "… Limited".
const CORPORATE_SUFFIX =
  /[\s,]+(inc|incorporated|llc|l\.l\.c|ltd|limited|corp|corporation|co|company|lp|llp|plc|n\.a)\.?$/i;
// Prose that describes a group of people rather than one recipient.
const GROUP_LANGUAGE =
  /\b(members of|the staff|individuals who|persons who|those who|police officers)\b/i;
const ALIAS_MARKER = /\b(a\.?k\.?a|f\.?k\.?a|also known as|formerly known as)\b/i;

/**
 * How the recipient should be typed in Article `about`, or null to omit.
 * Corporations → Organization; group clemencies → omitted (a group of humans
 * is not one Person — CONTEXT.md, Recipient is not a first-class entity);
 * everyone else → Person. When ambiguous, omit: no claim beats a false claim.
 */
function recipientEntity(name: string): { "@type": string; name: string } | null {
  if (CORPORATE_SUFFIX.test(name)) return { "@type": "Organization", name };
  if (GROUP_LANGUAGE.test(name)) return null;
  if (looksLikeMultiplePeople(name)) return null;
  return { "@type": "Person", name };
}

/**
 * Detect a run of distinct full names joined by nothing but spaces (e.g. the
 * Biden family group). Alias lists ("… , fka …") are one person, so a comma or
 * aka/fka marker rules the name out.
 */
function looksLikeMultiplePeople(name: string): boolean {
  if (name.includes(",") || ALIAS_MARKER.test(name)) return false;
  const fullNames = name.match(/[A-Z][a-z]+(?:\s+[A-Z]\.?)*\s+[A-Z][a-z]+/g) ?? [];
  return fullNames.length >= 3;
}

export function buildDetailSeo(input: DetailSeoInput): DetailSeo {
  const name = normalizeSpaces(input.recipient_name);
  const president = shortPresidentName(input.president_name);
  const year = input.grant_date.slice(0, 4);
  const label = clemencyLabel(input.clemency_type);

  // Cap the recipient name so the whole title stays within budget — group
  // clemency names run to 300+ chars otherwise.
  const suffix = ` — ${label} by ${president} (${year})`;
  const displayName = truncateText(name, MAX_TITLE_LENGTH - suffix.length);
  const title = `${displayName}${suffix}`;

  // Clause order (ADR-0003): grant → restitution (early, so truncation can't
  // drop the site's headline data point) → conviction → original sentence.
  const sentences = [
    `${label} granted to ${name} by ${president} on ${formatGrantDateLong(input.grant_date)}.`,
  ];
  if (input.restitution && input.restitution > 0) {
    sentences.push(`${formatCompactMoney(input.restitution)} in restitution abandoned.`);
  }
  const offense = realClause(input.offense, OFFENSE_SENTINELS);
  if (offense) {
    const district = cleanClause(input.district);
    const where = district ? ` in the ${district}` : "";
    sentences.push(`Convicted of ${offense}${where}.`);
  }
  const originalSentence = realClause(input.original_sentence);
  if (originalSentence) {
    sentences.push(`Original sentence: ${originalSentence}.`);
  }
  const metaDescription = truncateText(sentences.join(" "), MAX_DESCRIPTION_LENGTH);

  const publisher = {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.siteUrl,
  };
  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: metaDescription,
    image: `${siteConfig.siteUrl}/og/${input.slug}.png`,
    author: publisher,
    publisher,
    mainEntityOfPage: `${siteConfig.siteUrl}/pardon/details/${input.slug}/`,
  };
  const about = recipientEntity(name);
  if (about) {
    article.about = about;
  }

  return { title, metaDescription, jsonLd: serializeJsonLd(article) };
}
