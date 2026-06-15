"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Search, Upload, Palette, Film, Image as ImageIcon,
  Loader2, X, RefreshCw, BookOpen, RotateCcw,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { cn } from "@/lib/utils";
import type { PexelsVideo, PexelsPhoto } from "@/lib/pexels/client";

type BgMode    = "video" | "photo" | "color" | "upload";
type VideoView = "library" | "search";

interface LibraryVideo {
  id:        string;
  category:  string;
  thumbnail: string;
  duration:  number;
  width:     number;
  height:    number;
}

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

export function BackgroundTab() {
  const config    = useEditorStore((s) => s.config);
  const setConfig = useEditorStore((s) => s.setConfig);

  const [mode,      setMode]      = useState<BgMode>("video");
  const [videoView, setVideoView] = useState<VideoView>("library");

  // ── Library state ──────────────────────────────────────────────────────────
  const [library,        setLibrary]        = useState<Record<string, LibraryVideo[]>>({});
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>({});
  const [libLoading,     setLibLoading]     = useState(false);
  const [libError,       setLibError]       = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [libLoaded,      setLibLoaded]      = useState(false);

  // ── Search state ───────────────────────────────────────────────────────────
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<(PexelsVideo | PexelsPhoto)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [page,    setPage]    = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const fileInputRef          = useRef<HTMLInputElement>(null);

  // ── Load library on first open ─────────────────────────────────────────────
  const loadLibrary = useCallback(async (force = false) => {
    if (libLoaded && !force) return;
    setLibLoading(true);
    setLibError(null);
    try {
      const orientation = config.aspectRatio === "9:16" ? "portrait" : "landscape";
      const method      = force ? "POST" : "GET";
      const res         = await fetch(`/api/pexels/library?orientation=${orientation}`, { method });
      const data        = await res.json();
      if (data.error && Object.keys(data.byCategory ?? {}).length === 0) {
        setLibError(data.error);
      } else {
        setLibrary(data.byCategory ?? {});
        if (data.categories) setCategoryLabels(data.categories as Record<string, string>);
        setLibLoaded(true);
      }
    } catch {
      setLibError("Impossible de charger la bibliothèque.");
    } finally {
      setLibLoading(false);
    }
  }, [libLoaded, config.aspectRatio]);

  useEffect(() => {
    if (mode === "video" && videoView === "library" && !libLoaded) {
      loadLibrary();
    }
  }, [mode, videoView, libLoaded, loadLibrary]);

  // ── Select a library video (fetch fresh URL from Pexels) ──────────────────
  const [fetchingId, setFetchingId] = useState<string | null>(null);

  const selectLibraryVideo = async (v: LibraryVideo) => {
    setFetchingId(v.id);
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

  // ── Search ─────────────────────────────────────────────────────────────────
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

  // ── Library filtered videos ────────────────────────────────────────────────
  const libVideos: LibraryVideo[] = activeCategory === "all"
    ? Object.values(library).flat()
    : (library[activeCategory] ?? []);

  const categoryKeys = Object.keys(categoryLabels).length
    ? Object.keys(categoryLabels)
    : Object.keys(library);

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
            onClick={() => { setMode(id); setResults([]); setError(null); }}
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
            className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full p-1.5 hover:bg-black/90 transition-all duration-200 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
          >
            <X className="w-3 h-3 text-white" />
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

      {/* ── Vidéo & Photo ── */}
      {(mode === "video" || mode === "photo") && (
        <section className="space-y-3">

          {/* Sub-nav : Bibliothèque | Recherche (vidéo seulement) */}
          {mode === "video" && (
            <div className="flex gap-1 p-1 rounded-xl border border-studio-border"
              style={{ background: "hsl(var(--studio-surface))" }}>
              {(["library", "search"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVideoView(v)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer focus:outline-none",
                    videoView === v
                      ? "bg-gold/15 text-gold border border-gold/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  {v === "library" ? <BookOpen className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
                  {v === "library" ? "Bibliothèque" : "Recherche Pexels"}
                </button>
              ))}
            </div>
          )}

          {/* ── BIBLIOTHÈQUE ── */}
          {mode === "video" && videoView === "library" && (
            <div className="space-y-3">

              {/* Header bibliothèque */}
              <div className="flex items-center justify-between">
                <SectionLabel>Vidéos de fond</SectionLabel>
                <button
                  onClick={() => loadLibrary(true)}
                  disabled={libLoading}
                  title="Actualiser"
                  className="p-1 rounded-md text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer disabled:opacity-30 focus:outline-none"
                >
                  <RotateCcw className={cn("w-3 h-3", libLoading && "animate-spin")} />
                </button>
              </div>

              {/* Filtre catégories */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] border transition-all duration-200 cursor-pointer focus:outline-none",
                    activeCategory === "all"
                      ? "bg-gold/15 border-gold/30 text-gold"
                      : "bg-studio-surface border-studio-border text-muted-foreground hover:border-gold/30 hover:text-gold/80"
                  )}
                >
                  Tout
                </button>
                {categoryKeys.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[11px] border transition-all duration-200 cursor-pointer focus:outline-none",
                      activeCategory === cat
                        ? "bg-gold/15 border-gold/30 text-gold"
                        : "bg-studio-surface border-studio-border text-muted-foreground hover:border-gold/30 hover:text-gold/80"
                    )}
                  >
                    {categoryLabels[cat] ?? cat}
                  </button>
                ))}
              </div>

              {/* Erreur bibliothèque */}
              {libError && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-400/80">
                  <p className="font-medium mb-0.5">Clé Pexels requise</p>
                  <p className="text-muted-foreground/60">Configurez votre clé dans <span className="text-gold/70">Paramètres → API</span> pour accéder à la bibliothèque.</p>
                </div>
              )}

              {/* Chargement initial */}
              {libLoading && libVideos.length === 0 && (
                <div className="py-10 flex flex-col items-center gap-3">
                  <Loader2 className="w-6 h-6 text-gold/50 animate-spin" />
                  <p className="text-xs text-muted-foreground/50">Chargement de la bibliothèque…</p>
                </div>
              )}

              {/* Grille vidéos bibliothèque */}
              {libVideos.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {libVideos.map((v) => {
                    const sel      = isSelected(v.id);
                    const fetching = fetchingId === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => !fetching && selectLibraryVideo(v)}
                        disabled={fetching}
                        className={cn(
                          "relative rounded-xl overflow-hidden aspect-video border-2 transition-all duration-200 cursor-pointer focus:outline-none hover:scale-[1.02] active:scale-[0.98] group",
                          sel
                            ? "border-gold shadow-[0_0_14px_hsl(var(--gold)/0.45)]"
                            : "border-transparent hover:border-gold/40"
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={v.thumbnail}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />

                        {/* Durée */}
                        <div className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-[9px] text-white font-medium">
                          {Math.round(v.duration)}s
                        </div>

                        {/* Catégorie */}
                        <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-[9px] text-white/70 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          {categoryLabels[v.category] ?? v.category}
                        </div>

                        {/* Sélectionné */}
                        {sel && (
                          <div className="absolute inset-0 bg-gold/20 flex items-center justify-center">
                            <div className="bg-gold rounded-full w-7 h-7 flex items-center justify-center text-studio-bg text-sm font-bold shadow-lg">
                              ✓
                            </div>
                          </div>
                        )}

                        {/* Chargement URL */}
                        {fetching && (
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-gold animate-spin" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* État vide */}
              {!libLoading && !libError && libVideos.length === 0 && libLoaded && (
                <div className="py-8 text-center text-muted-foreground/40 text-sm">
                  Aucune vidéo dans cette catégorie
                </div>
              )}
            </div>
          )}

          {/* ── RECHERCHE PEXELS ── */}
          {(mode === "photo" || (mode === "video" && videoView === "search")) && (
            <div className="space-y-3">
              <SectionLabel>{mode === "video" ? "Recherche vidéos" : "Photos Pexels"}</SectionLabel>

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

              {/* Suggestions */}
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
                      const isVid = mode === "video";
                      const v     = item as PexelsVideo;
                      const p     = item as PexelsPhoto;
                      const thumb = isVid ? v.image : p.src.medium;
                      const id    = String(item.id);
                      const sel   = isSelected(id);

                      return (
                        <button
                          key={id}
                          onClick={() => isVid ? selectVideo(v) : selectPhoto(p)}
                          className={cn(
                            "relative rounded-xl overflow-hidden aspect-video border-2 transition-all duration-200 cursor-pointer focus:outline-none hover:scale-[1.02] active:scale-[0.98]",
                            sel
                              ? "border-gold shadow-[0_0_12px_hsl(var(--gold)/0.4)]"
                              : "border-transparent hover:border-gold/40"
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
                          {isVid && (
                            <div className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-[9px] text-white font-medium">
                              {Math.round(v.duration)}s
                            </div>
                          )}
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
                <div className="py-8 text-center text-muted-foreground/40 text-sm">
                  Recherchez une ambiance pour votre vidéo
                </div>
              )}
            </div>
          )}

        </section>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-0.5">
      {children}
    </p>
  );
}
