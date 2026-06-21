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

    // La sortie finale ne dépasse jamais 1080p (et le canvas d'export rend
    // souvent à moitié résolution) — prendre systématiquement la 4K (souvent
    // 3 à 6x plus volumineuse, ex. 36 Mo vs 13 Mo en 1080p pour la même
    // vidéo) n'apporte aucun gain visuel et ralentit fortement le chargement,
    // au point que le fond pouvait ne jamais finir de charger pendant tout
    // l'enregistrement (vidéo exportée sans fond du tout). Le champ
    // `quality` de l'API n'étant pas toujours fiable/présent, on sélectionne
    // plutôt par résolution réelle : la plus grande qui reste ≤ 1920px de large.
    const files: Array<{ quality?: string; width: number; height: number; link: string }> =
      (video.video_files ?? []).filter((f: { width?: number }) => f.width);

    const MAX_WIDTH = 1920;
    const withinBudget = files.filter((f) => f.width <= MAX_WIDTH).sort((a, b) => b.width - a.width);
    const best = withinBudget[0] ?? [...files].sort((a, b) => a.width - b.width)[0];

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
