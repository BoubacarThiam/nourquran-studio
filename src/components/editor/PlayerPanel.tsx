"use client";

import React, { useMemo, useRef } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { Loader2, AlertTriangle } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { QuranVideoComposition } from "@remotion/compositions/QuranVideoComposition";
import type { QuranCompositionProps, RenderVerse } from "@/types/remotion";
import { RECITERS } from "@/lib/quran/reciters";
import type { AspectRatio } from "@/types/quran";

const ASPECT_RATIOS: Record<AspectRatio, { width: number; height: number }> = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "1:1":  { width: 1080, height: 1080 },
  "4:5":  { width: 1080, height: 1350 },
};

const FPS = 30;

export function PlayerPanel() {
  const config        = useEditorStore((s) => s.config);
  const loadedChapter = useEditorStore((s) => s.loadedChapter);
  const isLoading     = useEditorStore((s) => s.isLoading);
  const loadError     = useEditorStore((s) => s.loadError);
  const playerRef     = useRef<PlayerRef>(null);

  const reciter = RECITERS.find((r) => r.id === config.reciterId);
  const { width, height } = ASPECT_RATIOS[config.aspectRatio];

  const totalDurationMs   = loadedChapter?.totalDurationMs ?? 5000;
  const durationInFrames  = Math.max(30, Math.ceil((totalDurationMs / 1000) * FPS));
  const displayRatio      = width / height;

  const inputProps: QuranCompositionProps = useMemo(() => ({
    ...config,
    verses:          (loadedChapter?.verses ?? []) as RenderVerse[],
    chapterAudioUrl: loadedChapter?.chapterAudioUrl ?? null,
    surahName:       loadedChapter
      ? `${loadedChapter.surah.name_arabic} — ${loadedChapter.surah.name_french}`
      : "",
    reciterName:     reciter?.name ?? "",
    totalDurationMs,
    showBismillah:   loadedChapter?.showBismillah ?? false,
  }), [config, loadedChapter, reciter, totalDurationMs]);

  // Formats "hauts" (9:16, 4:5…) : la hauteur disponible pilote la taille,
  // la largeur en découle. Formats "larges" : l'inverse. Dans les deux cas
  // un plafond sur l'autre axe évite tout dépassement du conteneur parent
  // (essentiel sur mobile où la zone du player est basse et large).
  const isTallFormat = displayRatio < 1;

  return (
    <div className="relative flex items-center justify-center w-full h-full max-w-full">

      {/* Halo doré autour du player */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          boxShadow: "0 0 0 1px hsl(var(--studio-border)), 0 0 60px hsl(var(--gold)/0.06), 0 0 120px hsl(var(--gold)/0.03)",
        }}
      />

      {/* Conteneur player */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          aspectRatio: String(displayRatio),
          width:    isTallFormat ? "auto" : "100%",
          height:   isTallFormat ? "100%" : "auto",
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      >
        {/* Player Remotion */}
        <Player
          ref={playerRef}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          component={QuranVideoComposition as any}
          inputProps={inputProps}
          durationInFrames={durationInFrames}
          fps={FPS}
          compositionWidth={width}
          compositionHeight={height}
          style={{ width: "100%", height: "100%" }}
          controls
          loop={false}
          autoPlay={false}
          clickToPlay
          showVolumeControls
        />

        {/* Overlay chargement */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3"
            style={{ background: "hsl(var(--studio-bg)/0.85)", backdropFilter: "blur(8px)" }}>
            <div className="relative">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
              <div className="absolute inset-0 rounded-full animate-ping"
                style={{ background: "hsl(var(--gold)/0.15)" }} />
            </div>
            <p className="text-sm text-muted-foreground">Chargement de la récitation…</p>
          </div>
        )}

        {/* Overlay erreur */}
        {loadError && !isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6"
            style={{ background: "hsl(var(--studio-bg)/0.9)", backdropFilter: "blur(8px)" }}>
            <div className="flex flex-col items-center gap-3 max-w-xs text-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              <p className="text-sm text-destructive/90 bg-destructive/10 rounded-xl px-4 py-3 border border-destructive/20">
                {loadError}
              </p>
            </div>
          </div>
        )}

        {/* État vide — aucune sourate */}
        {!loadedChapter && !isLoading && !loadError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3"
            style={{ background: "hsl(var(--studio-bg))" }}>
            <div className="text-5xl opacity-20 font-arabic">بسم الله</div>
            <p className="text-sm text-muted-foreground/80">Sélectionnez une sourate dans le panneau</p>
          </div>
        )}

        {/* Bandeau méta en bas */}
        {loadedChapter && (
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
              padding: "24px 12px 8px",
            }}>
            <p className="text-[10px] text-gold/60 text-center font-mono tracking-wider">
              {loadedChapter.surah.name_arabic}
              {" · "}{loadedChapter.verseCount}v
              {" · "}{Math.round(totalDurationMs / 1000)}s
              {" · "}{config.aspectRatio}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
