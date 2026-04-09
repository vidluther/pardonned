import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { renderOgImage } from "../../lib/og-image";

export const prerender = true;

export const GET: APIRoute = async () => {
  const allGrants = await getCollection("pardonDetails");

  const png = await renderOgImage({
    title: "Search Clemency Grants",
    subtitle: `${allGrants.length} grants searchable by name, type, and category`,
  });

  return new Response(png as unknown as BodyInit, {
    headers: { "Content-Type": "image/png" },
  });
};
