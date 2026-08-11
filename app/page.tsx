import Link from "next/link";
import { siteConfig } from "@/lib/site";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Auth Nav */}
      <div className="absolute top-0 right-0 left-0 p-4 sm:p-6 flex justify-end gap-3 sm:gap-4 z-10">
        {siteConfig.navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              link.label === "Sign up"
                ? "bg-court-600 hover:bg-court-500 text-white font-medium px-4 sm:px-5 py-2 rounded-full transition"
                : "text-slate-300 hover:text-white font-medium px-3 sm:px-4 py-2 rounded-full transition"
            }
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-24 sm:py-28">
        <div className="max-w-4xl w-full text-center space-y-6 sm:space-y-8">
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold text-white drop-shadow-lg tracking-tight">
            {siteConfig.name}
          </h1>
          <h2 className="font-display text-xl sm:text-2xl md:text-4xl font-semibold text-court-400 max-w-2xl mx-auto leading-relaxed">
            {siteConfig.tagline}
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto">{siteConfig.summary}</p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-6 sm:pt-8 max-w-xl mx-auto">
          <Link
            href={siteConfig.primaryCta.href}
            className="px-6 sm:px-8 py-3.5 rounded-full bg-court-500 hover:bg-court-600 text-white font-display font-semibold text-base sm:text-lg shadow-lg hover:shadow-court-500/30 transition text-center"
          >
            {siteConfig.primaryCta.label}
          </Link>
          <Link
            href={siteConfig.secondaryCta.href}
            className="px-6 sm:px-8 py-3.5 rounded-full border-2 border-slate-500 hover:border-court-400 text-slate-300 hover:text-white font-display font-semibold text-base sm:text-lg transition text-center"
          >
            {siteConfig.secondaryCta.label}
          </Link>
        </div>
        </div>
      </div>
    </main>
  );
}
