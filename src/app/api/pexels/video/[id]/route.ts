import { NextRequest, NextResponse } from "next/server";
import { getPexelsKey } from "@/lib/pexels/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/pexels/video/[id]
 * Récupère l'URL de téléchargement HD d'une vidéo Pexels par son ID.
 * Retourne { url, thumbnail, duration, width, height }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const key = await getPexelsKey();
    const res = await fetch(`https://api.pexels.com/videos/videos/${id}`, {
      headers: { Authorization: key },
      next:    { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Pexels API: ${res.status}` },
        { status: res.status }
      );
    }

    const video = await res.json();

    // Choisir la meilleure qualité disponible
    const files: Array<{ quality: string; width: number; link: string }> =
      video.video_files ?? [];
    files.sort((a, b) => b.width - a.width);

    const hd    = files.find((f) => f.quality === "hd");
    const uhd   = files.find((f) => f.quality === "uhd");
    const best  = uhd ?? hd ?? files[0];

    return NextResponse.json({
      id:        String(video.id),
      url:       best?.link ?? "",
      thumbnail: video.image,
      duration:  video.duration,
      width:     video.width,
      height:    video.height,
    });
  } catch (err) {
    const e = err as Error;
    if (e.message?.includes("Pexels") || e.message?.includes("clé")) {
      return NextResponse.json(
        { error: "Clé Pexels manquante" },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
