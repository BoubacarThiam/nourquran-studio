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
import { fetchChapterAudio, mergeTimings, isVerseMarker } from "./audio";
import { buildChapterAudioUrl } from "./reciters";
import { shouldShowBismillah, buildBismillahVerse, BISMILLAH_DURATION_MS } from "./bismillah";
import { getCachedChapterDurationMs } from "./duration";
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

  // Récitateurs sans timing QuranCDN réel (Al-Luhaidan, Maher, Qatami,
  // Basfar) : un seul fichier "chapitre entier" existe, sans aucun ancrage
  // temporel par verset. On calibre la durée estimée par mot sur la durée
  // RÉELLE de ce fichier (sondage MP3, voir duration.ts) plutôt qu'une
  // constante générique (~420ms/mot) — sinon le rythme propre à chaque
  // récitateur (Al-Luhaidan récite p. ex. ~2.7x plus lentement que cette
  // moyenne) fait dériver l'affichage des versets de plus en plus loin de
  // l'audio réel au fil de la sourate.
  let calibratedWordMs: number | undefined;
  if (!chapterAudio) {
    const realChapterAudioUrl = buildChapterAudioUrl(reciterId, surahId);
    if (realChapterAudioUrl) {
      const isFullChapter = (options.from ?? 1) === 1 && (!options.to || options.to >= surah.verses_count);
      const wordSource = isFullChapter ? rawVerses : await fetchVerses(surahId, { translationIds: [] });
      const totalWords = countRealWords(wordSource);
      const realDurationMs = await getCachedChapterDurationMs(realChapterAudioUrl);
      if (realDurationMs && totalWords > 0) {
        calibratedWordMs = realDurationMs / totalWords;
      }
    }
  }

  let verses = mergeTimings(rawVerses, chapterAudio, reciterId, surahId, calibratedWordMs);
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
    verses = [buildBismillahVerse(surahId, options.translationIds ?? [], calibratedWordMs) as Verse, ...verses];
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

/** Compte les mots réels (hors marqueurs de fin de verset) d'une liste de versets. */
function countRealWords(verses: Verse[]): number {
  return verses.reduce(
    (acc, v) => acc + v.words.filter((w) => !isVerseMarker(w.text_uthmani)).length,
    0
  );
}
