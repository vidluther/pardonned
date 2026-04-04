// Navigation configuration - Edit this file to change menu items
export interface NavItem {
  label: string;
  href: string;
}

export const siteConfig = {
  name: "Pardonned",
  tagline: "Clemency tracker",
  description:
    "A public-interest data site tracking presidential clemency grants.",
  dataSource: "DOJ Office of the Pardon Attorney",
  disclaimer: "Not affiliated with the U.S. government",
};

export const mainNavigation: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Search", href: "/search" },
];

// Helper to check if a nav item is active
export function isActiveNavItem(href: string, currentPath: string): boolean {
  if (href === "/") {
    return currentPath === "/";
  }
  return currentPath.startsWith(href);
}
