import type { Verse, Translation } from "@/types/quran";
import { quranGet } from "./client";

// Identifiants des traductions Quran.com
export const TRANSLATION_IDS = {
  FRENCH_HAMIDULLAH: 136,     // Muhammad Hamidullah (traduction de référence en FR)
  ENGLISH_SAHEEH:    131,     // Saheeh International
  ENGLISH_CLEAR:      85,     // The Clear Quran
} as const;

interface QuranWord {
  id: number;
  position: number;
  char_type_name: string;
  text_uthmani: string;
  page_number: number;
  transliteration?: { text: string };
}

interface QuranVerse {
  id: number;
  verse_number: number;
  verse_key: string;
  text_uthmani: string;
  translations?: Array<{ id: number; resource_id: number; text: string }>;
  words: QuranWord[];
}

interface VersesResponse {
  verses: QuranVerse[];
  pagination: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
    total_records: number;
  };
}

/**
 * Récupère les versets d'une sourate avec texte Uthmani, traductions et mots.
 * Les timings (timestamps) sont injectés plus tard via mergeTimings().
 */
export async function fetchVerses(
  surahId: number,
  options: {
    from?: number;
    to?: number;
    translationIds?: number[];
  } = {}
): Promise<Verse[]> {
  const { from = 1, translationIds = [TRANSLATION_IDS.FRENCH_HAMIDULLAH] } = options;

  const allVerses: Verse[] = [];
  let page = 1;

  while (true) {
    const data = await quranGet<VersesResponse>(`/verses/by_chapter/${surahId}`, {
      translations: translationIds.join(","),
      fields:       "text_uthmani",
      word_fields:  "text_uthmani,transliteration,char_type_name",
      words:        "true",
      per_page:     50,
      page,
    });

    const mapped = data.verses
      .filter((v) => v.verse_number >= from)
      .filter((v) => !options.to || v.verse_number <= options.to)
      .map((v) => mapVerse(v));

    allVerses.push(...mapped);

    // Arrêter si on a atteint le verset de fin demandé
    if (options.to && allVerses.some((v) => v.verse_number >= options.to!)) break;
    if (!data.pagination.next_page) break;

    page++;
  }

  return allVerses;
}

/** Récupère un verset unique */
export async function fetchVerse(verseKey: string, translationIds = [TRANSLATION_IDS.FRENCH_HAMIDULLAH]): Promise<Verse> {
  const data = await quranGet<{ verse: QuranVerse }>(`/verses/by_key/${verseKey}`, {
    translations: translationIds.join(","),
    fields:       "text_uthmani",
    word_fields:  "text_uthmani,transliteration,char_type_name",
    words:        "true",
  });
  return mapVerse(data.verse);
}

function mapVerse(v: QuranVerse): Verse {
  // Nettoyer les notes de bas de page HTML des traductions
  const cleanText = (html: string) =>
    html.replace(/<sup[^>]*>.*?<\/sup>/gi, "").trim();

  const translations: Translation[] = (v.translations ?? []).map((t) => ({
    id: t.resource_id,
    language_name: translationLanguage(t.resource_id),
    resource_name: translationAuthor(t.resource_id),
    text: cleanText(t.text),
  }));

  // Translittération extraite du premier mot qui en a une
  const transliteration = v.words
    .filter((w) => w.char_type_name === "word" && w.transliteration?.text)
    .map((w) => w.transliteration!.text)
    .join(" ");

  return {
    id: v.id,
    verse_number: v.verse_number,
    verse_key: v.verse_key,
    text_uthmani: v.text_uthmani,
    translations,
    transliteration: transliteration || undefined,
    // words: seront remplis par mergeTimings() après récupération des segments
    words: v.words.map((w, i) => ({
      position: w.position ?? i + 1,
      timestamp_from: 0,
      timestamp_to: 0,
      text_uthmani: w.text_uthmani,
      char_type: w.char_type_name as "word" | "end",
    })),
    audio_url: "", // sera rempli par buildAudioUrls()
  };
}

const TRANSLATION_META: Record<number, { lang: string; author: string }> = {
  136: { lang: "french",  author: "Muhammad Hamidullah" },
  131: { lang: "english", author: "Saheeh International" },
  85:  { lang: "english", author: "The Clear Quran" },
};

function translationLanguage(id: number): string {
  return TRANSLATION_META[id]?.lang ?? "unknown";
}

function translationAuthor(id: number): string {
  return TRANSLATION_META[id]?.author ?? `Translation ${id}`;
}
