import React from "react";
import { Composition } from "remotion";
import { QuranVideoComposition } from "./compositions/QuranVideoComposition";
import type { QuranCompositionProps } from "@/types/remotion";
import type { EditorConfig } from "@/types/quran";

// Remotion's Composition component requires a LooseComponentType which expects
// Record<string,unknown> — we cast to bypass the structural mismatch at registration time.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const QuranComp = QuranVideoComposition as React.ComponentType<any>;

const baseConfig: EditorConfig = {
  surahId:              1,
  fromVerse:            1,
  toVerse:              7,
  reciterId:            97,
  translationIds:       [136],
  showTransliteration:  false,
  background:           { type: "color", color: "#0d1117" },
  overlayOpacity:       0.55,
  backgroundBlur:       0,
  vignette:             true,
  vignetteIntensity:    40,
  kenBurns:             false,
  kenBurnsScale:        110,
  arabicFont:           "uthmanic",
  arabicFontSize:       64,
  translationFontSize:  16,
  textPosition:         "bottom",
  arabicColor:          "#ffffff",
  highlightColor:       "#fabe00",
  verseTransition:      "fade",
  pauseBetweenVerses:   1000,
  reciterVolume:        1,
  ambientSound:         { enabled: false, preset: null, volume: 0.2 },
  aspectRatio:          "9:16",
  resolution:           "1080p",
  watermark:            { enabled: false, position: "bottom-right", opacity: 0.8, size: 12 },
  intro:                { enabled: false, durationSec: 3, showSurahName: true, showReciterName: true },
  outro:                { enabled: false, durationSec: 5, showSurahName: true, showReciterName: true, callToAction: "" },
};

const defaultProps: QuranCompositionProps = {
  ...baseConfig,
  verses:          [],
  chapterAudioUrl: null,
  surahName:       "Al-Fatihah",
  reciterName:     "Yasser Al-Dosari",
  totalDurationMs: 47000,
  showBismillah:   false,
};

export const Root: React.FC = () => (
  <>
    <Composition
      id="QuranVideo-9-16"
      component={QuranComp}
      durationInFrames={Math.ceil(47000 / 1000 * 30)}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
    />
    <Composition
      id="QuranVideo-16-9"
      component={QuranComp}
      durationInFrames={Math.ceil(47000 / 1000 * 30)}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ ...defaultProps, aspectRatio: "16:9" }}
    />
    <Composition
      id="QuranVideo-1-1"
      component={QuranComp}
      durationInFrames={Math.ceil(47000 / 1000 * 30)}
      fps={30}
      width={1080}
      height={1080}
      defaultProps={{ ...defaultProps, aspectRatio: "1:1" }}
    />
    <Composition
      id="QuranVideo-4-5"
      component={QuranComp}
      durationInFrames={Math.ceil(47000 / 1000 * 30)}
      fps={30}
      width={1080}
      height={1350}
      defaultProps={{ ...defaultProps, aspectRatio: "4:5" }}
    />
  </>
);
