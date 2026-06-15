import { NextRequest, NextResponse } from "next/server";
import { searchPexelsVideos, searchPexelsPhotos } from "@/lib/pexels/client";

/**
 * GET /api/pexels/search?query=mosque&type=video&perPage=12&orientation=landscape
 *
 * Proxy côté serveur pour ne pas exposer la clé Pexels au client.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const query       = searchParams.get("query") ?? "mosque";
  const type        = searchParams.get("type") ?? "video";
  const perPage     = Number(searchParams.get("perPage") ?? "12");
  const page        = Number(searchParams.get("page") ?? "1");
  const orientation = (searchParams.get("orientation") ?? "landscape") as
    "landscape" | "portrait" | "square";

  try {
    if (type === "photo") {
      const result = await searchPexelsPhotos(query, { perPage, page, orientation });
      return NextResponse.json(result);
    } else {
      const result = await searchPexelsVideos(query, { perPage, page, orientation });
      return NextResponse.json(result);
    }
  } catch (err) {
    const e = err as Error;
    if (e.message?.includes("PEXELS_API_KEY")) {
      return NextResponse.json(
        { error: "Clé Pexels manquante. Configurer PEXELS_API_KEY dans .env.local" },
        { status: 503 }
      );
    }
    console.error("[API/pexels/search]", e);
    return NextResponse.json({ error: "Erreur Pexels API" }, { status: 500 });
  }
}
