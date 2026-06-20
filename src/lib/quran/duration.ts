import { unstable_cache } from "next/cache";

/**
 * Pour les récitateurs sans timing QuranCDN (Al-Luhaidan, Maher Al-Muaiqly,
 * Qatami, Basfar), le seul audio disponible est un fichier "chapitre entier"
 * mp3quran.net sans aucun ancrage temporel par verset. Pour caler la durée
 * estimée de chaque verset sur le rythme RÉEL de ce récitateur (et non une
 * moyenne générique ~420ms/mot), on a besoin de la durée réelle du fichier.
 *
 * On l'obtient sans télécharger le fichier entier : ces flux sont encodés en
 * CBR (débit binaire constant) — il suffit de lire l'en-tête du premier frame
 * MPEG (quelques centaines de Ko avec un Range request) pour connaître le
 * débit, puis combiner avec la taille totale (Content-Range) pour extrapoler
 * la durée. Mesuré et vérifié sur Al-Luhaidan (128 kbps) et Qatami (96 kbps).
 */

const BITRATE_KBPS_V1_L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
const BITRATE_KBPS_V2_L3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0];
const SAMPLE_RATE_V1  = [44100, 48000, 32000, 0];
const SAMPLE_RATE_V2  = [22050, 24000, 16000, 0];
const SAMPLE_RATE_V25 = [11025, 12000, 8000, 0];

interface MpegFrame {
  bitrateBps: number;
  /** Position juste après ce frame, i.e. où chercher le frame suivant. */
  nextOffset: number;
}

function parseFrameHeader(buf: Buffer, offset: number): MpegFrame | null {
  if (offset + 4 > buf.length) return null;
  if (buf[offset] !== 0xff || (buf[offset + 1] & 0xe0) !== 0xe0) return null;

  const b1 = buf[offset + 1];
  const b2 = buf[offset + 2];

  const versionBits = (b1 >> 3) & 0x03; // 00=MPEG2.5, 10=MPEG2, 11=MPEG1
  const layerBits    = (b1 >> 1) & 0x03; // 01=Layer III
  if (layerBits !== 0x01) return null;

  const bitrateIndex    = (b2 >> 4) & 0x0f;
  const sampleRateIndex = (b2 >> 2) & 0x03;
  const padding         = (b2 >> 1) & 0x01;
  if (bitrateIndex === 0 || bitrateIndex === 0x0f) return null; // free/reserved
  if (sampleRateIndex === 0x03) return null; // reserved

  const isV1 = versionBits === 0x03;
  const bitrateKbps = (isV1 ? BITRATE_KBPS_V1_L3 : BITRATE_KBPS_V2_L3)[bitrateIndex];
  const sampleRate  = (isV1 ? SAMPLE_RATE_V1 : versionBits === 0x02 ? SAMPLE_RATE_V2 : SAMPLE_RATE_V25)[sampleRateIndex];
  if (!bitrateKbps || !sampleRate) return null;

  const samplesPerFrame = isV1 ? 1152 : 576;
  const bitrateBps = bitrateKbps * 1000;
  const frameSizeBytes = Math.floor(((samplesPerFrame / 8) * bitrateBps) / sampleRate) + padding;
  if (frameSizeBytes <= 0) return null;

  return { bitrateBps, nextOffset: offset + frameSizeBytes };
}

/** Ignore un éventuel tag ID3v2 en tête de fichier pour retrouver le premier frame MPEG. */
function skipId3v2(buf: Buffer): number {
  if (buf.length > 10 && buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) {
    const size =
      ((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) | ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f);
    return 10 + size;
  }
  return 0;
}

function findFirstFrame(buf: Buffer, startAt: number): (MpegFrame & { offset: number }) | null {
  for (let i = startAt; i < buf.length - 4; i++) {
    const frame = parseFrameHeader(buf, i);
    if (frame) return { ...frame, offset: i };
  }
  return null;
}

/**
 * Sonde la durée réelle (ms) d'un mp3 à débit constant via un Range request
 * partiel. Retourne null si la détection échoue (VBR, format inattendu,
 * erreur réseau) — l'appelant doit alors retomber sur l'estimation par mots.
 */
async function probeMp3DurationMs(url: string): Promise<number | null> {
  try {
    const PROBE_BYTES = 256 * 1024; // large marge pour ID3v2 + plusieurs frames, même à bas débit
    const res = await fetch(url, { headers: { Range: `bytes=0-${PROBE_BYTES - 1}` } });
    if (!res.ok) return null;

    const contentRange = res.headers.get("content-range"); // "bytes 0-262143/28622480"
    const totalSize = contentRange
      ? Number(contentRange.split("/")[1])
      : Number(res.headers.get("content-length"));
    if (!totalSize || !Number.isFinite(totalSize)) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    const first = findFirstFrame(buf, skipId3v2(buf));
    if (!first) return null;

    // On vérifie que les 3 frames suivants ont le même débit avant d'extrapoler :
    // si le flux est en VBR, l'extrapolation à partir du seul premier frame serait fausse.
    let cursor = first.nextOffset;
    for (let i = 0; i < 3; i++) {
      const next = parseFrameHeader(buf, cursor);
      if (!next || next.bitrateBps !== first.bitrateBps) return null;
      cursor = next.nextOffset;
    }

    const mpegDataSize = totalSize - first.offset;
    return Math.round((mpegDataSize * 8 * 1000) / first.bitrateBps);
  } catch {
    return null;
  }
}

/**
 * Version mise en cache (les fichiers audio des récitateurs sont statiques —
 * pas besoin de re-sonder à chaque chargement de sourate).
 */
export const getCachedChapterDurationMs = unstable_cache(
  (url: string) => probeMp3DurationMs(url),
  ["chapter-audio-duration-probe"],
  { revalidate: false }
);
