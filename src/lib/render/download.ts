import fs from "fs";
import path from "path";
import { RENDERS_DIR, ensureRendersDir } from "./jobs";

/**
 * Downloads a remote video (Pexels CDN) to a local temp file so Remotion
 * can use it as an OffthreadVideo source during server-side rendering.
 * Returns the absolute path of the downloaded file.
 */
export async function downloadBgVideo(url: string, jobId: string): Promise<string> {
  ensureRendersDir();
  const outPath = path.join(RENDERS_DIR, `bg_${jobId}.mp4`);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; NourQuranStudio/1.0)",
      "Referer":    "https://www.pexels.com/",
    },
  });

  if (!res.ok) {
    throw new Error(`Téléchargement de la vidéo de fond échoué (${res.status} ${res.statusText})`);
  }

  const buf = await res.arrayBuffer();
  fs.writeFileSync(outPath, Buffer.from(buf));

  return outPath;
}

/** Removes the temporary background video file for a job. */
export function cleanBgVideo(jobId: string) {
  try {
    const p = path.join(RENDERS_DIR, `bg_${jobId}.mp4`);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch { /* ignore */ }
}
