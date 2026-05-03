import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { siteConfig } from "../config/site";
import { buildAtomFeed } from "../lib/atom-feed";
import { getCurrentAdministration } from "../lib/president-names";

export const prerender = true;

export const GET: APIRoute = async () => {
  const allGrants = await getCollection("pardonDetails");

  // Scope: current administration only — pairs with the /recent HTML page.
  // Earlier admins live in /search.
  const currentAdmin = getCurrentAdministration(allGrants);
  const currentGrants = currentAdmin
    ? allGrants.filter(
        (e) => e.data.administration_slug === currentAdmin.slug,
      )
    : [];

  const adminLabel = currentAdmin?.displayName ?? "the current administration";

  const xml = buildAtomFeed(currentGrants, {
    siteUrl: siteConfig.siteUrl,
    feedTitle: `${siteConfig.name} — Clemency by ${adminLabel}`,
    feedSubtitle: `Federal pardons and commutations issued by ${adminLabel}, newest first.`,
    authorName: siteConfig.name,
    // Pass the full set so term-count derivation produces correct
    // "(Second Term)" suffixes even though we render Trump-2 only.
    termContextEntries: allGrants,
  });

  return new Response(xml, {
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  });
};
