import type { Reciter } from "@/types/quran";

export const RECITERS: Reciter[] = [
  // ── Récitateurs avec timings QuranCDN (karaoké mot-à-mot) ─────────────────
  {
    id: 97,
    name: "Yasser Ad-Dussary",
    name_arabic: "ياسر الدوسري",
    style: "Murattal",
    audioUrlTemplate: "https://download.quranicaudio.com/qdc/yasser_ad-dussary/murattal/{chapter_id}.mp3",
    everyayahId: 137,
  },
  {
    id: 7,
    name: "Mishary Rashid Alafasy",
    name_arabic: "مشاري راشد العفاسي",
    style: "Murattal",
    audioUrlTemplate: "https://download.quranicaudio.com/qdc/mishaari_raashid_al_3afaasee/murattal/{chapter_id}.mp3",
    everyayahId: 12,
  },
  {
    id: 3,
    name: "Abdur-Rahman As-Sudais",
    name_arabic: "عبد الرحمن السديس",
    style: "Murattal",
    audioUrlTemplate: "https://download.quranicaudio.com/qdc/abdurrahmaan_as-sudays/murattal/{chapter_id}.mp3",
    everyayahId: 6,
  },
  {
    id: 2,
    name: "Abdul Basit Abdus Samad",
    name_arabic: "عبد الباسط عبد الصمد",
    style: "Murattal",
    audioUrlTemplate: "https://download.quranicaudio.com/qdc/abdul_baset/murattal/{chapter_id}.mp3",
    everyayahId: 1,
  },
  {
    id: 10,
    name: "Sa'ud Ash-Shuraim",
    name_arabic: "سعود الشريم",
    style: "Murattal",
    audioUrlTemplate: "https://download.quranicaudio.com/qdc/saud_ash-shuraym/murattal/{chapter_id}.mp3",
    everyayahId: 11,
  },
  {
    id: 4,
    name: "Abu Bakr Al-Shatri",
    name_arabic: "أبو بكر الشاطري",
    style: "Murattal",
    audioUrlTemplate: "https://download.quranicaudio.com/qdc/abu_bakr_shatri/murattal/{chapter_id}.mp3",
    everyayahId: 4,
  },
  {
    id: 5,
    name: "Hani Ar-Rifai",
    name_arabic: "هاني الرفاعي",
    style: "Murattal",
    audioUrlTemplate: "https://download.quranicaudio.com/qdc/hani_ar_rifai/murattal/{chapter_id}.mp3",
    everyayahId: 5,
  },
  {
    id: 6,
    name: "Mahmoud Khalil Al-Husary",
    name_arabic: "محمود خليل الحصري",
    style: "Murattal",
    audioUrlTemplate: "https://download.quranicaudio.com/qdc/khalil_al_husary/murattal/{chapter_id}.mp3",
    everyayahId: 6,
  },
  {
    id: 9,
    name: "Mohamed Siddiq Al-Minshawi",
    name_arabic: "محمد صديق المنشاوي",
    style: "Murattal",
    audioUrlTemplate: "https://download.quranicaudio.com/qdc/siddiq_minshawi/murattal/{chapter_id}.mp3",
    everyayahId: 9,
  },

  // ── Récitateurs sans timing QuranCDN (audio chapitre via mp3quran.net) ────
  {
    id: 0,
    name: "Muhammad Al-Luhaidan",
    name_arabic: "محمد اللحيدان",
    style: "Murattal",
    audioUrlTemplate: "https://server8.mp3quran.net/lhdan/{chapter}.mp3",
    // Pas de récitation par verset chez everyayah.com pour ce récitateur
    // (vérifié : aucune entrée dans son catalogue) → pas de fallback possible.
    everyayahId: 0,
  },
  {
    id: 209,
    name: "Maher Al-Muaiqly",
    name_arabic: "ماهر المعيقلي",
    style: "Murattal",
    audioUrlTemplate: "https://server12.mp3quran.net/maher/{chapter}.mp3",
    everyayahId: 209,
  },
  {
    id: 201,
    name: "Nasser Al-Qatami",
    name_arabic: "ناصر القطامي",
    style: "Murattal",
    audioUrlTemplate: "https://server6.mp3quran.net/qtm/{chapter}.mp3",
    everyayahId: 201,
  },
  {
    id: 202,
    name: "Abdullah Basfar",
    name_arabic: "عبد الله بصفر",
    style: "Murattal",
    audioUrlTemplate: "https://server7.mp3quran.net/basit/{chapter}.mp3",
    everyayahId: 202,
  },
];

/** Récitateurs avec support complet des timings mot-à-mot (via QuranCDN) */
export const RECITERS_WITH_TIMING = new Set([7, 2, 3, 4, 5, 6, 9, 10, 97]);

export function getReciter(id: number): Reciter | undefined {
  return RECITERS.find((r) => r.id === id);
}

/**
 * Construit l'URL audio du chapitre complet pour un récitateur.
 */
export function buildChapterAudioUrl(reciterId: number, chapterId: number): string | null {
  const reciter = getReciter(reciterId);
  if (!reciter) return null;
  const padded = String(chapterId).padStart(3, "0");
  return reciter.audioUrlTemplate
    .replace("{chapter}",         padded)
    .replace("{chapter_padded}",  padded)
    .replace("{chapter_id}",      String(chapterId));
}

/**
 * Construit l'URL audio par verset (everyayah.com) — fallback.
 */
export function buildVerseAudioUrl(
  everyayahId: number,
  chapterId:   number,
  verseNumber: number,
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
  209: "MaherAlMuaiqly128kbps",
  201: "Nasser_Alqatami_128kbps",
  202: "Abdullah_Basfar_192kbps",
  4:   "Abu_Bakr_Ash-Shaatree_128kbps",
  5:   "Hani_Rifai_192kbps",
  9:   "Siddiq_Al-Minshawi_128kbps",
};

function everyayahSlugById(id: number): string {
  return EVERYAYAH_SLUGS[id] ?? `unknown_${id}`;
}
