import { NextRequest, NextResponse } from "next/server";

// Teste une clé Pexels en faisant une vraie requête
export async function POST(req: NextRequest) {
  const { key, value } = await req.json() as { key: string; value: string };

  if (key !== "PEXELS_API_KEY" || !value?.trim()) {
    return NextResponse.json({ valid: false, error: "Clé vide" });
  }

  try {
    const res = await fetch(
      "https://api.pexels.com/videos/search?query=mosque&per_page=1",
      {
        headers: { Authorization: value.trim() },
        signal:  AbortSignal.timeout(8000),
      }
    );

    if (res.ok) {
      return NextResponse.json({ valid: true });
    }
    if (res.status === 401 || res.status === 403) {
      return NextResponse.json({ valid: false, error: "Clé invalide ou expirée" });
    }
    return NextResponse.json({ valid: false, error: `Erreur ${res.status}` });

  } catch {
    return NextResponse.json({ valid: false, error: "Impossible de joindre Pexels" });
  }
}
