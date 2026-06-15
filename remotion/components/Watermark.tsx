import React from "react";
import { AbsoluteFill, Img } from "remotion";
import type { WatermarkConfig } from "@/types/quran";

interface Props {
  config: WatermarkConfig;
}

const positionStyles: Record<string, React.CSSProperties> = {
  "top-left":     { top: "3%", left: "3%" },
  "top-right":    { top: "3%", right: "3%" },
  "bottom-left":  { bottom: "3%", left: "3%" },
  "bottom-right": { bottom: "3%", right: "3%" },
};

export const Watermark: React.FC<Props> = ({ config }) => {
  if (!config.enabled || !config.url) return null;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...positionStyles[config.position] }}>
        <Img
          src={config.url}
          style={{
            width: `${config.size}vw`,
            opacity: config.opacity,
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
          }}
          alt="watermark"
        />
      </div>
    </AbsoluteFill>
  );
};
