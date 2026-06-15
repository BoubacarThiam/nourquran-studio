import React from "react";
import type { WordSegment } from "@/types/quran";

interface Props {
  words: WordSegment[];
  elapsedMs: number;       // Temps global depuis le début du chapitre (ms)
  fontFamily: string;
  fontSize: number;        // px
  arabicColor?: string;    // couleur texte normal
  highlightColor?: string; // couleur mot actif
}

const DEFAULT_ARABIC    = "rgba(255,255,255,0.92)";
const DEFAULT_HIGHLIGHT = "#FABE00";
const PAST              = "rgba(255,255,255,0.3)";

export const KaraokeText: React.FC<Props> = ({
  words,
  elapsedMs,
  fontFamily,
  fontSize,
  arabicColor    = DEFAULT_ARABIC,
  highlightColor = DEFAULT_HIGHLIGHT,
}) => {
  const fontSizePx = fontSize; // déjà en px

  // Filtrer les marqueurs de verset (timestamp 0 ↔ pas de segment QuranCDN)
  const displayWords = words.filter(
    (w) => w.timestamp_from > 0 || w.timestamp_to > 0 || words.indexOf(w) < words.length - 1
  );

  // Déterminer l'index du mot actif (dernier dont timestamp_from ≤ elapsed)
  const activeIdx = displayWords.reduce((best, w, i) => {
    if (w.timestamp_from <= elapsedMs && w.timestamp_to > elapsedMs) return i;
    return best;
  }, -1);

  return (
    <div
      style={{
        direction: "rtl",
        fontFamily,
        fontSize: fontSizePx,
        lineHeight: 2.3,
        textAlign: "center",
        maxWidth: "92%",
        display: "flex",
        flexWrap: "wrap",
        gap: `0 ${fontSizePx * 0.28}px`,
        justifyContent: "center",
      }}
    >
      {displayWords.map((word, i) => {
        const isActive = i === activeIdx;
        const isPast   = word.timestamp_to > 0 && elapsedMs > word.timestamp_to;

        let color      = arabicColor;
        let textShadow: string | undefined;
        let scale      = "1";

        if (isActive) {
          color      = highlightColor;
          textShadow = `0 0 24px ${highlightColor}66, 0 0 48px ${highlightColor}33`;
          scale      = "1.06";
        } else if (isPast) {
          color = PAST;
        }

        return (
          <span
            key={i}
            style={{
              color,
              textShadow,
              display: "inline-block",
              transform: `scale(${scale})`,
              transformOrigin: "center",
              transition: "color 90ms ease, text-shadow 90ms ease, transform 90ms ease",
            }}
          >
            {word.text_uthmani}
          </span>
        );
      })}
    </div>
  );
};
