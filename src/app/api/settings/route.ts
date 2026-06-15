import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Clés autorisées (liste blanche)
const ALLOWED_KEYS = ["PEXELS_API_KEY"] as const;
type SettingKey = (typeof ALLOWED_KEYS)[number];

// GET /api/settings — retourne les clés avec valeurs masquées
export async function GET() {
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: [...ALLOWED_KEYS] } },
  });

  const result: Record<string, { configured: boolean; preview: string }> = {};

  for (const key of ALLOWED_KEYS) {
    const row = rows.find((r) => r.key === key);
    if (row?.value) {
      // N'expose que les 4 premiers et 4 derniers caractères
      const v = row.value;
      const preview = v.length > 10
        ? `${v.slice(0, 4)}${"•".repeat(Math.min(v.length - 8, 20))}${v.slice(-4)}`
        : "•".repeat(v.length);
      result[key] = { configured: true, preview };
    } else {
      result[key] = { configured: false, preview: "" };
    }
  }

  return NextResponse.json(result);
}

// POST /api/settings — enregistre ou supprime une clé
export async function POST(req: NextRequest) {
  const body = await req.json() as { key: string; value: string };

  if (!ALLOWED_KEYS.includes(body.key as SettingKey)) {
    return NextResponse.json({ error: "Clé non autorisée" }, { status: 400 });
  }

  if (!body.value?.trim()) {
    // Supprime la clé si valeur vide
    await prisma.appSetting.deleteMany({ where: { key: body.key } });
    return NextResponse.json({ ok: true, action: "deleted" });
  }

  await prisma.appSetting.upsert({
    where:  { key: body.key },
    create: { key: body.key, value: body.value.trim() },
    update: { value: body.value.trim() },
  });

  return NextResponse.json({ ok: true, action: "saved" });
}
