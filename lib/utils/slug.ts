export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function uniqueSlug(base: string, suffix?: string): string {
  const slug = slugify(base);
  if (!slug) return `tournament-${Date.now()}`;
  return suffix ? `${slug}-${suffix}` : slug;
}
