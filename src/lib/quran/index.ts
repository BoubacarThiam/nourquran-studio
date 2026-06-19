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
import { shouldShowBismillah, buildBismillahVerse, BISMILLAH_DURATION_MS } from "./bismillah";
import type { Verse, Surah } from "@/types/quran";

export interface LoadedChapter {
  surah: Surah;
  verses: Verse[];
  verseCount: number;
  /** Préroulé silencieux de la basmala à afficher avant le verset 1 */
  showBismillah: boolean;
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

  let verses = mergeTimings(rawVerses, chapterAudio, reciterId, surahId);
  const verseCount = verses.length;
  const wantsBismillah = shouldShowBismillah(surah, options.from ?? 1);

  // Avec timing QuranCDN réel : aucun segment audio de basmala n'existe dans
  // le fichier (mesuré : le verset 1 démarre pile à 0) → préroulé silencieux
  // séparé (voir QuranVideoComposition / browserRenderer).
  // Sans timing réel (mp3quran.net) : l'audio continu contient réellement la
  // basmala récitée au début → on l'insère comme un verset de plus, pour que
  // les durées estimées de tous les versets restent cohérentes ensuite.
  const showBismillah = wantsBismillah && !!chapterAudio;
  if (wantsBismillah && !chapterAudio) {
    verses = [buildBismillahVerse(surahId, options.translationIds ?? []) as Verse, ...verses];
  }

  type EnrichedVerse = typeof verses[number] & {
    _timestampFrom: number;
    _timestampTo:   number;
    _durationMs:    number;
  };
  const enriched = verses as EnrichedVerse[];

  // Durée de la plage sélectionnée, pas du chapitre entier.
  // Quand on sélectionne un verset partiel, totalDurationMs doit correspondre
  // à la durée réelle de la sélection pour que le player soit à la bonne longueur.
  const totalDurationMs = (() => {
    if (!chapterAudio || enriched.length === 0) {
      return enriched.reduce((acc, v) => acc + (v._durationMs ?? 5000), 0);
    }
    const first = enriched[0];
    const last  = enriched[enriched.length - 1];
    const start = first._timestampFrom ?? 0;
    const end   = (last._timestampTo > 0)
      ? last._timestampTo
      : (last._timestampFrom ?? 0) + (last._durationMs ?? 5000);
    return Math.max(end - start, 1000);
  })() + (showBismillah ? BISMILLAH_DURATION_MS : 0);

  // Pour les reciters sans QuranCDN (Luhaidan, Maher), utiliser le template mp3quran.net
  const chapterAudioUrl = chapterAudio?.audioUrl ?? buildChapterAudioUrl(reciterId, surahId);

  return {
    surah,
    verses,
    verseCount,
    showBismillah,
    chapterAudioUrl,
    totalDurationMs,
  };
}
