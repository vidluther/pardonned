import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { computeStats } from "../../lib/pardon-stats";
import { renderOgImage } from "../../lib/og-image";

export const prerender = true;

export const GET: APIRoute = async () => {
  const allGrants = await getCollection("pardonDetails");
  const stats = computeStats(allGrants);

  const png = await renderOgImage({
    title: "Tracking the Pardons granted by Donald J Trump",
    subtitle: "More Money, More Pardons ",
    stat: `${stats.totalGrants}`,
    statLabel: "Pardons Granted (not including January 6th)",
  });

  return new Response(png as unknown as BodyInit, {
    headers: { "Content-Type": "image/png" },
  });
};
