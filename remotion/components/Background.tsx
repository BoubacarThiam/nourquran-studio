import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import type { BackgroundSource } from "@/types/quran";

interface Props {
  source: BackgroundSource;
  kenBurns: boolean;
  kenBurnsScale?: number;   // % zoom final (ex. 110 = 1.10×), défaut 108
  overlayOpacity: number;
  blur: number;
  vignette: boolean;
}

export const Background: React.FC<Props> = ({
  source,
  kenBurns,
  kenBurnsScale = 108,
  overlayOpacity,
  blur,
  vignette,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const finalScale = kenBurnsScale / 100;
  const scale = kenBurns
    ? interpolate(frame, [0, durationInFrames], [1, finalScale])
    : 1;
  const translateX = kenBurns
    ? interpolate(frame, [0, durationInFrames], [0, -2])
    : 0;

  const mediaStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: `scale(${scale}) translateX(${translateX}%)`,
    filter: blur > 0 ? `blur(${blur}px)` : undefined,
  };

  const renderMedia = () => {
    if (source.type === "pexels_video" || source.type === "upload") {
      if (!source.url && !source.localPath) return null;
      return (
        <OffthreadVideo
          src={(source.localPath ?? source.url)!}
          style={mediaStyle}
          muted
        />
      );
    }
    if (source.type === "pexels_image") {
      if (!source.url && !source.localPath) return null;
      return (
        <Img
          src={(source.localPath ?? source.url)!}
          style={mediaStyle}
          alt=""
        />
      );
    }
    // Couleur unie
    return (
      <AbsoluteFill style={{ backgroundColor: source.color ?? "#0d1117" }} />
    );
  };

  return (
    <AbsoluteFill>
      {renderMedia()}

      {/* Overlay sombre pour lisibilité */}
      <AbsoluteFill
        style={{
          backgroundColor: `rgba(0,0,0,${overlayOpacity})`,
        }}
      />

      {/* Vignette */}
      {vignette && (
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
