"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Search, Upload, Palette, Film, Image as ImageIcon,
  Loader2, X, RefreshCw, Lock, Key, Eye, EyeOff, CheckCircle2,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { cn } from "@/lib/utils";
import type { PexelsVideo, PexelsPhoto } from "@/lib/pexels/client";
import {
  CURATED_VIDEOS, CURATED_CATEGORIES, type CuratedVideo,
} from "@/lib/backgrounds/curatedVideos";
import { SectionLabel } from "./SectionLabel";

type BgMode    = "video" | "photo" | "color" | "upload";
type VideoView = "curated" | "search";

const SUGGESTED_QUERIES = [
  "mosquée", "ciel étoilé", "désert", "coucher de soleil",
  "mer calme", "forêt", "montagne", "lumière dorée",
];

const PRESET_COLORS = [
  { hex: "#0d1117", label: "Nuit"     },
  { hex: "#000000", label: "Noir"     },
  { hex: "#0f172a", label: "Marine"   },
  { hex: "#1a0a2e", label: "Violet"   },
  { hex: "#0a1628", label: "Saphir"   },
  { hex: "#0d2818", label: "Forêt"    },
  { hex: "#1a0000", label: "Bordeaux" },
];

const inputCls =
  "w-full bg-studio-surface border border-studio-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50 transition-all duration-200 placeholder:text-muted-foreground/50";

