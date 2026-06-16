import { NextRequest, NextResponse } from "next/server";
import { searchPexelsVideos } from "@/lib/pexels/client";
import { getPexelsKey } from "@/lib/pexels/server";
import fs from "fs";

export const dynamic = "force-dynamic";

const CACHE_FILE = "/tmp/nourquran-pexels-library.json";
const CACHE_TTL  = 24 * 60 * 60 * 1000; // 24 heures

/**
 * 12 catégories, chacune avec 2 requêtes Pexels.
 * La bibliothèque récupère 15 résultats par requête = jusqu'à 30 vidéos/catégorie.
 * Les doublons sont filtrés par ID.
 */
const CATEGORY_QUERIES: Record<string, { label: string; queries: string[] }> = {
  mosque:     { label: "Mosquée & Islam",      queries: ["mosque interior architecture",     "masjid islamic mosque"] },
  kaaba:      { label: "La Mecque & Kaaba",    queries: ["mecca kaaba holy",                 "hajj mecca night"] },
  desert:     { label: "Désert & Dunes",       queries: ["desert sand dunes golden",         "sahara desert wind"] },
  sky:        { label: "Ciel & Étoiles",       queries: ["starry night sky milky way",       "stars timelapse night"] },
  moon:       { label: "Lune & Nuit",          queries: ["full moon night sky",              "moonlight dark night"] },
  ocean:      { label: "Mer & Rivière",        queries: ["calm ocean waves shore",           "river stream nature"] },
  nature:     { label: "Forêt & Verdure",      queries: ["forest sunlight rays green",       "peaceful nature trees"] },
  mountain:   { label: "Montagnes",            queries: ["mountain landscape dramatic",      "peaks clouds mountain"] },
  sunrise:    { label: "Lever & Coucher",      queries: ["sunset golden hour horizon",       "sunrise morning light"] },
  rain:       { label: "Pluie & Nuages",       queries: ["rain window drops dark",           "stormy clouds dramatic"] },
  light:      { label: "Lumière & Bokeh",      queries: ["bokeh golden light abstract dark", "particles light bokeh"] },
  city:       { label: "Ville & Architecture", queries: ["arabian city night lights",        "islamic architecture ornament"] },
};

export type LibraryCategory = keyof typeof CATEGORY_QUERIES;

export interface LibraryVideo {
  id:        string;
  category:  string;
  thumbnail: string;
  duration:  number;
  width:     number;
  height:    number;
}

interface LibraryCache {
  updatedAt:  number;
  byCategory: Record<string, LibraryVideo[]>;
}

function readCache(): LibraryCache | null {
  try {
    const raw = fs.readFileSync(CACHE_FILE, "utf8");
    const c   = JSON.parse(raw) as LibraryCache;
    if (Date.now() - c.updatedAt < CACHE_TTL) return c;
  } catch { /* miss */ }
  return null;
}

function writeCache(data: LibraryCache) {
  try { fs.writeFileSync(CACHE_FILE, JSON.stringify(data), "utf8"); } catch { /* ignore */ }
}

async function fetchCategory(
  cat: string,
  queries: string[],
  orientation: "portrait" | "landscape",
): Promise<LibraryVideo[]> {
  const seen = new Set<string>();
  const all: LibraryVideo[] = [];

  await Promise.allSettled(queries.map(async (q) => {
    try {
      const data = await searchPexelsVideos(q, { perPage: 15, page: 1, orientation });
      for (const v of data.videos) {
        const id = String(v.id);
        if (!seen.has(id)) {
          seen.add(id);
          all.push({ id, category: cat, thumbnail: v.image, duration: v.duration, width: v.width, height: v.height });
        }
      }
    } catch { /* skip query on error */ }
  }));

  return all;
}

async function buildLibrary(orientation: "portrait" | "landscape"): Promise<Record<string, LibraryVideo[]>> {
  const byCategory: Record<string, LibraryVideo[]> = {};

  await Promise.allSettled(
    Object.entries(CATEGORY_QUERIES).map(async ([cat, { queries }]) => {
      byCategory[cat] = await fetchCategory(cat, queries, orientation);
    })
  );

  return byCategory;
}

/**
 * GET /api/pexels/library?orientation=portrait|landscape
 * POST /api/pexels/library — force refresh du cache
 */
export async function GET(req: NextRequest) {
  const orientation = (req.nextUrl.searchParams.get("orientation") ?? "portrait") as
    "portrait" | "landscape";

  // Vérifier la clé Pexels avant toute chose — évite de renvoyer 12 catégories vides
  // sans message d'erreur quand la clé n'est pas configurée.
  try {
    await getPexelsKey();
  } catch {
    return NextResponse.json(
      {
        error: "Clé Pexels manquante",
        byCategory: {},
        categories: Object.fromEntries(
          Object.entries(CATEGORY_QUERIES).map(([k, v]) => [k, v.label])
        ),
      },
      { status: 503 }
    );
  }

  const cached = readCache();
  if (cached) {
    return NextResponse.json({
      byCategory: cached.byCategory,
      categories: Object.fromEntries(
        Object.entries(CATEGORY_QUERIES).map(([k, v]) => [k, v.label])
      ),
      cached: true,
    });
  }

  try {
    const byCategory = await buildLibrary(orientation);
    writeCache({ updatedAt: Date.now(), byCategory });

    return NextResponse.json({
      byCategory,
      categories: Object.fromEntries(
        Object.entries(CATEGORY_QUERIES).map(([k, v]) => [k, v.label])
      ),
      cached: false,
    });
  } catch (err) {
    const e = err as Error;
    if (e.message?.includes("Pexels") || e.message?.includes("clé")) {
      return NextResponse.json(
        {
          error:      "Clé Pexels manquante",
          byCategory: {},
          categories: Object.fromEntries(
            Object.entries(CATEGORY_QUERIES).map(([k, v]) => [k, v.label])
          ),
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Erreur bibliothèque", byCategory: {}, categories: {} }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const orientation = (req.nextUrl.searchParams.get("orientation") ?? "portrait") as
    "portrait" | "landscape";

  try { fs.unlinkSync(CACHE_FILE); } catch { /* not found */ }

  try {
    const byCategory = await buildLibrary(orientation);
    writeCache({ updatedAt: Date.now(), byCategory });
    return NextResponse.json({
      byCategory,
      categories: Object.fromEntries(
        Object.entries(CATEGORY_QUERIES).map(([k, v]) => [k, v.label])
      ),
      cached: false,
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
