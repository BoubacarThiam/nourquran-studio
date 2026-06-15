"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Download, RotateCcw, Loader2, Settings } from "lucide-react";
import { PlayerPanel }    from "./PlayerPanel";
import { ControlsPanel }  from "./ControlsPanel";
import { ExportModal }    from "./ExportModal";
import { SettingsModal }  from "./SettingsModal";
import { Button }        from "@/components/ui/button";
import { useEditorStore } from "@/store/editorStore";
import { useChapterLoader } from "@/hooks/useChapterLoader";
import { cn } from "@/lib/utils";

export function StudioClient() {
  useChapterLoader();

  const config       = useEditorStore((s) => s.config);
  const isLoading    = useEditorStore((s) => s.isLoading);
  const loadError    = useEditorStore((s) => s.loadError);
  const chapter      = useEditorStore((s) => s.loadedChapter);

  const [showExport,   setShowExport]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "hsl(var(--studio-bg))" }}>

      {/* ── Header glassmorphism ────────────────────────────────────────── */}
      <header className="glass-heavy flex items-center justify-between px-5 py-3 border-b border-studio-border flex-shrink-0 z-30">

        {/* Logo + breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-7 h-7 rounded-lg gradient-gold flex items-center justify-center text-sm shadow-lg shadow-gold/20 group-hover:shadow-gold/40 transition-shadow duration-300">
              ☽
            </div>
            <span className="font-semibold text-sm hidden sm:block tracking-tight">
              Nour<span className="text-gradient-gold">Quran</span>
            </span>
          </Link>

          {chapter && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-px h-4 bg-studio-border" />
              <span className="font-arabic text-base leading-none text-foreground truncate max-w-[120px]">
                {chapter.surah.name_arabic}
              </span>
              <span className="text-xs text-muted-foreground hidden md:block truncate max-w-[100px]">
                {chapter.surah.name_french}
              </span>
              {isLoading && <Loader2 className="w-3.5 h-3.5 text-gold animate-spin flex-shrink-0" />}
            </div>
          )}
        </div>

        {/* Centre — méta */}
        <div className="hidden md:flex items-center gap-1.5">
          <MetaPill label={config.aspectRatio} />
          <MetaPill label={config.resolution} />
          {chapter && (
            <MetaPill
              label={`${chapter.verses.length}v · ${Math.round((chapter.totalDurationMs ?? 0) / 1000)}s`}
              glow
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent hover:border-studio-border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/50"
            title="Clés API"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:block">API</span>
          </button>

          <button
            onClick={() => useEditorStore.getState().resetConfig()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent hover:border-studio-border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Réinitialiser</span>
          </button>

          <Button
            variant="gold"
            size="sm"
            disabled={!chapter || isLoading}
            onClick={() => setShowExport(true)}
            className="text-xs gap-1.5 shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-shadow duration-300 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Exporter MP4
          </Button>
        </div>
      </header>

      {/* ── Corps ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        <aside className="w-72 flex-shrink-0 border-r border-studio-border overflow-hidden flex flex-col"
          style={{ background: "hsl(var(--studio-panel))" }}>
          <ControlsPanel />
        </aside>

        <main className="flex-1 flex items-center justify-center p-4 overflow-hidden relative"
          style={{ background: "hsl(var(--studio-bg))" }}>
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }} />
          <div className="relative w-full h-full max-w-2xl flex items-center justify-center">
            <PlayerPanel />
          </div>
        </main>
      </div>

      {/* ── Status bar ───────────────────────────────────────────────────── */}
      <footer className="h-7 flex items-center px-5 gap-4 border-t border-studio-border flex-shrink-0"
        style={{ background: "hsl(var(--studio-panel))" }}>

        <StatusDot state={isLoading ? "loading" : loadError ? "error" : chapter ? "ok" : "idle"} />

        <span className="text-xs text-muted-foreground truncate">
          {isLoading
            ? "Chargement en cours…"
            : loadError
            ? loadError
            : chapter
            ? `${chapter.surah.name_simple} · ${chapter.verses.length} versets · ${Math.round((chapter.totalDurationMs ?? 0) / 1000)}s · ${chapter.chapterAudioUrl ? "Timings ✓" : "Timings estimés"}`
            : "Sélectionnez une sourate pour commencer"}
        </span>

        <div className="ml-auto flex items-center gap-3 text-[10px] text-muted-foreground/50 flex-shrink-0">
          <span className="hidden sm:block">NourQuran Studio</span>
          <span className="w-px h-3 bg-studio-border" />
          <span>Beta</span>
        </div>
      </footer>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {showExport   && <ExportModal    onClose={() => setShowExport(false)} />}
      {showSettings && <SettingsModal  onClose={() => setShowSettings(false)} />}
    </div>
  );
}

/* ── Sous-composants ──────────────────────────────────────────────────────── */

function MetaPill({ label, glow }: { label: string; glow?: boolean }) {
  return (
    <span className={cn(
      "px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors",
      glow
        ? "border-gold/30 bg-gold/10 text-gold"
        : "border-studio-border bg-studio-surface text-muted-foreground"
    )}>
      {label}
    </span>
  );
}

function StatusDot({ state }: { state: "idle" | "loading" | "ok" | "error" }) {
  return (
    <span className={cn(
      "w-1.5 h-1.5 rounded-full flex-shrink-0",
      state === "loading" && "bg-gold animate-pulse",
      state === "ok"      && "bg-emerald",
      state === "error"   && "bg-destructive",
      state === "idle"    && "bg-muted-foreground/30"
    )} />
  );
}
