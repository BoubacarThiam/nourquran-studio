import { NextRequest, NextResponse } from "next/server";
import { loadChapterData } from "@/lib/quran";

/**
 * GET /api/quran/chapter?surahId=1&reciterId=7&from=1&to=7&translations=136,131
 *
 * Retourne les données complètes d'une plage de versets :
 * texte arabe + traductions + timings mot-à-mot + URL audio.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const surahId   = Number(searchParams.get("surahId"));
  const reciterId = Number(searchParams.get("reciterId") ?? "7");
  const from      = Number(searchParams.get("from") ?? "1");
  const to        = searchParams.get("to") ? Number(searchParams.get("to")) : undefined;
  const rawTrans  = searchParams.get("translations") ?? "136";
  const translationIds = rawTrans.split(",").map(Number).filter(Boolean);

  if (!surahId || surahId < 1 || surahId > 114) {
    return NextResponse.json({ error: "surahId invalide (1-114)" }, { status: 400 });
  }

  try {
    const data = await loadChapterData(surahId, reciterId, { from, to, translationIds });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[API/quran/chapter]", err);
    return NextResponse.json(
      { error: "Impossible de charger les données du chapitre" },
      { status: 500 }
    );
  }
}
