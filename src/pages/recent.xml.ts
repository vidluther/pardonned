import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { siteConfig } from "../config/site";
import { buildAtomFeed } from "../lib/atom-feed";

export const prerender = true;

export const GET: APIRoute = async () => {
  const allGrants = await getCollection("pardonDetails");

  const xml = buildAtomFeed(allGrants, {
    siteUrl: siteConfig.siteUrl,
    feedTitle: `${siteConfig.name} — Recent Clemency Grants`,
    feedSubtitle: siteConfig.description,
    authorName: siteConfig.name,
  });

  return new Response(xml, {
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  });
};
