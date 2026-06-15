import type { Surah } from "@/types/quran";
import { quranGet } from "./client";

interface QuranChapter {
  id: number;
  revelation_place: "makkah" | "madinah";
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  pages: [number, number];
  translated_name: { language_name: string; name: string };
}

interface ChaptersResponse {
  chapters: QuranChapter[];
}

/** Récupère les 114 sourates avec le nom français via Quran.com */
export async function fetchSurahs(): Promise<Surah[]> {
  const data = await quranGet<ChaptersResponse>("/chapters", { language: "fr" });

  return data.chapters.map((ch) => ({
    id: ch.id,
    revelation_place: ch.revelation_place,
    revelation_order: ch.revelation_order,
    bismillah_pre: ch.bismillah_pre,
    name_simple: ch.name_simple,
    name_arabic: ch.name_arabic,
    name_french: ch.translated_name?.name ?? ch.name_simple,
    verses_count: ch.verses_count,
    pages: ch.pages,
  }));
}

/** Récupère une seule sourate */
export async function fetchSurah(surahId: number): Promise<Surah> {
  const data = await quranGet<{ chapter: QuranChapter }>(`/chapters/${surahId}`, { language: "fr" });
  const ch = data.chapter;

  return {
    id: ch.id,
    revelation_place: ch.revelation_place,
    revelation_order: ch.revelation_order,
    bismillah_pre: ch.bismillah_pre,
    name_simple: ch.name_simple,
    name_arabic: ch.name_arabic,
    name_french: ch.translated_name?.name ?? ch.name_simple,
    verses_count: ch.verses_count,
    pages: ch.pages,
  };
}
