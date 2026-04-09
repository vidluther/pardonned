/**
 * Sentence parser - extracts structured data from clemency grant sentences
 */

export interface ParsedSentenceComponents {
  sentence_in_months: number | null;
  fine: number | null;
  restitution: number | null;
}

/**
 * Parse a sentence string and extract structured components
 * Returns multiple parsed sentences for multi-count cases
 */
export function parseSentence(
  sentenceText: string,
): ParsedSentenceComponents[] {
  if (!sentenceText) return [];

  // Check for multi-count patterns (e.g., "1. ... 2. ...")
  const countPattern = /(?:^|[;.]\s*)(\d+)\.\s+/g;
  const matches: Array<{ index: number; length: number }> = [];
  let match;

  while ((match = countPattern.exec(sentenceText)) !== null) {
    matches.push({ index: match.index, length: match[0].length });
  }

  const counts: string[] = [];
  for (let i = 0; i < matches.length; i++) {
    const startIdx = matches[i].index + matches[i].length;
    const endIdx =
      i + 1 < matches.length ? matches[i + 1].index : sentenceText.length;
    counts.push(sentenceText.slice(startIdx, endIdx).trim());
  }

  // If no counts found, treat entire text as single sentence
  if (counts.length === 0) {
    counts.push(sentenceText);
  }

  return counts.map((countText) => parseSingleSentence(countText));
}

function parseSingleSentence(text: string): ParsedSentenceComponents {
  return {
    sentence_in_months: extractImprisonmentMonths(text),
    fine: extractFine(text),
    restitution: extractRestitution(text),
  };
}

// --- Extraction helpers ---

function extractImprisonmentMonths(text: string): number | null {
  // Match patterns like "135 months' imprisonment" or "10 months imprisonment"
  const monthMatch = text.match(/(\d+)\s*months?'?.*?\s*imprisonment/i);
  if (monthMatch) {
    return parseInt(monthMatch[1], 10);
  }

  // Match patterns like "10 years' imprisonment"
  const yearMatch = text.match(/(\d+)\s*years?'?.*?\s*imprisonment/i);
  if (yearMatch) {
    return parseInt(yearMatch[1], 10) * 12;
  }

  // Handle written numbers
  const writtenMatch = text.match(
    /(one|two|three|four|five|six|seven|eight|nine|ten)\s+years?'?.*?\s*imprisonment/i,
  );
  if (writtenMatch) {
    const wordToNum: Record<string, number> = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
    };
    const years = wordToNum[writtenMatch[1].toLowerCase()];
    return years ? years * 12 : null;
  }

  return null;
}

function extractRestitution(text: string): number | null {
  // Try specific restitution pattern first
  const amount = extractDollarAmount(text, "restitution");
  if (amount !== null) return amount;

  // Try general dollar amount if "restitution" is mentioned nearby
  const restitutionContext = text.match(/\$([\d,]+\.?\d*)[^;$]*restitution/i);
  if (restitutionContext) {
    const amountStr = restitutionContext[1].replace(/,/g, "");
    const amount = parseFloat(amountStr);
    return isNaN(amount) ? null : amount;
  }

  return null;
}

function extractFine(text: string): number | null {
  const amount = extractDollarAmount(text, "fine");
  if (amount !== null) return amount;

  // Try general dollar amount if "fine" is mentioned nearby
  const fineContext = text.match(/\$([\d,]+\.?\d*)[^;$]*fine/i);
  if (fineContext) {
    const amountStr = fineContext[1].replace(/,/g, "");
    const amount = parseFloat(amountStr);
    return isNaN(amount) ? null : amount;
  }

  return null;
}

function extractDollarAmount(text: string, keyword: string): number | null {
  // Match patterns like "$36,769,153.97 restitution" or "$100,000,000 fine"
  const pattern = new RegExp(`\\$([\\d,]+\\.?\\d*)\\s*(?:${keyword})`, "i");
  const match = text.match(pattern);

  if (match) {
    const amountStr = match[1].replace(/,/g, "");
    const amount = parseFloat(amountStr);
    return isNaN(amount) ? null : amount;
  }

  return null;
}
