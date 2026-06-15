/**
 * Cache local des médias Pexels.
 * Télécharge les vidéos/images dans public/backgrounds/cache/
 * pour éviter de refaire les requêtes Pexels à chaque rendu Remotion.
 */

import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import https from "https";
import http from "http";
import { prisma } from "@/lib/prisma";

const CACHE_DIR =
  process.env.BACKGROUND_CACHE_DIR ?? path.join(process.cwd(), "public/backgrounds/cache");

export async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

/**
 * Retourne le chemin local d'un média Pexels, en le téléchargeant si besoin.
 * Le chemin retourné est relatif à /public (ex: /backgrounds/cache/video_123.mp4).
 */
export async function getCachedBackground(
  pexelsId: string,
  url: string,
  type: "video" | "image",
  query: string
): Promise<string> {
  // Vérifier si déjà en cache BDD
  const existing = await prisma.cachedBackground.findUnique({
    where: { pexelsId },
  });

  if (existing) {
    // Vérifier que le fichier physique existe encore
    try {
      await fs.access(path.join(process.cwd(), "public", existing.localPath));
      return existing.localPath;
    } catch {
      // Fichier supprimé — on recache
    }
  }

  await ensureCacheDir();
  const ext = type === "video" ? "mp4" : "jpg";
  const filename = `${type}_${pexelsId}.${ext}`;
  const localPath = `/backgrounds/cache/${filename}`;
  const absolutePath = path.join(process.cwd(), "public", localPath);

  await downloadFile(url, absolutePath);

  // Enregistrer en BDD (upsert pour éviter les doublons race condition)
  await prisma.cachedBackground.upsert({
    where: { pexelsId },
    update: { localPath, url, type, query },
    create: { pexelsId, localPath, url, type, query },
  });

  return localPath;
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const file = fsSync.createWriteStream(dest);

    protocol.get(url, (response) => {
      // Suivre les redirections
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location!;
        file.close();
        downloadFile(redirectUrl, dest).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Download failed: ${response.statusCode} ${url}`));
        return;
      }

      response.pipe(file);
      file.on("finish", () => file.close(resolve as () => void));
      file.on("error", reject);
    }).on("error", (err) => {
      fsSync.unlink(dest, () => {});
      reject(err);
    });
  });
}
