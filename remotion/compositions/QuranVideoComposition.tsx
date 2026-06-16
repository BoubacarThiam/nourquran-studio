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
  } = props;

  const { fps, durationInFrames } = useVideoConfig();

  const msToFrames = (ms: number) => Math.round((ms / 1000) * fps);

  const introDurationFrames = intro.enabled ? msToFrames(intro.durationSec * 1000) : 0;
  const outroDurationFrames = outro.enabled ? msToFrames(outro.durationSec * 1000) : 0;

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
      {chapterAudioUrl && (
        rangeOffsetMs > 0 ? (
          // Seek dans l'audio en décalant la Sequence vers le passé.
          // from={-N} fait démarrer le compteur interne à N : l'audio joue
          // depuis le bon timestamp du chapitre dès le frame 0 de la composition.
          <Sequence from={-msToFrames(rangeOffsetMs)}>
            <Audio src={chapterAudioUrl} volume={reciterVolume} />
          </Sequence>
        ) : (
          <Audio src={chapterAudioUrl} volume={reciterVolume} />
        )
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

      {/* ── Versets ─────────────────────────────────────────────────── */}
      {verses.map((verse) => {
        const renderVerse = verse as RenderVerse;

        const fromFrame = renderVerse._chapterAudio
          ? Math.max(0, msToFrames(renderVerse._timestampFrom - rangeOffsetMs)) + introDurationFrames
          : introDurationFrames + verses.slice(0, verses.indexOf(verse)).reduce(
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
