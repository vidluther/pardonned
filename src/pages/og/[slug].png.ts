import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { slugify } from "../../lib/slugify";
import { renderOgImage, type OgImageData } from "../../lib/og-image";

export const prerender = true;

export const getStaticPaths: GetStaticPaths = async () => {
  const allGrants = await getCollection("pardonDetails");

  return allGrants.map((grant) => {
    const d = grant.data;
    const hasRestitution = d.restitution != null && d.restitution > 0;

    let stat: string | undefined;
    let statLabel: string | undefined;
    let accent = false;

    if (hasRestitution) {
      stat = formatCurrency(d.restitution!);
      statLabel = "Restitution abandoned";
      accent = true;
    } else if (d.sentence_in_months && d.sentence_in_months > 0) {
      stat = formatSentence(d.sentence_in_months);
      statLabel = d.clemency_type === "commutation" ? "Sentence commuted" : "Prison sentence";
    }

    const clemencyLabel = d.clemency_type === "pardon" ? "Pardon" : "Commutation";
    const dateShort = formatDateShort(d.grant_date);

    return {
      params: { slug: slugify(d.recipient_name) },
      props: {
        title: d.recipient_name,
        subtitle: `${clemencyLabel} · ${dateShort}`,
        stat,
        statLabel,
        accent,
      },
    };
  });
};

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatSentence(months: number): string {
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} year${years > 1 ? "s" : ""}`;
  return `${years}y ${rem}m`;
}

function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgImage(props as OgImageData);

  return new Response(png as unknown as BodyInit, {
    headers: { "Content-Type": "image/png" },
  });
};
