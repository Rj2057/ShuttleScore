export const siteConfig = {
  name: "ShuttleScore Pro",
  title: "Lakshmi Hegde PG Badminton Tournament | Season 2",
  description: "Live scores, brackets & match updates",
  tagline: "The all-in-one tournament platform. Create, manage, and broadcast your badminton tournaments in real-time.",
  summary: "Powered by AI generation and real-time live scoring.",
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
  features: [
    {
      title: "Multi-Tenant Setup",
      description: "Host multiple tournaments under one account. Public URLs for viewers.",
    },
    {
      title: "Smart AI Builder",
      description: "Generate complex brackets and group stages with a single click using our AI integration.",
    },
    {
      title: "Referee Scoring",
      description: "Generate secure, single-match PINs for court-side referees to score games on their phones.",
    },
  ],
} as const;

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}