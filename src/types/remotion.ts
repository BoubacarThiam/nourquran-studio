import type { Verse, EditorConfig } from "./quran";

/** Verset enrichi avec les métadonnées de timing injectées par mergeTimings() */
export interface RenderVerse extends Verse {
  _timestampFrom: number;  // ms depuis le début de l'audio du chapitre
  _timestampTo:   number;
  _durationMs:    number;
  _chapterAudio:  boolean; // true = audio chapitre partagé, false = audio par verset
}

/** Props complètes passées à la composition Remotion */
export interface QuranCompositionProps extends EditorConfig {
  verses:          RenderVerse[];
  chapterAudioUrl: string | null; // null = audio par verset uniquement
  surahName:       string;
  reciterName:     string;
  totalDurationMs: number;
}
