"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Download, X, Loader2, CheckCircle2, AlertTriangle,
  Film, Video,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { RECITERS } from "@/lib/quran/reciters";
import type { QuranCompositionProps, RenderVerse } from "@/types/remotion";
import {
  getCompositionDimensions,
  renderCompositionFrame,
  renderBismillahFrame,
} from "@/lib/render/browserRenderer";
import { BISMILLAH_DURATION_MS } from "@/lib/quran/bismillah";

interface Props {
  onClose: () => void;
}

type Phase = "confirm" | "recording" | "done" | "failed";

export function ExportModal({ onClose }: Props) {
  const config        = useEditorStore((s) => s.config);
  const loadedChapter = useEditorStore((s) => s.loadedChapter);
  const reciter       = RECITERS.find((r) => r.id === config.reciterId);

  const [phase,      setPhase]      = useState<Phase>("confirm");
  const [progress,   setProgress]   = useState(0);
  const [statusText, setStatusText] = useState("");
  const [blob,       setBlob]       = useState<Blob | null>(null);
  const [filename,   setFilename]   = useState("video.webm");
  const [error,      setError]      = useState<string | null>(null);
  // Pending start — true quand l'utilisateur a cliqué mais le canvas n'est pas encore monté
  const [pendingStart, setPendingStart] = useState(false);

  const canvasRef   = useRef<HTMLCanvasElement | null>(null);
  const rafRef      = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const bgVideoRef  = useRef<HTMLVideoElement | null>(null);
  const bgImgRef    = useRef<HTMLImageElement | null>(null);
  const visibilityHandlerRef = useRef<(() => void) | null>(null);

  const durationSec = Math.round((loadedChapter?.totalDurationMs ?? 0) / 1000);
  const verseCount  = loadedChapter?.verseCount ?? 0;

  // Nettoyage à la fermeture
  useEffect(() => () => stopAll(), []);

  // Échap pour fermer — désactivé pendant l'enregistrement actif pour éviter une perte accidentelle
  useEffect(() => {
    if (phase === "recording") return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, onClose]);

  function stopAll() {
    if (rafRef.current)      cancelAnimationFrame(rafRef.current);
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    if (audioRef.current)    { audioRef.current.pause(); audioRef.current.src = ""; }
    if (bgVideoRef.current)  { bgVideoRef.current.pause(); bgVideoRef.current.src = ""; }
    if (visibilityHandlerRef.current) {
      document.removeEventListener("visibilitychange", visibilityHandlerRef.current);
      visibilityHandlerRef.current = null;
    }
  }

  // Déclenché par le bouton : met à jour la phase pour monter le canvas, puis attend useEffect
  function requestRecording() {
    if (!loadedChapter) return;
    setPhase("recording");
    setProgress(0);
    setStatusText("Chargement des ressources…");
    setPendingStart(true);
  }

  // Démarre l'enregistrement une fois que le canvas est monté dans le DOM
  useEffect(() => {
    if (!pendingStart || !canvasRef.current) return;
    setPendingStart(false);
    doStartRecording();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingStart, phase]);

  const doStartRecording = useCallback(async () => {
    if (!loadedChapter || !canvasRef.current) return;

    const inputProps: QuranCompositionProps = {
      ...config,
      verses:          loadedChapter.verses as RenderVerse[],
      chapterAudioUrl: loadedChapter.chapterAudioUrl ?? null,
      surahName:       `${loadedChapter.surah.name_arabic} — ${loadedChapter.surah.name_french}`,
      reciterName:     reciter?.name ?? "",
      totalDurationMs: loadedChapter.totalDurationMs,
      showBismillah:   loadedChapter.showBismillah,
    };

    const { width, height, scale } = getCompositionDimensions(config.aspectRatio, config.resolution);
    const canvas = canvasRef.current;
    canvas.width  = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    // Force le chargement des polices arabes dans le contexte canvas.
    // document.fonts.ready ne suffit pas : les polices Google sont chargées
    // à la demande et peuvent ne pas être disponibles pour le canvas
    // avant un appel explicite à document.fonts.load().
    setStatusText("Chargement des polices…");
    const fs = `${Math.round(config.arabicFontSize * scale)}px`;
    await Promise.allSettled([
      document.fonts.load(`${fs} "Noto Naskh Arabic"`),
      document.fonts.load(`${fs} "Amiri"`),
      document.fonts.load(`${fs} "Scheherazade New"`),
      document.fonts.ready,
    ]);

    // Timestamps de la plage sélectionnée
    const verses       = inputProps.verses;
    const rangeOffsetMs = verses.length > 0 ? (verses[0]._timestampFrom ?? 0) : 0;
    const totalMs      = loadedChapter.totalDurationMs;
    const totalFrames  = Math.ceil(totalMs / 1000 * 30);

    // ── Fond vidéo ─────────────────────────────────────────────────
    const bg = config.background;
    let bgVideoEl: HTMLVideoElement | null = null;
    let bgImgEl:   HTMLImageElement | null = null;

    if ((bg.type === "pexels_video" || bg.type === "upload") && bg.url) {
      setStatusText("Chargement de la vidéo de fond…");
      const vid = document.createElement("video");
      vid.src      = bg.url;
      vid.muted    = true;
      vid.loop     = true;
      vid.crossOrigin = "anonymous";
      vid.preload  = "auto";
      bgVideoEl    = vid;
      bgVideoRef.current = vid;
      await new Promise<void>((res) => {
        vid.oncanplay  = () => res();
        vid.onerror    = () => res(); // fallback si CORS échoue
        vid.load();
      });
    } else if (bg.type === "pexels_image" && bg.url) {
      setStatusText("Chargement de l'image de fond…");
      const img = new Image();
      img.crossOrigin = "anonymous";
      bgImgEl = img;
      bgImgRef.current = img;
      await new Promise<void>((res) => {
        img.onload  = () => res();
        img.onerror = () => res();
        img.src = bg.url!;
      });
    }

    // ── Audio chapitre ─────────────────────────────────────────────
    const audioEl = new Audio();
    audioEl.crossOrigin = "anonymous";
    audioRef.current    = audioEl;

    let audioCtx:  AudioContext | null = null;
    let audioTrack: MediaStreamTrack | null = null;

    if (inputProps.chapterAudioUrl) {
      setStatusText("Chargement de l'audio…");
      audioEl.src = inputProps.chapterAudioUrl;
      audioEl.preload = "auto";
      await new Promise<void>((res) => {
        audioEl.oncanplay  = () => res();
        audioEl.onerror    = () => res();
        audioEl.load();
      });
      audioEl.currentTime = rangeOffsetMs / 1000;

      try {
        audioCtx = new AudioContext();
        const src  = audioCtx.createMediaElementSource(audioEl);
        const dest = audioCtx.createMediaStreamDestination();
        src.connect(dest);
        src.connect(audioCtx.destination); // écoute locale pendant l'enregistrement
        audioTrack = dest.stream.getAudioTracks()[0] ?? null;
      } catch {
        // Pas d'audio Web API : on continue sans audio dans le fichier
      }
    }

    // ── MediaRecorder ──────────────────────────────────────────────
    const canvasStream = canvas.captureStream(30);
    if (audioTrack) canvasStream.addTrack(audioTrack);

    const mimeType =
      MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus" :
      MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus") ? "video/webm;codecs=vp8,opus" :
      MediaRecorder.isTypeSupported("video/webm")                 ? "video/webm" :
      "video/mp4";

    // Les sourates longues récitées par certains récitateurs durent plusieurs
    // heures (ex. Al-Baqarah ~90min+) — à 5 Mbps ça représente plusieurs Go
    // accumulés en mémoire avant l'assemblage final du Blob. On réduit le
    // débit proportionnellement au-delà de 20 minutes pour limiter le risque
    // de saturation mémoire / crash de l'onglet sur les exports très longs.
    const estimatedMinutes  = totalMs / 60000;
    const videoBitsPerSecond = estimatedMinutes > 20
      ? Math.max(2_000_000, Math.round(5_000_000 * (20 / estimatedMinutes)))
      : 5_000_000;

    const recorder = new MediaRecorder(canvasStream, { mimeType, videoBitsPerSecond });
    recorderRef.current = recorder;

    // Échec en cours d'enregistrement — utilisé par onerror et par le chien
    // de garde anti-blocage ci-dessous pour empêcher onstop de produire un
    // fichier "réussi" tronqué après un échec.
    const phaseFailedRef = { current: false };

    function cleanupAndFail(message: string) {
      phaseFailedRef.current = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (recorder.state !== "inactive") recorder.stop();
      audioEl.pause();
      bgVideoEl?.pause();
      setError(message);
      setPhase("failed");
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onerror = () => {
      cleanupAndFail("Le navigateur a interrompu l'enregistrement (mémoire insuffisante ou ressource perdue). Essayez une résolution plus basse ou une plage de versets plus courte.");
    };
    recorder.onstop = () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (phaseFailedRef.current) return;
      const outputBlob = new Blob(chunks, { type: mimeType.split(";")[0] });
      const ext  = mimeType.includes("mp4") ? "mp4" : "webm";
      setBlob(outputBlob);
      setFilename(`NourQuran_${loadedChapter.surah.name_simple}_${config.aspectRatio.replace(":", "x")}.${ext}`);
      setPhase("done");
    };

    recorder.start(500); // un chunk toutes les 500ms
    setStatusText("Enregistrement en cours…");

    // Démarre la vidéo de fond tout de suite (visible dès le préroulé basmala).
    // L'audio démarre seulement après ce préroulé — voir tick().
    bgVideoEl?.play().catch(() => {});

    // ── Boucle de rendu ────────────────────────────────────────────
    // Référence temporelle : audio si disponible, sinon horloge murale
    let wallStart     = performance.now();
    const hasAudio    = !!inputProps.chapterAudioUrl && audioEl.src;
    const bismillahMs = inputProps.showBismillah ? BISMILLAH_DURATION_MS : 0;
    let audioStarted  = false;

    audioEl.onerror = () => {
      cleanupAndFail("La lecture de l'audio a été interrompue (problème réseau). Réessayez — pour les sourates très longues, une connexion stable est nécessaire pendant tout l'enregistrement.");
    };

    // Chien de garde : si l'audio ne progresse plus pendant un long moment
    // alors qu'il n'est ni en pause volontaire ni terminé (flux réseau
    // interrompu sur un fichier audio continu de plusieurs dizaines de Mo),
    // on échoue proprement plutôt que de laisser l'enregistrement bloqué
    // indéfiniment sur la même frame.
    const STALL_TIMEOUT_MS = 20_000;
    let lastAudioTime  = -1;
    let lastProgressAt = performance.now();

    // ── Gestion de la visibilité de l'onglet ────────────────────────
    // Un export dure aussi longtemps que l'audio réel (jusqu'à plusieurs
    // heures pour une longue sourate récitée lentement) — il est irréaliste
    // d'exiger que l'utilisateur garde l'onglet au premier plan en
    // permanence. Sans ceci, mettre l'onglet en arrière-plan suspend
    // requestAnimationFrame mais pas l'audio, ce qui désynchronise
    // irrémédiablement l'enregistrement (frames figées, sauts de contenu).
    // On met donc tout en pause à la mise en arrière-plan et on reprend
    // exactement où l'on s'était arrêté au retour.
    let hiddenAt: number | null = null;
    function handleVisibilityChange() {
      if (document.hidden) {
        hiddenAt = performance.now();
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        audioEl.pause();
        bgVideoEl?.pause();
        if (recorder.state === "recording") recorder.pause();
      } else if (hiddenAt !== null) {
        wallStart += performance.now() - hiddenAt;
        lastProgressAt += performance.now() - hiddenAt;
        hiddenAt = null;
        if (recorder.state === "paused") recorder.resume();
        if (audioStarted) audioEl.play().catch(() => {});
        bgVideoEl?.play().catch(() => {});
        if (audioCtx?.state === "suspended") audioCtx.resume();
        if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    visibilityHandlerRef.current = handleVisibilityChange;

    function tick() {
      if (!canvas) return;

      const wallElapsed = performance.now() - wallStart;

      // ── Phase basmala : préroulé silencieux, l'audio reste en pause ──
      if (wallElapsed < bismillahMs) {
        const pct = Math.min(Math.round(wallElapsed / totalMs * 100), 99);
        setProgress(pct);
        setStatusText(`Enregistrement… ${pct}%`);
        renderBismillahFrame({
          ctx, width, height, scale, props: inputProps,
          bgVideoEl, bgImgEl,
          frame: Math.round(wallElapsed / 1000 * 30), totalFrames,
          progressMs: wallElapsed, durationMs: bismillahMs,
        });
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (!audioStarted) {
        audioStarted = true;
        audioEl.play().catch(() => {});
        if (audioCtx?.state === "suspended") audioCtx.resume();
      }

      // Chien de garde anti-blocage (audio réseau interrompu sans erreur explicite)
      if (hasAudio && !document.hidden) {
        if (audioEl.currentTime !== lastAudioTime) {
          lastAudioTime  = audioEl.currentTime;
          lastProgressAt = performance.now();
        } else if (!audioEl.paused && performance.now() - lastProgressAt > STALL_TIMEOUT_MS) {
          cleanupAndFail("L'audio s'est arrêté de progresser (connexion instable pendant un enregistrement long). Réessayez avec une connexion stable.");
          return;
        }
      }

      const audioElapsed = hasAudio
        ? (audioEl.currentTime * 1000) - rangeOffsetMs
        : wallElapsed - bismillahMs;

      const elapsedMs       = Math.max(0, audioElapsed);
      const absoluteMs      = rangeOffsetMs + elapsedMs;
      const frame            = Math.round(elapsedMs / 1000 * 30);
      const globalElapsedMs = bismillahMs + elapsedMs;
      const pct              = Math.min(Math.round(globalElapsedMs / totalMs * 100), 99);

      setProgress(pct);
      if (pct > 0) setStatusText(`Enregistrement… ${pct}%`);

      renderCompositionFrame({
        ctx, width, height, scale, absoluteMs, props: inputProps,
        bgVideoEl, bgImgEl, frame, totalFrames,
      });

      // Fin de l'enregistrement
      if (globalElapsedMs >= totalMs || (hasAudio && audioEl.ended)) {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        cancelAnimationFrame(rafRef.current!);
        setProgress(100);
        setStatusText("Finalisation…");
        recorder.stop();
        audioEl.pause();
        bgVideoEl?.pause();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [config, loadedChapter, reciter]); // doStartRecording

  function triggerDownload() {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href     = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  // Calcule les dimensions d'affichage du canvas preview (max 200px de large)
  const dims = getCompositionDimensions(config.aspectRatio, config.resolution);
  const previewW = 180;
  const previewH = Math.round(previewW * dims.height / dims.width);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget && phase !== "recording") onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        className="w-full max-w-md rounded-2xl border border-studio-border overflow-hidden shadow-2xl"
        style={{ background: "hsl(var(--studio-panel))" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center">
              <Film className="w-4 h-4 text-gold" />
            </div>
            <div>
              <p id="export-modal-title" className="font-semibold text-sm">Exporter en vidéo</p>
              <p className="text-[11px] text-muted-foreground/60">{config.aspectRatio} · {config.resolution}</p>
            </div>
          </div>
          {phase !== "recording" && (
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="min-w-11 min-h-11 flex items-center justify-center rounded-lg hover:bg-white/8 text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-gold/40 focus:outline-none -mr-1.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* ── Confirmation ────────────────────────────────────── */}
          {phase === "confirm" && (
            <>
              <div className="rounded-xl border border-studio-border bg-studio-surface p-4 space-y-2.5">
                <InfoRow label="Sourate"    value={loadedChapter?.surah.name_french ?? "—"} />
                <InfoRow label="Versets"    value={`${config.fromVerse} → ${config.toVerse} (${verseCount} versets)`} />
                <InfoRow label="Récitateur" value={reciter?.name ?? "—"} />
                <InfoRow label="Durée"      value={`~${durationSec}s`} />
                <InfoRow label="Format"     value={`${config.aspectRatio} · ${config.resolution}`} />
              </div>

              <p className="text-xs text-muted-foreground/60 text-center">
                La vidéo est enregistrée directement dans votre navigateur en temps réel.
                Durée estimée : ~{durationSec}s. Le fichier est téléchargé automatiquement.
              </p>

              <button
                onClick={requestRecording}
                disabled={!loadedChapter}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--gold)) 0%, hsl(43 80% 60%) 100%)",
                  color:      "hsl(var(--studio-bg))",
                  boxShadow:  "0 4px 20px hsl(var(--gold)/0.3)",
                }}
              >
                <Video className="w-4 h-4" />
                Enregistrer la vidéo
              </button>
            </>
          )}

          {/* ── Canvas toujours monté (caché hors enregistrement) ── */}
          <div style={{ display: phase === "recording" ? "block" : "none" }} className="space-y-4">
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                style={{
                  width:        previewW,
                  height:       previewH,
                  borderRadius: 8,
                  border:       "1px solid rgba(255,255,255,0.12)",
                  background:   "#000",
                }}
              />
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <Loader2 className="w-5 h-5 text-gold animate-spin" />
              <p className="text-sm font-medium">{statusText}</p>
            </div>

            {/* Barre de progression */}
            <div className="space-y-1.5">
              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progression de l'enregistrement"
                className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--studio-surface))" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width:     `${progress}%`,
                    background:"linear-gradient(90deg, hsl(var(--gold)) 0%, hsl(43 80% 70%) 100%)",
                    boxShadow: "0 0 8px hsl(var(--gold)/0.5)",
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground/70">
                <span>Rendu navigateur (WebM)</span>
                <span className="font-mono text-gold">{progress}%</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground/80 text-center">
              Ne fermez pas cette fenêtre pendant l&apos;enregistrement.
            </p>
          </div>

          {/* ── Terminé ─────────────────────────────────────────── */}
          {phase === "done" && (
            <div className="space-y-5 py-2 text-center">
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2
                  className="w-12 h-12 text-emerald"
                  style={{ filter: "drop-shadow(0 0 12px hsl(var(--emerald)/0.5))" }}
                />
                <p className="font-semibold">Vidéo prête !</p>
                <p className="text-xs text-muted-foreground/60">{filename}</p>
              </div>

              <button
                onClick={triggerDownload}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--emerald)) 0%, hsl(160 70% 55%) 100%)",
                  color:      "white",
                  boxShadow:  "0 4px 20px hsl(var(--emerald)/0.3)",
                }}
              >
                <Download className="w-4 h-4" />
                Télécharger la vidéo
              </button>

              <button
                onClick={onClose}
                className="w-full py-2 rounded-xl text-sm text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          )}

          {/* ── Erreur ──────────────────────────────────────────── */}
          {phase === "failed" && (
            <div className="space-y-5 py-2 text-center">
              <div className="flex flex-col items-center gap-2">
                <AlertTriangle className="w-10 h-10 text-destructive" />
                <p className="font-semibold text-destructive">L&apos;enregistrement a échoué</p>
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
