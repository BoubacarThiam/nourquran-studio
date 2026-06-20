import type { Verse, WordSegment } from "@/types/quran";
import { quranCdnGet } from "./client";
import { RECITERS_WITH_TIMING, buildVerseAudioUrl, getReciter } from "./reciters";

/** Un segment tel que retourné par QuranCDN: [wordIndex, startMs, endMs] */
type RawSegment = [number, number, number];

interface VerseTiming {
  verse_key: string;
  timestamp_from: number;
  timestamp_to: number;
  duration: number;
  segments: RawSegment[];
}

interface AudioFile {
  audio_url: string;
  duration: number;
  verse_timings: VerseTiming[];
}

interface QuranCdnAudioResponse {
  audio_files: AudioFile[];
}

export interface ChapterAudioData {
  audioUrl: string;
  durationMs: number;
  verseTimings: Map<string, VerseTiming>;
}

/**
 * Récupère l'audio du chapitre complet + timings mot-à-mot depuis QuranCDN.
 * Disponible uniquement pour les récitateurs dans RECITERS_WITH_TIMING.
 */
export async function fetchChapterAudio(
  reciterId: number,
  chapterId: number
): Promise<ChapterAudioData | null> {
  if (!RECITERS_WITH_TIMING.has(reciterId)) return null;

  try {
    const data = await quranCdnGet<QuranCdnAudioResponse>(
      `/audio/reciters/${reciterId}/audio_files`,
      { chapter_number: chapterId, segments: "true" }
    );

    if (!data.audio_files?.length) return null;

    const file = data.audio_files[0];
    const timings = new Map<string, VerseTiming>();
    for (const vt of file.verse_timings) {
      timings.set(vt.verse_key, vt);
    }

    return {
      audioUrl: file.audio_url,
      durationMs: file.duration,
      verseTimings: timings,
    };
  } catch {
    return null;
  }
}

/**
 * Injecte les timings QuranCDN dans les versets Quran.com.
 * Mute les timestamps des mots et l'URL audio du chapitre.
 * Pour les récitateurs sans timing, on distribue les timestamps proportionnellement.
 */
export function mergeTimings(
  verses: Verse[],
  chapterAudio: ChapterAudioData | null,
  reciterId: number,
  chapterId: number,
  calibratedWordMs?: number
): Verse[] {
  const reciter = getReciter(reciterId);
  const wordMs = calibratedWordMs ?? 420;

  return verses.map((verse) => {
    const vt = chapterAudio?.verseTimings.get(verse.verse_key);

    // Le dernier élément retourné par Quran.com est souvent le numéro de verset (١٢٣...)
    // qui n'a pas de segment QuranCDN et ne doit pas être mis en surbrillance.

    let words: WordSegment[];

    if (vt && vt.segments.length > 0) {
      // Cas nominal : on a des segments QuranCDN — on mappe par position
      words = verse.words.map((w) => {
        const seg = vt.segments.find((s) => s[0] === w.position) as RawSegment | undefined;
        if (!seg) return w; // numéro de verset ou autre marqueur → pas de timing
        return { ...w, timestamp_from: seg[1], timestamp_to: seg[2] };
      });
    } else if (vt) {
      // Timing de verset disponible mais pas de segments → distribution uniforme
      // On exclut le dernier mot s'il ressemble à un numéro de verset (arabe-indic)
      const realWords = verse.words.filter((w) => !isVerseMarker(w.text_uthmani));
      words = [
        ...distributeTimings(realWords, vt.timestamp_from, vt.timestamp_to),
        ...verse.words.filter((w) => isVerseMarker(w.text_uthmani)),
      ];
    } else {
      // Aucun timing disponible → estimation par nombre de mots, calibrée sur
      // la durée RÉELLE de l'audio chapitre de ce récitateur quand on l'a
      // (voir duration.ts) — sinon repli sur ~420ms/mot (rythme murattal moyen).
      const realWords = verse.words.filter((w) => !isVerseMarker(w.text_uthmani));
      const estimatedMs = Math.max(2500, realWords.length * wordMs);
      words = [
        ...distributeTimings(realWords, 0, estimatedMs),
        ...verse.words.filter((w) => isVerseMarker(w.text_uthmani)),
      ];
    }

    // URL audio : chapitre complet si disponible, sinon verset individuel (everyayah)
    const audio_url =
      chapterAudio?.audioUrl ??
      (reciter?.everyayahId
        ? buildVerseAudioUrl(reciter.everyayahId, chapterId, verse.verse_number)
        : "");

    const realWords2 = verse.words.filter((w) => !isVerseMarker(w.text_uthmani));
    const estimatedMs = Math.max(2500, realWords2.length * wordMs);

    return {
      ...verse,
      words,
      audio_url,
      // Métadonnées timing injectées pour la composition Remotion
      _timestampFrom: vt?.timestamp_from ?? 0,
      _timestampTo:   vt?.timestamp_to   ?? 0,
      _durationMs:    vt?.duration        ?? estimatedMs,
      _chapterAudio:  !!chapterAudio,
    } as Verse;
  });
}

/**
 * Distribue uniformément les timestamps sur un tableau de mots réels.
 * N'est appelé que pour les mots déjà filtrés (sans marqueurs de verset).
 */
function distributeTimings(
  words: WordSegment[],
  startMs: number,
  endMs: number
): WordSegment[] {
  if (words.length === 0) return words;

  const duration = endMs - startMs;
  const wordDuration = duration / words.length;

  return words.map((w, i) => ({
    ...w,
    timestamp_from: Math.round(startMs + i * wordDuration),
    timestamp_to:   Math.round(startMs + (i + 1) * wordDuration),
  }));
}

/**
 * Détecte si un token Quran.com est un marqueur de fin de verset
 * (chiffres arabes-indic ٠-٩ ou signes de verset ﴾﴿).
 */
export function isVerseMarker(text: string): boolean {
  return /^[۰-۹٠-٩﴾﴿\s]+$/.test(text.trim());
}
