import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { computeStats } from "../../lib/pardon-stats";
import { getAdministrationIndex } from "../../lib/president-names";
import { renderOgImage } from "../../lib/og-image";
import { formatCompactMoney } from "../../lib/format";

export const prerender = true;

const MODERN_ERA_START = "1993-01-01";

export const GET: APIRoute = async () => {
  const allGrants = await getCollection("pardonDetails");
  const modernEraGrants = allGrants.filter(
    (e) => e.data.term_start_date >= MODERN_ERA_START,
  );
  const stats = computeStats(modernEraGrants);
  const adminIndex = getAdministrationIndex(modernEraGrants);

  const png = await renderOgImage({
    title: "All presidents.",
    subtitle: "Cross-administration clemency comparison since 1993.",
    stat: formatCompactMoney(stats.totalRestitutionAbandoned),
    statLabel: `${adminIndex.size} terms · ${stats.totalGrants.toLocaleString()} grants`,
    accent: true,
  });

  return new Response(png as unknown as BodyInit, {
    headers: { "Content-Type": "image/png" },
  });
};
