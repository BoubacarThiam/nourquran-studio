import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { EditorConfig } from "@/types/quran";
import type { RenderVerse } from "@/types/remotion";
import { KaraokeText } from "./KaraokeText";

interface Props {
  verse: RenderVerse;
  config: EditorConfig;
  /** Timestamp de début du verset dans l'audio du chapitre (ms globaux) */
  globalOffsetMs: number;
}

const FONT_FAMILY_MAP: Record<string, string> = {
  uthmanic:     '"Noto Naskh Arabic", "Amiri", serif',
  amiri:        '"Amiri", serif',
  scheherazade: '"Scheherazade New", "Amiri", serif',
};

export const VerseDisplay: React.FC<Props> = ({ verse, config, globalOffsetMs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Temps global écoulé (relatif au début du chapitre, pas de la Sequence)
  // car les timestamps des mots sont globaux.
  const elapsedMs = (frame / fps) * 1000 + globalOffsetMs;

  const fontFamily = FONT_FAMILY_MAP[config.arabicFont] ?? FONT_FAMILY_MAP.uthmanic;

  // Fade-in du verset (12 frames = ~400ms)
  const fadeIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  // Fade-out en fin de séquence (dernier ~400ms)
  // Note : durationInFrames n'est pas accessible ici directement, mais useVideoConfig() donne la durée parente
  const { durationInFrames } = useVideoConfig();
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity = Math.min(fadeIn, fadeOut);

  // Traductions à afficher
  const [primaryTrans, secondaryTrans] = verse.translations;
  const secondaryText =
    secondaryTrans?.text ??
    (config.showTransliteration ? verse.transliteration : undefined);

  const justifyContent =
    config.textPosition === "top"    ? "flex-start" :
    config.textPosition === "bottom" ? "flex-end"   : "center";

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent,
        padding: "8% 8%",
        gap: 24,
        opacity,
      }}
    >
      {/* Numéro de verset */}
      <div
        style={{
          fontFamily: "sans-serif",
          fontSize: 16,
          color: "rgba(250,189,0,0.65)",
          letterSpacing: 6,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        ﴾ {verse.verse_key} ﴿
      </div>

      {/* Texte arabe avec karaoké */}
      <KaraokeText
        words={verse.words}
        elapsedMs={elapsedMs}
        fontFamily={fontFamily}
        fontSize={config.arabicFontSize}
        arabicColor={config.arabicColor}
        highlightColor={config.highlightColor}
      />

      {/* Séparateur */}
      <div
        style={{
          width: 60,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(250,189,0,0.4), transparent)",
        }}
      />

      {/* Traduction principale */}
      {primaryTrans?.text && (
        <p
          style={{
            fontFamily: '"Inter", "Helvetica", sans-serif',
            fontSize: config.translationFontSize,
            color: "rgba(255,255,255,0.88)",
            textAlign: "center",
            lineHeight: 1.75,
            maxWidth: "78%",
            margin: 0,
          }}
        >
          {primaryTrans.text}
        </p>
      )}

      {/* Traduction secondaire / translittération */}
      {secondaryText && (
        <p
          style={{
            fontFamily: '"Inter", "Helvetica", sans-serif',
            fontSize: config.translationFontSize * 0.82,
            color: "rgba(255,255,255,0.5)",
            textAlign: "center",
            fontStyle: "italic",
            maxWidth: "78%",
            margin: 0,
          }}
        >
          {secondaryText}
        </p>
      )}
    </AbsoluteFill>
  );
};
