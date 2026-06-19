import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useVideoConfig,
} from "remotion";
import type { QuranCompositionProps, RenderVerse } from "@/types/remotion";
import { Background } from "../components/Background";
import { VerseDisplay } from "../components/VerseDisplay";
import { Watermark } from "../components/Watermark";
import { IntroOutro } from "../components/IntroOutro";
import { BismillahCard } from "../components/BismillahCard";
import { BISMILLAH_DURATION_MS } from "@/lib/quran/bismillah";

export const QuranVideoComposition: React.FC<QuranCompositionProps> = (props) => {
  const {
    verses = [],
    chapterAudioUrl,
    surahName = "",
    reciterName = "",
    background,
    overlayOpacity,
    backgroundBlur,
    vignette,
    kenBurns,
    kenBurnsScale,
    watermark,
    intro,
    outro,
    reciterVolume,
    ambientSound,
    showBismillah,
  } = props;

  const { fps, durationInFrames } = useVideoConfig();

  const msToFrames = (ms: number) => Math.round((ms / 1000) * fps);

  const introDurationFrames = intro.enabled ? msToFrames(intro.durationSec * 1000) : 0;
  const outroDurationFrames = outro.enabled ? msToFrames(outro.durationSec * 1000) : 0;

  // Préroulé silencieux de la basmala : décale uniformément les versets et le
  // début de l'audio du chapitre, comme un mini-intro automatique. Les fichiers
  // audio QuranCDN démarrent quasi systématiquement pile sur le verset 1, sans
  // segment basmala réel sur lequel se caler — on l'affiche donc hors-audio.
  const bismillahDurationFrames = showBismillah ? msToFrames(BISMILLAH_DURATION_MS) : 0;
  const preRollFrames = introDurationFrames + bismillahDurationFrames;

  // Offset absolu du premier verset dans l'audio du chapitre.
  // Permet de repositionner les versets à 0 quand l'utilisateur ne sélectionne
  // qu'une plage (ex : verset 255 de la Baqarah ne doit pas apparaître à 1h47).
  const firstVerse = verses[0] as RenderVerse | undefined;
  const rangeOffsetMs = firstVerse?._chapterAudio ? (firstVerse._timestampFrom ?? 0) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* ── Fond (vidéo / image / couleur) ──────────────────────────── */}
      <Background
        source={background}
        kenBurns={kenBurns}
        kenBurnsScale={kenBurnsScale}
        overlayOpacity={overlayOpacity}
        blur={backgroundBlur}
        vignette={vignette}
      />

      {/* ── Audio chapitre complet ───────────────────────────────────── */}
      {/* Décalé de preRollFrames (intro + basmala) pour que la récitation ne
          démarre qu'une fois le préroulé silencieux terminé. */}
      {chapterAudioUrl && (
        <Sequence from={preRollFrames - msToFrames(rangeOffsetMs)}>
          <Audio src={chapterAudioUrl} volume={reciterVolume} />
        </Sequence>
      )}

      {/* ── Son ambiant ─────────────────────────────────────────────── */}
      {ambientSound?.enabled && ambientSound.url && (
        <Audio src={ambientSound.url} volume={ambientSound.volume ?? 0.2} loop />
      )}

      {/* ── Intro ───────────────────────────────────────────────────── */}
      {intro.enabled && (
        <Sequence from={0} durationInFrames={introDurationFrames}>
          <IntroOutro
            type="intro"
            surahName={intro.showSurahName ? surahName : undefined}
            reciterName={intro.showReciterName ? reciterName : undefined}
            durationFrames={introDurationFrames}
          />
        </Sequence>
      )}

      {/* ── Basmala (préroulé silencieux, avant le verset 1) ──────────── */}
      {showBismillah && (
        <Sequence from={introDurationFrames} durationInFrames={bismillahDurationFrames}>
          <BismillahCard config={props} durationFrames={bismillahDurationFrames} />
        </Sequence>
      )}

      {/* ── Versets ─────────────────────────────────────────────────── */}
      {verses.map((verse) => {
        const renderVerse = verse as RenderVerse;

        const fromFrame = renderVerse._chapterAudio
          ? Math.max(0, msToFrames(renderVerse._timestampFrom - rangeOffsetMs)) + preRollFrames
          : preRollFrames + verses.slice(0, verses.indexOf(verse)).reduce(
              (acc, v) => acc + msToFrames((v as RenderVerse)._durationMs ?? 5000),
              0
            );

        const durationFrames = msToFrames(
          renderVerse._durationMs > 0 ? renderVerse._durationMs : 5000
        );

        return (
          <Sequence
            key={verse.verse_key}
            from={fromFrame}
            durationInFrames={durationFrames}
          >
            {!chapterAudioUrl && verse.audio_url && (
              <Audio src={verse.audio_url} volume={reciterVolume} />
            )}
            <VerseDisplay
              verse={renderVerse}
              config={props}
              globalOffsetMs={renderVerse._timestampFrom}
            />
          </Sequence>
        );
      })}

      {/* ── Watermark ───────────────────────────────────────────────── */}
      {watermark.enabled && watermark.url && (
        <Watermark config={watermark} />
      )}

      {/* ── Outro ───────────────────────────────────────────────────── */}
      {outro.enabled && (
        <Sequence
          from={durationInFrames - outroDurationFrames}
          durationInFrames={outroDurationFrames}
        >
          <IntroOutro
            type="outro"
            surahName={outro.showSurahName ? surahName : undefined}
            reciterName={outro.showReciterName ? reciterName : undefined}
            durationFrames={outroDurationFrames}
          />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
