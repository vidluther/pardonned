import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { renderOgImage } from "../../lib/og-image";
import { getCurrentAdministration } from "../../lib/president-names";

export const prerender = true;

export const GET: APIRoute = async () => {
  const allGrants = await getCollection("pardonDetails");

  // Scope: current administration only, matching /recent.
  const currentAdmin = getCurrentAdministration(allGrants);
  const currentGrants = currentAdmin
    ? allGrants.filter((e) => e.data.administration_slug === currentAdmin.slug)
    : [];

  const adminLabel = currentAdmin?.displayName ?? "the current administration";

  const png = await renderOgImage({
    title: "Recent clemency.",
    subtitle: adminLabel,
    stat: `${currentGrants.length}`,
    statLabel:
      currentGrants.length === 1
        ? "Grant in this term"
        : "Grants in this term",
    accent: false,
  });

  return new Response(png as unknown as BodyInit, {
    headers: { "Content-Type": "image/png" },
  });
};
