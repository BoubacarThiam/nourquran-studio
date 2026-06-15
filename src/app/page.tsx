import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Film, Mic2, Subtitles, MonitorPlay, Zap, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Mic2,
    title: "7 récitateurs",
    desc: "Yasser Al-Dosari, Alafasy, Al-Ghamdi et plus",
    color: "gold",
  },
  {
    icon: Subtitles,
    title: "Karaoké mot-à-mot",
    desc: "Chaque mot s'illumine à la récitation",
    color: "emerald",
  },
  {
    icon: Film,
    title: "Fonds Pexels HD",
    desc: "Mosquée, désert, ciel étoilé, nature",
    color: "gold",
  },
  {
    icon: MonitorPlay,
    title: "Multi-format",
    desc: "YouTube 16:9 · Reels 9:16 · Instagram 1:1",
    color: "emerald",
  },
  {
    icon: Zap,
    title: "Export rapide",
    desc: "Rendu MP4 4K en quelques minutes",
    color: "gold",
  },
  {
    icon: Globe,
    title: "Francophone",
    desc: "Fait pour l'Afrique de l'Ouest et la diaspora",
    color: "emerald",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background: "hsl(var(--studio-bg))" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 border-b border-studio-border"
        style={{
          background: "hsl(var(--studio-panel)/0.8)",
          backdropFilter: "blur(16px) saturate(180%)",
        }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-gold/20"
            style={{ background: "linear-gradient(135deg, hsl(var(--gold)) 0%, hsl(var(--gold)/0.6) 100%)" }}>
            ☽
          </div>
          <span className="font-bold text-base tracking-tight">
            Nour<span style={{ color: "hsl(var(--gold))" }}>Quran</span>
            <span className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border align-middle"
              style={{
                color: "hsl(var(--gold))",
                borderColor: "hsl(var(--gold)/0.3)",
                background: "hsl(var(--gold)/0.1)",
              }}>
              Studio
            </span>
          </span>
        </div>
        <nav className="flex items-center gap-3">
          <span className="hidden sm:block text-xs text-muted-foreground/60 px-2 py-1 rounded-full border border-studio-border">
            Bêta publique
          </span>
          <Link href="/studio">
            <Button variant="gold" size="sm" className="gap-1.5 shadow-lg shadow-gold/20">
              <Play className="w-3.5 h-3.5" />
              Ouvrir le Studio
            </Button>
          </Link>
        </nav>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-24 gap-8 overflow-hidden">

        {/* Radial glow de fond */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(var(--gold)/0.07) 0%, transparent 70%)",
          }} />
        {/* Grille subtile */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />

        {/* Badge catégorie */}
        <div className="relative flex items-center gap-2 text-sm px-4 py-1.5 rounded-full border"
          style={{
            color: "hsl(var(--gold))",
            borderColor: "hsl(var(--gold)/0.25)",
            background: "hsl(var(--gold)/0.08)",
          }}>
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          Créateur de vidéos coraniques professionnelles
        </div>

        {/* Titre */}
        <h1 className="relative text-5xl md:text-7xl font-bold max-w-4xl leading-[1.08] tracking-tight">
          Vos récitations,{" "}
          <span style={{
            background: "linear-gradient(135deg, hsl(var(--gold)) 20%, hsl(43 100% 80%) 80%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            en vidéo
          </span>
        </h1>

        {/* Sous-titre */}
        <p className="relative text-muted-foreground text-lg max-w-xl leading-relaxed">
          Synchronisation karaoké mot-à-mot · Fonds Pexels HD · Export 4K.
          <br />
          <span className="text-base">Prêt pour YouTube, Reels et TikTok en moins de 2 minutes.</span>
        </p>

        {/* CTAs */}
        <div className="relative flex flex-wrap items-center justify-center gap-4">
          <Link href="/studio">
            <Button variant="gold" size="lg"
              className="text-base px-8 gap-2 shadow-xl shadow-gold/20 hover:shadow-gold/40 transition-shadow duration-300">
              <Play className="w-5 h-5" />
              Créer gratuitement
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="text-base px-8 border-studio-border hover:border-gold/30 text-muted-foreground hover:text-foreground cursor-pointer">
            Voir des exemples
          </Button>
        </div>

        {/* Texte arabe décoratif */}
        <div className="relative mt-8 font-arabic text-4xl md:text-6xl leading-none select-none pointer-events-none"
          style={{ color: "hsl(var(--gold)/0.12)", letterSpacing: "0.05em" }}>
          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section className="px-6 pb-20 max-w-5xl mx-auto w-full">
        <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-8">
          Tout ce qu&apos;il vous faut
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className={cn(
                "flex flex-col gap-3 p-5 rounded-2xl border border-studio-border bg-studio-panel transition-all duration-300 hover:scale-[1.02] group",
                color === "gold" ? "hover:border-gold/30" : "hover:border-emerald/30"
              )}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{
                  background: color === "gold"
                    ? "hsl(var(--gold)/0.12)"
                    : "hsl(var(--emerald)/0.12)",
                }}>
                <Icon className="w-5 h-5"
                  style={{ color: color === "gold" ? "hsl(var(--gold))" : "hsl(var(--emerald))" }} />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA final ──────────────────────────────────────────────────── */}
      <section className="px-6 pb-20">
        <div className="max-w-2xl mx-auto rounded-2xl border p-10 text-center relative overflow-hidden"
          style={{
            background: "hsl(var(--studio-panel))",
            borderColor: "hsl(var(--gold)/0.2)",
            boxShadow: "0 0 60px hsl(var(--gold)/0.06)",
          }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 80% 80% at 50% 0%, hsl(var(--gold)/0.07) 0%, transparent 70%)" }} />
          <h2 className="relative text-2xl font-bold mb-3">Commencez maintenant, c&apos;est gratuit</h2>
          <p className="relative text-muted-foreground text-sm mb-6">
            Aucune inscription requise. Sélectionnez une sourate et créez votre première vidéo.
          </p>
          <Link href="/studio">
            <Button variant="gold" size="lg" className="gap-2 shadow-lg shadow-gold/20">
              <Play className="w-5 h-5" />
              Ouvrir NourQuran Studio
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="text-center text-muted-foreground/40 text-xs py-6 border-t border-studio-border">
        NourQuran Studio · Fait pour l&apos;Afrique de l&apos;Ouest et la diaspora francophone
      </footer>
    </main>
  );
}
