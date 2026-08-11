export const siteConfig = {
  name: "ShuttleScore Pro",
  title: "Lakshmi Hegde PG Badminton Tournament | Season 2",
  description: "Live scores, brackets & match updates",
  tagline: "Simple badminton tournament scoring for phones, tablets, and desktops.",
  summary: "Create tournaments, follow matches, and keep scores live.",
  primaryCta: {
    label: "Go to Dashboard",
    href: "/dashboard",
  },
  secondaryCta: {
    label: "Find a Tournament",
    href: "/t",
  },
  navLinks: [
    { label: "Log in", href: "/login" },
    { label: "Sign up", href: "/register" },
  ],
} as const;

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}