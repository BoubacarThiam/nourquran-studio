import type { Surah, Translation, WordSegment } from "@/types/quran";
import type { RenderVerse } from "@/types/remotion";

/**
 * La basmala précède (presque) toutes les sourates à l'oral. On la gère de
 * deux façons différentes selon que le récitateur a un vrai timing chapitre
 * (QuranCDN) ou non :
 *
 *  - Avec timing QuranCDN (Al-Dossari, Alafasy…) : les mesures montrent que
 *    le fichier audio démarre quasi systématiquement pile sur le verset 1
 *    (timestamp_from = 0) — il n'y a donc aucun segment audio réel de
 *    basmala. On l'affiche comme un préroulé silencieux fixe, avant que
 *    l'audio ne démarre (voir `showBismillah` sur LoadedChapter).
 *
 *  - Sans timing QuranCDN (Al-Luhaidan, Maher Al-Muaiqly, Qatami, Basfar —
 *    fichiers chapitre complets mp3quran.net) : ces récitations commencent
 *    réellement par la basmala récitée à voix haute, intégrée à l'audio
 *    continu. On l'insère donc comme un "verset" de plus en tête de liste,
 *    avec une durée estimée comme les autres versets de ces récitateurs —
 *    l'audio joue sans interruption et le reste des versets glisse
 *    naturellement après elle, en restant cohérent du début à la fin.
 */
export const BISMILLAH_ARABIC = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
const BISMILLAH_WORDS = ["بِسْمِ", "اللَّهِ", "الرَّحْمَٰنِ", "الرَّحِيمِ"];

// Durée du préroulé silencieux (récitateurs avec timing QuranCDN réel).
export const BISMILLAH_DURATION_MS = 2600;

// Même formule que pour l'estimation des versets sans timing réel (audio.ts).
const ESTIMATED_WORD_MS = 420;
const ESTIMATED_MIN_MS  = 2500;

export const BISMILLAH_TRANSLATIONS: Record<number, string> = {
  136: "Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux.",
  131: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
  85:  "In the Name of Allah—the Most Compassionate, Most Merciful.",
};

/**
 * true si la basmala doit précéder la vidéo : la sourate la comporte
 * traditionnellement (donc ni Al-Fatihah où elle est déjà le verset 1,
 * ni At-Tawbah qui n'en a pas — encodé par `surah.bismillah_pre`) et
 * l'utilisateur affiche bien depuis le verset 1 (pas une plage partielle).
 */
export function shouldShowBismillah(surah: Surah, fromVerse: number): boolean {
  return surah.bismillah_pre && fromVerse === 1;
}

/**
 * Construit le "verset" synthétique de la basmala à préfixer aux versets
 * réels, pour les récitateurs sans timing QuranCDN dont l'audio continu
 * contient réellement la basmala récitée au tout début.
 */
export function buildBismillahVerse(surahId: number, translationIds: number[]): RenderVerse {
  const durationMs = Math.max(ESTIMATED_MIN_MS, BISMILLAH_WORDS.length * ESTIMATED_WORD_MS);
  const wordMs = durationMs / BISMILLAH_WORDS.length;

  const words: WordSegment[] = BISMILLAH_WORDS.map((text, i) => ({
    position: i + 1,
    timestamp_from: Math.round(i * wordMs),
    timestamp_to:   Math.round((i + 1) * wordMs),
    text_uthmani:   text,
    char_type:      "word" as const,
  }));

  const translations: Translation[] = translationIds
    .map((id) => {
      const text = BISMILLAH_TRANSLATIONS[id];
      return text ? { id, language_name: "", resource_name: "", text } : null;
    })
    .filter((t): t is Translation => t !== null);

  return {
    id: -1,
    verse_number: 0,
    verse_key: `${surahId}:0`,
    text_uthmani: BISMILLAH_ARABIC,
    translations,
    words,
    audio_url: "",
    _timestampFrom: 0,
    _timestampTo:   0,
    _durationMs:    durationMs,
    _chapterAudio:  false,
  };
}
