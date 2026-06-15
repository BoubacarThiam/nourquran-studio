/**
 * Interface unifiée du service coranique.
 * Point d'entrée unique pour toute la couche données.
 *
 * Architecture :
 *   - Quran.com v4  → texte Uthmani, traductions, mots
 *   - QuranCDN      → audio chapitre + timestamps mot-à-mot (reciters avec timing)
 *   - mp3quran.net  → audio chapitre sans timing (Al-Luhaidan, Maher Al-Muaiqly)
 *   - everyayah.com → audio par verset (fallback ultime)
 */

export { fetchSurahs, fetchSurah } from "./surahs";
export { fetchVerses, fetchVerse, TRANSLATION_IDS } from "./verses";
export { fetchChapterAudio, mergeTimings } from "./audio";
export { RECITERS, RECITERS_WITH_TIMING, getReciter, buildChapterAudioUrl, buildVerseAudioUrl } from "./reciters";

import { fetchSurah } from "./surahs";
import { fetchVerses } from "./verses";
import { fetchChapterAudio, mergeTimings } from "./audio";
import { buildChapterAudioUrl } from "./reciters";
import type { Verse, Surah } from "@/types/quran";

export interface LoadedChapter {
  surah: Surah;
  verses: Verse[];
  chapterAudioUrl: string | null;
  totalDurationMs: number;
}

/**
 * Charge complet d'une plage de versets pour l'éditeur :
 * texte + traductions + timings + URL audio.
 * Retourne tout ce qu'il faut pour alimenter la composition Remotion.
 */
export async function loadChapterData(
  surahId: number,
  reciterId: number,
  options: {
    from?: number;
    to?: number;
    translationIds?: number[];
  } = {}
): Promise<LoadedChapter> {
  const [surah, rawVerses, chapterAudio] = await Promise.all([
    fetchSurah(surahId),
    fetchVerses(surahId, options),
    fetchChapterAudio(reciterId, surahId),
  ]);

  const verses = mergeTimings(rawVerses, chapterAudio, reciterId, surahId);

  const totalDurationMs = chapterAudio?.durationMs
    ?? verses.reduce((acc, v) => acc + (((v as unknown as Record<string, number>)._durationMs) ?? 5000), 0);

  // Pour les reciters sans QuranCDN (Luhaidan, Maher), utiliser le template mp3quran.net
  const chapterAudioUrl = chapterAudio?.audioUrl ?? buildChapterAudioUrl(reciterId, surahId);

  return {
    surah,
    verses,
    chapterAudioUrl,
    totalDurationMs,
  };
}
