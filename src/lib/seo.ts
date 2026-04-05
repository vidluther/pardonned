import { siteConfig } from "../config/site";

export interface SeoOptions {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

function buildUrl(path: string, siteUrl: string): string {
  return `${siteUrl}${path}`;
}

export function generateMetaTags(
  options: SeoOptions,
  url?: URL,
): Record<string, string> {
  const {
    title,
    description,
    canonicalUrl,
    ogImage = siteConfig.defaultOgImage,
    ogType = "website",
    publishedTime,
    modifiedTime,
  } = options;

  const siteUrl = siteConfig.siteUrl;
  const pageUrl = canonicalUrl || (url ? url.toString() : siteUrl);
  const imageUrl = ogImage.startsWith("http")
    ? ogImage
    : buildUrl(ogImage, siteUrl);

  const tags: Record<string, string> = {
    "og:title": title,
    "og:description": description,
    "og:url": pageUrl,
    "og:type": ogType,
    "og:image": imageUrl,
    "og:locale": siteConfig.locale,
    "og:site_name": siteConfig.name,
    "twitter:card": "summary_large_image",
    "twitter:title": title,
    "twitter:description": description,
    "twitter:image": imageUrl,
  };

  if (siteConfig.twitterHandle) {
    tags["twitter:site"] = siteConfig.twitterHandle;
    tags["twitter:creator"] = siteConfig.twitterHandle;
  }

  if (publishedTime) {
    tags["article:published_time"] = publishedTime;
  }
  if (modifiedTime) {
    tags["article:modified_time"] = modifiedTime;
  }

  return tags;
}

export function generateJsonLd(options: SeoOptions, url?: URL): string {
  const siteUrl = siteConfig.siteUrl;
  const pageUrl = options.canonicalUrl || (url ? url.toString() : siteUrl);

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const webpageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: options.title,
    description: options.description,
    url: pageUrl,
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteUrl,
  };

  return JSON.stringify([websiteSchema, webpageSchema, organizationSchema]);
}
