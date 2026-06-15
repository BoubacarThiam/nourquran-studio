import type { Reciter } from "@/types/quran";

export const RECITERS: Reciter[] = [
  {
    id: 7,
    name: "Mishary Rashid Alafasy",
    name_arabic: "مشاري راشد العفاسي",
    style: "Murattal",
    audioUrlTemplate: "https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/{chapter}.mp3",
    everyayahId: 12,
  },
  {
    id: 2,
    name: "Abdul Basit Abdus Samad",
    name_arabic: "عبد الباسط عبد الصمد",
    style: "Murattal",
    // qdc CDN uses non-padded chapter id (1.mp3, not 001.mp3)
    audioUrlTemplate: "https://download.quranicaudio.com/qdc/abdul_baset/murattal/{chapter_id}.mp3",
    everyayahId: 1,
  },
  {
    id: 3,
    name: "Abdur-Rahman As-Sudais",
    name_arabic: "عبد الرحمن السديس",
    style: "Murattal",
    audioUrlTemplate: "https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays/{chapter}.mp3",
    everyayahId: 6,
  },
  {
    id: 10,
    name: "Sa'ud Ash-Shuraim",
    name_arabic: "سعود الشريم",
    style: "Murattal",
    // qdc CDN uses zero-padded 3-digit chapter id for Shuraim
    audioUrlTemplate: "https://download.quranicaudio.com/qdc/saud_ash-shuraym/murattal/{chapter}.mp3",
    everyayahId: 11,
  },
  {
    id: 97,
    name: "Yasser Ad-Dussary",
    name_arabic: "ياسر الدوسري",
    style: "Murattal",
    audioUrlTemplate: "https://download.quranicaudio.com/quran/yasser_ad-dussary/{chapter}.mp3",
    everyayahId: 137,
  },
  {
    id: 0,
    name: "Muhammad Al-Luhaidan",
    name_arabic: "محمد اللحيدان",
    style: "Murattal",
    // Source : mp3quran.net — audio par chapitre complet, format {chapter_3}.mp3
    audioUrlTemplate: "https://server8.mp3quran.net/lhdan/{chapter}.mp3",
    everyayahId: 140,
  },
  {
    id: 9,
    name: "Maher Al-Muaiqly",
    name_arabic: "ماهر المعيقلي",
    style: "Murattal",
    // Source : mp3quran.net — audio par chapitre complet
    audioUrlTemplate: "https://server12.mp3quran.net/maher/{chapter}.mp3",
    everyayahId: 10,
  },
];

/** Récitateurs avec support des timings mot-à-mot (via QuranCDN) */
export const RECITERS_WITH_TIMING = new Set([7, 2, 3, 10, 97]);

export function getReciter(id: number): Reciter | undefined {
  return RECITERS.find((r) => r.id === id);
}

/**
 * Construit l'URL audio du chapitre complet pour un récitateur.
 * Tous les récitateurs ont maintenant un audioUrlTemplate valide.
 */
export function buildChapterAudioUrl(reciterId: number, chapterId: number): string | null {
  const reciter = getReciter(reciterId);
  if (!reciter) return null;
  const padded = String(chapterId).padStart(3, "0");
  return reciter.audioUrlTemplate
    .replace("{chapter}", padded)
    .replace("{chapter_padded}", padded)
    .replace("{chapter_id}", String(chapterId));
}

/**
 * Construit l'URL audio par verset (fallback everyayah.com).
 * Utilisé pour les reciters sans audio de chapitre disponible.
 */
export function buildVerseAudioUrl(
  everyayahId: number,
  chapterId: number,
  verseNumber: number
): string {
  const ch = String(chapterId).padStart(3, "0");
  const vs = String(verseNumber).padStart(3, "0");
  return `https://everyayah.com/data/${everyayahSlugById(everyayahId)}/${ch}${vs}.mp3`;
}

const EVERYAYAH_SLUGS: Record<number, string> = {
  12:  "Alafasy_128kbps",
  1:   "AbdulBaset_64kbps",
  6:   "Abdurrahmaan_As-Sudais_192kbps",
  11:  "Shuraym_64kbps",
  137: "Yasser_Ad-Dussary_128kbps",
  140: "Muhammad_Luhaidan_64kbps",
  10:  "Maher_AlMuaiqly_128kbps",
};

function everyayahSlugById(id: number): string {
  return EVERYAYAH_SLUGS[id] ?? `unknown_${id}`;
}
