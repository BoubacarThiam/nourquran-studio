import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";

interface Props {
  type: "intro" | "outro";
  surahName?: string;
  reciterName?: string;
  durationFrames: number;
}

export const IntroOutro: React.FC<Props> = ({
  type,
  surahName,
  reciterName,
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pour l'intro : fade-in depuis le noir, texte qui apparaît
  // Pour l'outro : fondu vers le noir
  const progress = type === "intro"
    ? interpolate(frame, [0, durationFrames * 0.6], [0, 1], { extrapolateRight: "clamp" })
    : interpolate(frame, [0, durationFrames], [1, 0], { extrapolateRight: "clamp" });

  const titleSpring = spring({
    frame: type === "intro" ? frame - fps * 0.3 : 0,
    fps,
    config: { damping: 80, stiffness: 200 },
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 100%)",
        opacity: progress,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
      }}
    >
      {/* Décoration dorée */}
      <div
        style={{
          width: 80,
          height: 2,
          background: "linear-gradient(90deg, transparent, #FABE00, transparent)",
          marginBottom: 16,
          opacity: titleSpring,
        }}
      />

      {surahName && (
        <h1
          style={{
            fontFamily: "sans-serif",
            fontSize: 48,
            fontWeight: 700,
            color: "#FABE00",
            textAlign: "center",
            margin: 0,
            opacity: titleSpring,
            transform: `translateY(${interpolate(titleSpring, [0, 1], [20, 0])}px)`,
            letterSpacing: 2,
          }}
        >
          {surahName}
        </h1>
      )}

      {reciterName && (
        <p
          style={{
            fontFamily: "sans-serif",
            fontSize: 22,
            color: "rgba(255,255,255,0.7)",
            margin: 0,
            opacity: titleSpring,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          {reciterName}
        </p>
      )}

      <div
        style={{
          width: 80,
          height: 2,
          background: "linear-gradient(90deg, transparent, #FABE00, transparent)",
          marginTop: 16,
          opacity: titleSpring,
        }}
      />
    </AbsoluteFill>
  );
};
