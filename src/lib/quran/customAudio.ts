import type { RenderVerse } from "@/types/remotion";

/**
 * Sentinel reciterId pour "l'utilisateur a importé sa propre récitation".
 * N'existe dans aucune liste de récitateurs réels — déclenche naturellement
 * le chemin "pas de timing QuranCDN" de loadChapterData() (estimation par
 * nombre de mots), que l'on recalibre ensuite côté client sur la durée
 * RÉELLE du fichier importé (connue exactement, sans sondage réseau).
 */
export const CUSTOM_RECITER_ID = -1;

export interface CustomAudio {
  url: string;         // URL blob locale (URL.createObjectURL)
  durationMs: number;  // durée réelle exacte du fichier importé
  fileName: string;
}

/**
 * Lit la durée réelle d'un fichier audio local via les métadonnées du
 * navigateur (aucun sondage nécessaire : le fichier est déjà sur la machine).
 */
export function loadCustomAudioFile(file: File): Promise<CustomAudio> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";

    audio.onloadedmetadata = () => {
      const durationMs = Math.round(audio.duration * 1000);
      if (!Number.isFinite(durationMs) || durationMs <= 0) {
        URL.revokeObjectURL(url);
        reject(new Error("Durée audio introuvable — fichier invalide ou corrompu."));
        return;
      }
      resolve({ url, durationMs, fileName: file.name });
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de lire ce fichier. Formats supportés : MP3, WAV, M4A, OGG."));
    };
    audio.src = url;
  });
}

/**
 * Recalibre les durées de versets (estimées par nombre de mots, voir
 * mergeTimings) pour que leur somme corresponde exactement à la durée
 * réelle du fichier importé — même principe que la calibration serveur
 * utilisée pour les récitateurs sans timing QuranCDN (duration.ts), mais
 * sans sondage : on connaît déjà la durée exacte du fichier local.
 */
export function calibrateVersesToRealDuration(
  verses: RenderVerse[],
  realDurationMs: number
): RenderVerse[] {
  const estimatedTotal = verses.reduce((acc, v) => acc + (v._durationMs ?? 5000), 0);
  if (estimatedTotal <= 0) return verses;

  const scale = realDurationMs / estimatedTotal;
  return verses.map((v) => ({ ...v, _durationMs: (v._durationMs ?? 5000) * scale }));
}
