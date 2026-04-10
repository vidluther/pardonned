import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import {
  computeStats,
  filterByAdministration,
} from "../../../lib/pardon-stats";
import { getAdministrationIndex } from "../../../lib/president-names";
import { renderOgImage } from "../../../lib/og-image";

export const prerender = true;

export const getStaticPaths: GetStaticPaths = async () => {
  const allGrants = await getCollection("pardonDetails");
  const index = getAdministrationIndex(allGrants);
  return Array.from(index.values()).map((admin) => ({
    params: { slug: admin.slug },
    props: { admin },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { admin } = props;
  const allGrants = await getCollection("pardonDetails");
  const filtered = filterByAdministration(allGrants, admin.slug);
  const stats = computeStats(filtered);

  const png = await renderOgImage({
    title: `Pardons granted by ${admin.displayName}`,
    subtitle: "More Money, More Pardons",
    stat: `${stats.totalGrants}`,
    statLabel: "Clemency Grants",
  });

  return new Response(png as unknown as BodyInit, {
    headers: { "Content-Type": "image/png" },
  });
};
