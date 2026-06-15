/**
 * Client Pexels Video + Photos.
 * Les clés API restent côté serveur — utiliser les routes API Next.js depuis le client.
 */

import { prisma } from "@/lib/prisma";

const PEXELS_API_BASE = "https://api.pexels.com";

export interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  duration: number;
  url: string;
  image: string;          // thumbnail
  user: { name: string };
  video_files: Array<{
    id: number;
    quality: "hd" | "sd" | "uhd";
    file_type: string;
    width: number;
    height: number;
    link: string;
  }>;
}

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
}

export interface PexelsVideoSearchResult {
  total_results: number;
  page: number;
  per_page: number;
  videos: PexelsVideo[];
}

export interface PexelsPhotoSearchResult {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
}

async function getPexelsKey(): Promise<string> {
  // 1. Variable d'environnement (priorité)
  const envKey = process.env.PEXELS_API_KEY;
  if (envKey && envKey !== "your_pexels_api_key_here") return envKey;

  // 2. Base de données (configuré via l'interface)
  const row = await prisma.appSetting.findUnique({ where: { key: "PEXELS_API_KEY" } });
  if (row?.value) return row.value;

  throw new Error(
    "Clé Pexels manquante. Configurez-la dans Paramètres → API ou dans .env.local"
  );
}

async function getPexelsHeaders() {
  const key = await getPexelsKey();
  return { Authorization: key };
}

/** Recherche des vidéos Pexels */
export async function searchPexelsVideos(
  query: string,
  options: {
    perPage?: number;
    page?: number;
    orientation?: "landscape" | "portrait" | "square";
    minDuration?: number;
    maxDuration?: number;
  } = {}
): Promise<PexelsVideoSearchResult> {
  const { perPage = 15, page = 1, orientation = "landscape" } = options;

  const url = new URL(`${PEXELS_API_BASE}/videos/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("page", String(page));
  url.searchParams.set("orientation", orientation);
  if (options.minDuration) url.searchParams.set("min_duration", String(options.minDuration));
  if (options.maxDuration) url.searchParams.set("max_duration", String(options.maxDuration));

  const res = await fetch(url.toString(), { headers: await getPexelsHeaders() });
  if (!res.ok) throw new Error(`Pexels API error: ${res.status} ${res.statusText}`);

  return res.json();
}

/** Recherche des photos Pexels */
export async function searchPexelsPhotos(
  query: string,
  options: {
    perPage?: number;
    page?: number;
    orientation?: "landscape" | "portrait" | "square";
  } = {}
): Promise<PexelsPhotoSearchResult> {
  const { perPage = 15, page = 1, orientation = "landscape" } = options;

  const url = new URL(`${PEXELS_API_BASE}/v1/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("page", String(page));
  url.searchParams.set("orientation", orientation);

  const res = await fetch(url.toString(), { headers: await getPexelsHeaders() });
  if (!res.ok) throw new Error(`Pexels API error: ${res.status} ${res.statusText}`);

  return res.json();
}

/**
 * Sélectionne le meilleur fichier vidéo selon la résolution cible.
 * Préfère HD, évite UHD si targetRes = "720p".
 */
export function selectBestVideoFile(
  video: PexelsVideo,
  targetRes: "1080p" | "720p" = "1080p"
): string {
  const files = [...video.video_files].sort((a, b) => b.width - a.width);

  if (targetRes === "720p") {
    const hd = files.find((f) => f.quality === "hd");
    return hd?.link ?? files[0]?.link ?? "";
  }

  const uhd = files.find((f) => f.quality === "uhd");
  const hd  = files.find((f) => f.quality === "hd");
  return (uhd ?? hd ?? files[0])?.link ?? "";
}
