const MONTHS: Record<string, string> = {
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12",
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  sept: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

/**
 * Parse a date string like "January 17, 2017" or "JUNE 3, 2016" into
 * ISO format "YYYY-MM-DD". Case-insensitive — the Obama commutations
 * page uses uppercase month names (e.g. "DECEMBER 18, 2015").
 */
export function parseDate(text: string): string | null {
  const match = text.match(/(\w+)\s+(\d{1,2}),\s+(\d{4})/);
  if (!match) return null;

  const month = MONTHS[match[1].toLowerCase()];
  if (!month) return null;

  const day = match[2].padStart(2, "0");
  return `${match[3]}-${month}-${day}`;
}
