import Link from "next/link";
import { siteConfig } from "@/lib/site";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col relative">
      {/* Auth Nav */}
      <div className="absolute top-0 right-0 p-6 flex gap-4 z-10">
        {siteConfig.navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              link.label === "Sign up"
                ? "bg-court-600 hover:bg-court-500 text-white font-medium px-5 py-2 rounded-lg transition"
                : "text-slate-300 hover:text-white font-medium px-4 py-2"
            }
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-4xl w-full text-center space-y-8">
          <h1 className="font-display text-5xl md:text-7xl font-bold text-white drop-shadow-lg tracking-tight">
            {siteConfig.name}
          </h1>
          <h2 className="font-display text-2xl md:text-4xl font-semibold text-court-400 max-w-2xl mx-auto leading-relaxed">
            {siteConfig.tagline}
          </h2>
          <p className="text-xl text-slate-300">{siteConfig.summary}</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link
            href={siteConfig.primaryCta.href}
            className="px-8 py-4 rounded-xl bg-court-500 hover:bg-court-600 text-white font-display font-semibold text-lg shadow-lg hover:shadow-court-500/30 transition"
          >
            {siteConfig.primaryCta.label}
          </Link>
          <Link
            href={siteConfig.secondaryCta.href}
            className="px-8 py-4 rounded-xl border-2 border-slate-500 hover:border-court-400 text-slate-300 hover:text-white font-display font-semibold text-lg transition"
          >
            {siteConfig.secondaryCta.label}
          </Link>
        </div>

        <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {siteConfig.features.map((feature) => (
            <div key={feature.title} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
        </div>
      </div>
    </main>
  );
}
