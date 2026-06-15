// ─── Types coraniques (alignés sur l'API Quran.com v4) ───────────────────────

export interface Surah {
  id: number;
  revelation_place: "makkah" | "madinah";
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;      // ex. "Al-Fatihah"
  name_arabic: string;      // ex. "الفاتحة"
  name_french: string;      // ex. "L'Ouverture"
  verses_count: number;
  pages: [number, number];
}

export interface WordSegment {
  position: number;         // index du mot dans le verset
  timestamp_from: number;   // ms depuis le début de l'audio global
  timestamp_to: number;
  text_uthmani: string;
  char_type: "word" | "end";
}

export interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;        // ex. "1:1"
  text_uthmani: string;
  translations: Translation[];
  transliteration?: string;
  words: WordSegment[];     // timing mot-à-mot
  audio_url: string;        // URL MP3 du verset (fallback)
}

export interface Translation {
  id: number;
  language_name: string;    // ex. "french"
  resource_name: string;    // ex. "Muhammad Hamidullah"
  text: string;
}

export interface Reciter {
  id: number;               // ID Quran.com
  name: string;
  name_arabic?: string;
  style: string;            // ex. "Murattal"
  audioUrlTemplate: string;
  everyayahId?: number;     // ID everyayah.com de secours
}

// ─── Types de l'éditeur ────────────────────────────────────────────────────

export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:5";
export type Resolution = "1080p" | "720p";
export type ArabicFont = "uthmanic" | "amiri" | "scheherazade";

export interface BackgroundSource {
  type:      "pexels_video" | "pexels_image" | "upload" | "color";
  pexelsId?: string;
  localPath?: string;
  color?:    string;
  url?:      string;
  thumbnail?: string;   // miniature stable pour l'aperçu (pas de CORS)
}

export interface WatermarkConfig {
  enabled: boolean;
  url?: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  opacity: number;   // 0-1
  size: number;      // % de la largeur
}

export interface IntroConfig {
  enabled: boolean;
  durationSec: number;
  showSurahName?: boolean;
  showReciterName?: boolean;
}

export interface OutroConfig {
  enabled: boolean;
  durationSec: number;
  showSurahName?: boolean;
  showReciterName?: boolean;
  callToAction?: string;
}

export interface AmbientSoundConfig {
  enabled: boolean;
  preset: string | null;
  url?: string;
  volume: number;   // 0-1
}

export interface EditorConfig {
  // Contenu
  surahId: number | null;
  fromVerse: number;
  toVerse: number;
  reciterId: number;
  translationIds: number[];          // max 2
  showTransliteration: boolean;

  // Fond
  background: BackgroundSource;
  overlayOpacity: number;            // 0-1
  backgroundBlur: number;            // px
  vignette: boolean;
  vignetteIntensity: number;         // %
  kenBurns: boolean;
  kenBurnsScale: number;             // % zoom final (ex. 110)

  // Texte
  arabicFont: ArabicFont;
  arabicFontSize: number;            // px
  translationFontSize: number;       // px
  textPosition: "top" | "center" | "bottom";
  arabicColor: string;               // hex
  highlightColor: string;            // hex couleur mot actif

  // Transitions
  verseTransition: "fade" | "slide" | "none";
  pauseBetweenVerses: number;        // ms

  // Audio
  reciterVolume: number;             // 0-1
  ambientSound: AmbientSoundConfig;

  // Format
  aspectRatio: AspectRatio;
  resolution: Resolution;

  // Branding
  watermark: WatermarkConfig;
  intro: IntroConfig;
  outro: OutroConfig;
}

export interface RenderJob {
  id: string;
  projectId?: string;
  config: EditorConfig;
  status: "pending" | "rendering" | "done" | "failed";
  progress: number;
  outputPath?: string;
  errorMsg?: string;
}
