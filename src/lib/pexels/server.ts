import { prisma } from "@/lib/prisma";

/** Résout la clé Pexels : .env.local → SQLite → erreur */
export async function getPexelsKey(): Promise<string> {
  const envKey = process.env.PEXELS_API_KEY;
  if (envKey && envKey !== "your_pexels_api_key_here") return envKey;

  const row = await prisma.appSetting.findUnique({ where: { key: "PEXELS_API_KEY" } });
  if (row?.value) return row.value;

  throw new Error("Clé Pexels manquante. Configurez-la dans Paramètres → API.");
}
