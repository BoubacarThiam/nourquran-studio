import { NextResponse } from "next/server";
import { fetchSurahs } from "@/lib/quran/surahs";

export async function GET() {
  try {
    const surahs = await fetchSurahs();
    return NextResponse.json(surahs);
  } catch (err) {
    console.error("[API/quran/surahs]", err);
    return NextResponse.json(
      { error: "Impossible de charger les sourates" },
      { status: 500 }
    );
  }
}