/* ── Composant inline de saisie de clé Pexels ─────────────────────────── */
function PexelsKeySetup({ onSaved }: { onSaved: () => void }) {
  const [key,     setKey]     = useState("");
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const save = async () => {
    if (!key.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ key: "PEXELS_API_KEY", value: key.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setSaved(true);
      setTimeout(onSaved, 1000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 space-y-3">
      <div className="flex items-start gap-2.5">
        <Key className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-foreground/90">Clé Pexels requise</p>
          <p className="text-[11px] text-muted-foreground/60">
            Gratuite en 2 minutes sur{" "}
            <a
              href="https://www.pexels.com/api/"
              target="_blank"
              rel="noreferrer"
              className="text-gold/80 hover:text-gold underline underline-offset-2"
            >
              pexels.com/api
            </a>
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? "text" : "password"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="Coller votre clé ici…"
            className={cn(inputCls, "pr-9 text-xs")}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            aria-label={show ? "Masquer la clé" : "Afficher la clé"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 rounded"
          >
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <button
          onClick={save}
          disabled={loading || !key.trim() || saved}
          className={cn(
            "px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 transition-all duration-200 cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gold/40",
            saved
              ? "bg-emerald/15 text-emerald border border-emerald/30"
              : "bg-gold text-studio-bg hover:bg-gold/90"
          )}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
           saved    ? <><CheckCircle2 className="w-3.5 h-3.5" /> Sauvegardé</> :
                      "Sauvegarder"}
        </button>
      </div>

      {error && (
        <p className="text-[11px] text-destructive">{error}</p>
      )}
    </div>
  );
}

/* ── Composant principal ─────────────────────────────────────────────────── */
export function BackgroundTab() {
  const config    = useEditorStore((s) => s.config);
  const setConfig = useEditorStore((s) => s.setConfig);

  const [mode,      setMode]      = useState<BgMode>("video");
  const [videoView, setVideoView] = useState<VideoView>("curated");

  // ── État bibliothèque curée ────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState("all");
  const [fetchingId,     setFetchingId]     = useState<string | null>(null);
  const [libError,       setLibError]       = useState<string | null>(null);
  const [showKeySetup,   setShowKeySetup]   = useState(false);
  const [hasKey,         setHasKey]         = useState<boolean | null>(null);

  // ── Vérifier si clé Pexels configurée ────────────────────────────────────
  const checkKey = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setHasKey(!!(data.PEXELS_API_KEY?.configured));
    } catch {
      setHasKey(false);
    }
  }, []);

  useEffect(() => { checkKey(); }, [checkKey]);

  // ── Search state ───────────────────────────────────────────────────────────
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<(PexelsVideo | PexelsPhoto)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [page,    setPage]    = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Sélectionner une vidéo de la bibliothèque curée ───────────────────────
  const selectCuratedVideo = async (v: CuratedVideo) => {
    if (!hasKey) {
      setShowKeySetup(true);
      return;
    }
    setFetchingId(v.id);
    setLibError(null);
    try {
      const res  = await fetch(`/api/pexels/video/${v.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setConfig({
        background: {
          type:      "pexels_video",
          pexelsId:  v.id,
          url:       data.url,
          thumbnail: v.thumbnail,
        },
      });
    } catch (err) {
      setLibError((err as Error).message);
    } finally {
      setFetchingId(null);
    }
  };

  // ── Recherche Pexels ───────────────────────────────────────────────────────
  const search = useCallback(async (q: string, p = 1) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    if (p === 1) setResults([]);
    try {
      const params = new URLSearchParams({
        query:       q,
        type:        mode === "photo" ? "photo" : "video",
        perPage:     "12",
        page:        String(p),
        orientation: config.aspectRatio === "9:16" ? "portrait" : "landscape",
      });
      const res  = await fetch(`/api/pexels/search?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur Pexels");
      const items = data.videos ?? data.photos ?? [];
      setResults((prev) => p === 1 ? items : [...prev, ...items]);
      setHasMore(items.length === 12);
      setPage(p);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [mode, config.aspectRatio]);

  const selectVideo = (v: PexelsVideo) => {
    const files = [...v.video_files].sort((a, b) => b.width - a.width);
    const best  = files.find((f) => f.quality === "hd") ?? files[0];
    setConfig({ background: { type: "pexels_video", pexelsId: String(v.id), url: best?.link ?? "", thumbnail: v.image } });
  };

  const selectPhoto = (p: PexelsPhoto) => {
    setConfig({ background: { type: "pexels_image", pexelsId: String(p.id), url: p.src.large2x } });
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setConfig({ background: { type: "upload", url, localPath: url } });
  };

  const isSelected = (id: string) => config.background.pexelsId === id;

  // ── Vidéos curées filtrées ────────────────────────────────────────────────
  const curatedFiltered = activeCategory === "all"
    ? CURATED_VIDEOS
    : CURATED_VIDEOS.filter((v) => v.category === activeCategory);

  const MODES: { id: BgMode; icon: React.ElementType; label: string }[] = [
    { id: "video",  icon: Film,      label: "Vidéo"   },
    { id: "photo",  icon: ImageIcon, label: "Photo"   },
    { id: "color",  icon: Palette,   label: "Couleur" },
    { id: "upload", icon: Upload,    label: "Upload"  },
  ];

  return (
    <div className="space-y-4 px-4 py-4">

      {/* ── Mode selector ── */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl border border-studio-border"
        style={{ background: "hsl(var(--studio-surface))" }}>
        {MODES.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => { setMode(id); setResults([]); setError(null); setShowKeySetup(false); }}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 rounded-lg text-[10px] font-medium transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/40",
              mode === id
                ? "bg-gold/15 text-gold border border-gold/25 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Aperçu fond actuel ── */}
      {config.background.url && (
        <div className="relative rounded-xl overflow-hidden aspect-video bg-studio-surface border border-studio-border group">
          {(config.background.type === "pexels_video" || config.background.type === "upload") ? (
            config.background.thumbnail
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={config.background.thumbnail} alt="Fond actuel" className="w-full h-full object-cover" />
              : <video src={config.background.url} muted loop autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.background.url} alt="Fond actuel" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2.5">
            <span className="text-[10px] text-white/70 font-medium tracking-wide uppercase">Fond actuel</span>
          </div>
          <button
            onClick={() => setConfig({ background: { type: "color", color: "#0d1117" } })}
            aria-label="Retirer le fond"
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/90 transition-all duration-200 cursor-pointer opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}

      {/* ── Couleur unie ── */}
      {mode === "color" && (
        <section className="space-y-3">
          <SectionLabel>Couleur de fond</SectionLabel>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer flex-shrink-0">
              <input
                type="color"
                value={config.background.color ?? "#0d1117"}
                onChange={(e) => setConfig({ background: { type: "color", color: e.target.value } })}
                className="sr-only"
              />
              <div className="w-10 h-10 rounded-lg border-2 border-studio-border hover:border-gold/50 transition-colors duration-200 shadow-sm"
                style={{ background: config.background.color ?? "#0d1117" }} />
            </label>
            <input
              type="text"
              value={config.background.color ?? "#0d1117"}
              onChange={(e) => setConfig({ background: { type: "color", color: e.target.value } })}
              className={cn(inputCls, "font-mono")}
              placeholder="#0d1117"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.hex}
                title={c.label}
                aria-label={c.label}
                aria-pressed={config.background.color === c.hex}
                onClick={() => setConfig({ background: { type: "color", color: c.hex } })}
                style={{ background: c.hex }}
                className={cn(
                  "w-8 h-8 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gold/40",
                  config.background.color === c.hex
                    ? "border-gold shadow-[0_0_8px_hsl(var(--gold)/0.4)]"
                    : "border-studio-border hover:border-gold/30"
                )}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Upload ── */}
      {mode === "upload" && (
        <section className="space-y-2">
          <SectionLabel>Votre fond personnalisé</SectionLabel>
          <input ref={fileInputRef} type="file" accept="video/*,image/*" onChange={handleUpload} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-10 rounded-xl border-2 border-dashed border-studio-border hover:border-gold/50 hover:bg-gold/5 text-muted-foreground hover:text-gold transition-all duration-200 cursor-pointer flex flex-col items-center gap-2 focus:outline-none focus:ring-2 focus:ring-gold/40"
          >
            <Upload className="w-6 h-6" />
            <span className="text-sm font-medium">Cliquer pour importer</span>
            <span className="text-[11px] text-muted-foreground/60">MP4, MOV · JPG, PNG, WebP</span>
          </button>
        </section>
      )}

      {/* ── Vidéo ── */}
      {mode === "video" && (
        <section className="space-y-3">

          {/* Sub-nav */}
          <div className="flex gap-1 p-1 rounded-xl border border-studio-border"
            style={{ background: "hsl(var(--studio-surface))" }}>
            {(["curated", "search"] as const).map((v) => (
              <button
                key={v}
                onClick={() => { setVideoView(v); setShowKeySetup(false); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer focus:outline-none",
                  videoView === v
                    ? "bg-gold/15 text-gold border border-gold/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                {v === "curated"
                  ? <Film className="w-3.5 h-3.5" />
                  : <Search className="w-3.5 h-3.5" />}
                {v === "curated" ? "Bibliothèque" : "Recherche Pexels"}
              </button>
            ))}
          </div>

          {/* ── BIBLIOTHÈQUE CURÉE ── */}
          {videoView === "curated" && (
            <div className="space-y-3">

              {/* Setup clé inline */}
              {showKeySetup && (
                <PexelsKeySetup onSaved={() => { setShowKeySetup(false); setHasKey(true); checkKey(); }} />
              )}

              {/* Filtre catégories */}
              <div className="flex flex-wrap gap-1.5">
                <CategoryPill
                  label="Tout"
                  active={activeCategory === "all"}
                  onClick={() => setActiveCategory("all")}
                />
                {Object.entries(CURATED_CATEGORIES).map(([key, label]) => (
                  <CategoryPill
                    key={key}
                    label={label}
                    active={activeCategory === key}
                    onClick={() => setActiveCategory(key)}
                  />
                ))}
              </div>

              {/* Erreur API */}
              {libError && (
                <p className="text-[11px] text-destructive bg-destructive/10 rounded-xl px-3 py-2 border border-destructive/20">
                  {libError}
                </p>
              )}

              {/* Bannière "clé requise" subtile */}
              {hasKey === false && !showKeySetup && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-gold/15 bg-gold/5">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-gold/60 flex-shrink-0" />
                    <span className="text-[11px] text-muted-foreground/70">Clé Pexels requise pour charger les vidéos</span>
                  </div>
                  <button
                    onClick={() => setShowKeySetup(true)}
                    className="text-[11px] text-gold hover:text-gold/80 font-semibold flex-shrink-0 cursor-pointer focus:outline-none"
                  >
                    Configurer
                  </button>
                </div>
              )}

              {/* Grille */}
              <div className="grid grid-cols-2 gap-2">
                {curatedFiltered.map((v) => {
                  const sel      = isSelected(v.id);
                  const fetching = fetchingId === v.id;
                  const locked   = hasKey === false;

                  return (
                    <button
                      key={v.id}
                      onClick={() => !fetching && selectCuratedVideo(v)}
                      disabled={fetching}
                      className={cn(
                        "relative rounded-xl overflow-hidden aspect-video border-2 transition-all duration-200 cursor-pointer focus:outline-none hover:scale-[1.02] active:scale-[0.98] group",
                        sel
                          ? "border-gold shadow-[0_0_14px_hsl(var(--gold)/0.45)]"
                          : "border-transparent hover:border-gold/40"
                      )}
                    >
                      {/* Miniature */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={v.thumbnail}
                        alt={v.label}
                        className={cn("w-full h-full object-cover transition-opacity", locked ? "opacity-70" : "")}
                        loading="lazy"
                        onError={(e) => {
                          // Fallback: gradient si miniature introuvable
                          (e.target as HTMLImageElement).style.display = "none";
                          (e.target as HTMLImageElement).parentElement!.style.background =
                            "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)";
                        }}
                      />

                      {/* Label */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2">
                        <p className="text-[10px] text-white/90 font-medium leading-tight">{v.label}</p>
                        <p className="text-[9px] text-white/50">{CURATED_CATEGORIES[v.category] ?? v.category}</p>
                      </div>

                      {/* Icône cadenas (clé manquante) */}
                      {locked && !sel && !fetching && (
                        <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm rounded-full p-1">
                          <Lock className="w-3 h-3 text-gold/70" />
                        </div>
                      )}

                      {/* Sélectionné */}
                      {sel && (
                        <div className="absolute inset-0 bg-gold/20 flex items-center justify-center">
                          <div className="bg-gold rounded-full w-7 h-7 flex items-center justify-center text-studio-bg text-sm font-bold shadow-lg">
                            ✓
                          </div>
                        </div>
                      )}

                      {/* Chargement */}
                      {fetching && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-gold animate-spin" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] text-muted-foreground/70 text-center">
                {curatedFiltered.length} vidéos · Propulsé par{" "}
                <a href="https://pexels.com" target="_blank" rel="noreferrer" className="hover:text-muted-foreground underline underline-offset-2">
                  Pexels
                </a>
              </p>
            </div>
          )}

          {/* ── RECHERCHE PEXELS ── */}
          {videoView === "search" && (
            <div className="space-y-3">

              {/* Setup clé si nécessaire */}
              {hasKey === false ? (
                <PexelsKeySetup onSaved={() => { setHasKey(true); checkKey(); }} />
              ) : (
                <>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                      <input
                        type="text"
                        placeholder="mosquée, nature, désert…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && search(query)}
                        className={cn(inputCls, "pl-9")}
                      />
                    </div>
                    <button
                      onClick={() => search(query)}
                      disabled={loading || !query.trim()}
                      className="px-3.5 rounded-xl bg-gold text-studio-bg text-sm font-semibold hover:bg-gold/90 disabled:opacity-40 transition-all duration-200 cursor-pointer flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-gold/40"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_QUERIES.slice(0, 6).map((s) => (
                      <button
                        key={s}
                        onClick={() => { setQuery(s); search(s); }}
                        className="px-2.5 py-1 rounded-full text-[11px] bg-studio-surface border border-studio-border hover:border-gold/30 hover:bg-gold/10 hover:text-gold transition-all duration-200 cursor-pointer text-muted-foreground focus:outline-none"
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {error && (
                    <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2 border border-destructive/20">
                      {error}
                    </p>
                  )}

                  {results.length > 0 && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {results.map((item) => {
                          const v     = item as PexelsVideo;
                          const thumb = v.image;
                          const id    = String(item.id);
                          const sel   = isSelected(id);
                          return (
                            <button
                              key={id}
                              onClick={() => selectVideo(v)}
                              className={cn(
                                "relative rounded-xl overflow-hidden aspect-video border-2 transition-all duration-200 cursor-pointer focus:outline-none hover:scale-[1.02] active:scale-[0.98]",
                                sel
                                  ? "border-gold shadow-[0_0_12px_hsl(var(--gold)/0.4)]"
                                  : "border-transparent hover:border-gold/40"
                              )}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
                              <div className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-[9px] text-white font-medium">
                                {Math.round(v.duration)}s
                              </div>
                              {sel && (
                                <div className="absolute inset-0 bg-gold/25 flex items-center justify-center">
                                  <div className="bg-gold rounded-full w-7 h-7 flex items-center justify-center text-studio-bg text-sm font-bold shadow-lg">✓</div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {hasMore && (
                        <button
                          onClick={() => search(query, page + 1)}
                          disabled={loading}
                          className="w-full py-2.5 text-xs text-muted-foreground hover:text-gold flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer disabled:opacity-50 focus:outline-none"
                        >
                          {loading
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Chargement…</>
                            : <><RefreshCw className="w-3.5 h-3.5" /> Charger plus</>}
                        </button>
                      )}
                    </div>
                  )}

                  {results.length === 0 && !loading && !error && (
                    <div className="py-8 text-center text-muted-foreground/70 text-sm">
                      Recherchez une ambiance pour votre vidéo
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      )}

      {/* ── Photo (toujours avec recherche Pexels) ── */}
      {mode === "photo" && (
        <section className="space-y-3">
          {hasKey === false ? (
            <PexelsKeySetup onSaved={() => { setHasKey(true); checkKey(); }} />
          ) : (
            <>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <input
                    type="text"
                    placeholder="mosquée, désert, lumière…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && search(query)}
                    className={cn(inputCls, "pl-9")}
                  />
                </div>
                <button
                  onClick={() => search(query)}
                  disabled={loading || !query.trim()}
                  className="px-3.5 rounded-xl bg-gold text-studio-bg text-sm font-semibold hover:bg-gold/90 disabled:opacity-40 transition-all duration-200 cursor-pointer flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-gold/40"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUERIES.slice(0, 6).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setQuery(s); search(s); }}
                    className="px-2.5 py-1 rounded-full text-[11px] bg-studio-surface border border-studio-border hover:border-gold/30 hover:bg-gold/10 hover:text-gold transition-all duration-200 cursor-pointer text-muted-foreground focus:outline-none"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {error && (
                <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2 border border-destructive/20">
                  {error}
                </p>
              )}

              {results.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {results.map((item) => {
                    const p   = item as PexelsPhoto;
                    const id  = String(item.id);
                    const sel = isSelected(id);
                    return (
                      <button
                        key={id}
                        onClick={() => selectPhoto(p)}
                        className={cn(
                          "relative rounded-xl overflow-hidden aspect-video border-2 transition-all duration-200 cursor-pointer focus:outline-none hover:scale-[1.02] active:scale-[0.98]",
                          sel
                            ? "border-gold shadow-[0_0_12px_hsl(var(--gold)/0.4)]"
                            : "border-transparent hover:border-gold/40"
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.src.medium} alt="" className="w-full h-full object-cover" loading="lazy" />
                        {sel && (
                          <div className="absolute inset-0 bg-gold/25 flex items-center justify-center">
                            <div className="bg-gold rounded-full w-7 h-7 flex items-center justify-center text-studio-bg text-sm font-bold shadow-lg">✓</div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {results.length === 0 && !loading && !error && (
                <div className="py-8 text-center text-muted-foreground/70 text-sm">
                  Recherchez une image de fond
                </div>
              )}
            </>
          )}
        </section>
      )}

    </div>
  );
}

/* ── Composants utilitaires ──────────────────────────────────────────────── */

function CategoryPill({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-full text-[11px] border transition-all duration-200 cursor-pointer focus:outline-none whitespace-nowrap",
        active
          ? "bg-gold/15 border-gold/30 text-gold"
          : "bg-studio-surface border-studio-border text-muted-foreground hover:border-gold/30 hover:text-gold/80"
      )}
    >
      {label}
    </button>
  );
}
