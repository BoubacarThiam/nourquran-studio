import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { EditorConfig } from "@/types/quran";
import { BISMILLAH_ARABIC, BISMILLAH_TRANSLATIONS } from "@/lib/quran/bismillah";

interface Props {
  config: EditorConfig;
  /** Durée (en frames) de cette séquence — utilisée pour le fondu de sortie local */
  durationFrames: number;
}

const FONT_FAMILY_MAP: Record<string, string> = {
  uthmanic:     '"Noto Naskh Arabic", "Amiri", serif',
  amiri:        '"Amiri", serif',
  scheherazade: '"Scheherazade New", "Amiri", serif',
};

/**
 * Préroulé silencieux affiché avant le verset 1 : la basmala, en grand,
 * sur le fond choisi par l'utilisateur. Pas de karaoké mot-à-mot ici —
 * contrairement aux versets, elle n'est adossée à aucun segment audio réel.
 */
export const BismillahCard: React.FC<Props> = ({ config, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fontFamily = FONT_FAMILY_MAP[config.arabicFont] ?? FONT_FAMILY_MAP.uthmanic;

  const fadeIn  = interpolate(frame, [0, fps * 0.4], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationFrames - fps * 0.4, durationFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);

  const [primaryId, secondaryId] = config.translationIds;
  const primaryText   = primaryId   ? BISMILLAH_TRANSLATIONS[primaryId]   : undefined;
  const secondaryText = secondaryId ? BISMILLAH_TRANSLATIONS[secondaryId] : undefined;

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
      <div
        style={{
          fontFamily,
          fontSize: config.arabicFontSize,
          color: config.arabicColor,
          textAlign: "center",
          direction: "rtl",
          lineHeight: 1.8,
        }}
      >
        {BISMILLAH_ARABIC}
      </div>

      <div
        style={{
          width: 60,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(250,189,0,0.4), transparent)",
        }}
      />

      {primaryText && (
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
          {primaryText}
        </p>
      )}

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
