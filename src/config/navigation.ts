// Navigation configuration - Edit this file to change menu items
export interface NavItem {
  label: string;
  href: string;
}

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
