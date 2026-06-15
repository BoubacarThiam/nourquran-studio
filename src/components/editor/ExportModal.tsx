"use client";

import React, { useEffect, useRef, useState } from "react";
import { Download, X, Loader2, CheckCircle2, AlertTriangle, Film, Clock } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { RECITERS } from "@/lib/quran/reciters";
import type { QuranCompositionProps, RenderVerse } from "@/types/remotion";

interface Props {
  onClose: () => void;
}

type Phase = "confirm" | "rendering" | "done" | "failed";

export function ExportModal({ onClose }: Props) {
  const config        = useEditorStore((s) => s.config);
  const loadedChapter = useEditorStore((s) => s.loadedChapter);
  const reciter       = RECITERS.find((r) => r.id === config.reciterId);

  const [phase,       setPhase]       = useState<Phase>("confirm");
  const [progress,    setProgress]    = useState(0);
  const [statusText,  setStatusText]  = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [filename,    setFilename]    = useState("video.mp4");
  const [error,       setError]       = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const durationSec   = Math.round((loadedChapter?.totalDurationMs ?? 0) / 1000);
  const verseCount    = loadedChapter?.verses.length ?? 0;
  const renderEnabled = process.env.NEXT_PUBLIC_RENDER_ENABLED !== "false";

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function startRender() {
    if (!loadedChapter) return;
    setPhase("rendering");
    setProgress(0);
    setStatusText("Démarrage…");

    try {
      const inputProps: QuranCompositionProps = {
        ...config,
        verses:          loadedChapter.verses as RenderVerse[],
        chapterAudioUrl: loadedChapter.chapterAudioUrl ?? null,
        surahName:       `${loadedChapter.surah.name_arabic} — ${loadedChapter.surah.name_french}`,
        reciterName:     reciter?.name ?? "",
        totalDurationMs: loadedChapter.totalDurationMs ?? 0,
      };

      const res = await fetch("/api/render", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(inputProps),
      });

      const { jobId, error: startErr } = await res.json();
      if (startErr || !jobId) throw new Error(startErr ?? "Impossible de démarrer le rendu");

      // Polling toutes les 2 secondes
      pollRef.current = setInterval(async () => {
        try {
          const poll = await fetch(`/api/render/${jobId}`);
          const data = await poll.json();

          if (data.status === "downloading") {
            setStatusText("Téléchargement de la vidéo de fond…");
            setProgress(data.progress);
          } else if (data.status === "bundling") {
            setStatusText("Compilation des assets…");
            setProgress(data.progress);
          } else if (data.status === "rendering") {
            setStatusText(`Rendu en cours… ${data.progress}%`);
            setProgress(data.progress);
          } else if (data.status === "done") {
            clearInterval(pollRef.current!);
            setProgress(100);
            setStatusText("Rendu terminé !");
            setDownloadUrl(data.downloadUrl);
            setFilename(`NourQuran_${loadedChapter.surah.name_simple}_${config.aspectRatio.replace(":", "x")}.mp4`);
            setPhase("done");
          } else if (data.status === "failed") {
            clearInterval(pollRef.current!);
            throw new Error(data.error ?? "Le rendu a échoué");
          }
        } catch (pollErr) {
          clearInterval(pollRef.current!);
          setError((pollErr as Error).message);
          setPhase("failed");
        }
      }, 2000);

    } catch (err) {
      setError((err as Error).message);
      setPhase("failed");
    }
  }

  function triggerDownload() {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href     = downloadUrl;
    a.download = filename;
    a.click();
  }

  return (
    // Fond semi-transparent
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget && phase !== "rendering") onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-studio-border overflow-hidden shadow-2xl"
        style={{ background: "hsl(var(--studio-panel))" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center">
              <Film className="w-4 h-4 text-gold" />
            </div>
            <div>
              <p className="font-semibold text-sm">Exporter en MP4</p>
              <p className="text-[11px] text-muted-foreground/60">{config.aspectRatio} · {config.resolution}</p>
            </div>
          </div>
          {phase !== "rendering" && (
            <button onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/8 text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/50">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* ── Confirmation ── */}
          {phase === "confirm" && (
            <>
              {/* Résumé vidéo */}
              <div className="rounded-xl border border-studio-border bg-studio-surface p-4 space-y-2.5">
                <InfoRow label="Sourate"     value={loadedChapter?.surah.name_french ?? "—"} />
                <InfoRow label="Versets"     value={`${config.fromVerse} → ${config.toVerse} (${verseCount} versets)`} />
                <InfoRow label="Récitateur"  value={reciter?.name ?? "—"} />
                <InfoRow label="Durée"       value={`~${durationSec}s`} />
                <InfoRow label="Format"      value={`${config.aspectRatio} · ${config.resolution}`} />
              </div>

              {renderEnabled ? (
                <>
                  <p className="text-xs text-muted-foreground/60 text-center">
                    Le rendu prend environ {Math.ceil(durationSec / 10)}–{Math.ceil(durationSec / 5)} minutes selon votre machine.
                  </p>

                  <button
                    onClick={startRender}
                    disabled={!loadedChapter}
                    className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold/40 disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--gold)) 0%, hsl(43 80% 60%) 100%)",
                      color:      "hsl(var(--studio-bg))",
                      boxShadow:  "0 4px 20px hsl(var(--gold)/0.3)",
                    }}
                  >
                    <Film className="w-4 h-4" />
                    Lancer le rendu
                  </button>
                </>
              ) : (
                <div className="space-y-3 text-center py-2">
                  <div className="flex flex-col items-center gap-2">
                    <Clock className="w-10 h-10 text-gold/70" />
                    <p className="font-semibold text-sm">Export vidéo bientôt disponible</p>
                    <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto">
                      Le rendu vidéo serveur n&apos;est pas encore activé sur ce déploiement.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl border border-studio-border text-sm hover:border-gold/30 transition-colors cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── Rendu en cours ── */}
          {phase === "rendering" && (
            <div className="space-y-5 py-2">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Loader2 className="w-10 h-10 text-gold animate-spin" />
                  <div className="absolute inset-0 rounded-full animate-ping opacity-20"
                    style={{ background: "hsl(var(--gold))" }} />
                </div>
                <p className="text-sm font-medium">{statusText}</p>
              </div>

              {/* Barre de progression */}
              <div className="space-y-1.5">
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--studio-surface))" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width:      `${progress}%`,
                      background: "linear-gradient(90deg, hsl(var(--gold)) 0%, hsl(43 80% 70%) 100%)",
                      boxShadow:  "0 0 8px hsl(var(--gold)/0.5)",
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground/50">
                  <span>Rendu Remotion + FFmpeg</span>
                  <span className="font-mono text-gold">{progress}%</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground/50 text-center">
                Ne fermez pas cette fenêtre pendant le rendu.
              </p>
            </div>
          )}

          {/* ── Terminé ── */}
          {phase === "done" && (
            <div className="space-y-5 py-2 text-center">
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="w-12 h-12 text-emerald" style={{ filter: "drop-shadow(0 0 12px hsl(var(--emerald)/0.5))" }} />
                <p className="font-semibold">Vidéo prête !</p>
                <p className="text-xs text-muted-foreground/60">{filename}</p>
              </div>

              <button
                onClick={triggerDownload}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald/40"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--emerald)) 0%, hsl(160 70% 55%) 100%)",
                  color:      "white",
                  boxShadow:  "0 4px 20px hsl(var(--emerald)/0.3)",
                }}
              >
                <Download className="w-4 h-4" />
                Télécharger la vidéo MP4
              </button>

              <button
                onClick={onClose}
                className="w-full py-2 rounded-xl text-sm text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          )}

          {/* ── Erreur ── */}
          {phase === "failed" && (
            <div className="space-y-5 py-2 text-center">
              <div className="flex flex-col items-center gap-2">
                <AlertTriangle className="w-10 h-10 text-destructive" />
                <p className="font-semibold text-destructive">Le rendu a échoué</p>
                {error && (
                  <p className="text-xs text-muted-foreground/70 bg-destructive/10 rounded-xl px-4 py-2 max-w-full break-words">
                    {error}
                  </p>
                )}
              </div>
              <button
                onClick={() => { setPhase("confirm"); setError(null); setProgress(0); }}
                className="w-full py-2.5 rounded-xl border border-studio-border text-sm hover:border-gold/30 transition-colors cursor-pointer"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-muted-foreground/60 flex-shrink-0">{label}</span>
      <span className="text-xs text-foreground/90 text-right truncate">{value}</span>
    </div>
  );
}
