import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";
import {
  createJob, updateJob, ensureRendersDir, RENDERS_DIR,
  getCompositionId, sanitizeFilename, cleanOldJobs,
} from "@/lib/render/jobs";
import { downloadBgVideo, cleanBgVideo } from "@/lib/render/download";
import type { QuranCompositionProps } from "@/types/remotion";

const BUNDLE_VERSION = "v2";
let cachedBundle: string | null = null;
let cachedBundleVersion: string | null = null;

async function getBundle(): Promise<string> {
  if (cachedBundle && cachedBundleVersion === BUNDLE_VERSION) return cachedBundle;

  cachedBundle = null;

  const { bundle } = await import("@remotion/bundler");
  const entryPoint = path.resolve(process.cwd(), "remotion/index.ts");

  cachedBundle        = await bundle({
    entryPoint,
    onProgress: (p) => {
      if (p % 20 === 0) console.log(`[bundle] ${p}%`);
    },
  });
  cachedBundleVersion = BUNDLE_VERSION;

  return cachedBundle;
}

async function runRender(
  jobId: string,
  inputProps: QuranCompositionProps,
  outputPath: string,
) {
  try {
    // ── Phase 1 : télécharger la vidéo de fond (Pexels CDN → fichier local) ──
    let resolvedProps = inputProps;

    if (inputProps.background.type === "pexels_video" && inputProps.background.url) {
      updateJob(jobId, { status: "downloading", progress: 2 });
      console.log(`[render] downloading background video for job ${jobId}…`);

      const localPath = await downloadBgVideo(inputProps.background.url, jobId);
      resolvedProps = {
        ...inputProps,
        background: { ...inputProps.background, localPath },
      };

      console.log(`[render] background video cached at ${localPath}`);
    }

    // ── Phase 2 : bundler Remotion ────────────────────────────────────────────
    updateJob(jobId, { status: "bundling", progress: 5 });

    const serveUrl = await getBundle();
    const compId   = getCompositionId(inputProps.aspectRatio);

    const { selectComposition, renderMedia } = await import("@remotion/renderer");

    // ── Phase 3 : rendu ───────────────────────────────────────────────────────
    updateJob(jobId, { status: "rendering", progress: 10 });

    const composition = await selectComposition({
      serveUrl,
      id: compId,
      inputProps: resolvedProps as unknown as Record<string, unknown>,
    });

    await renderMedia({
      composition,
      serveUrl,
      codec:          "h264",
      outputLocation: outputPath,
      inputProps:     resolvedProps as unknown as Record<string, unknown>,
      timeoutInMilliseconds: 5 * 60 * 1000,
      onProgress: ({ progress }) => {
        const pct = Math.round(10 + progress * 88);
        updateJob(jobId, { progress: pct });
      },
    });

    cleanBgVideo(jobId);
    updateJob(jobId, { status: "done", progress: 100, outputPath });
    console.log(`[render] job ${jobId} done → ${outputPath}`);

  } catch (err) {
    cleanBgVideo(jobId);
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[render] job ${jobId} failed:`, message);
    updateJob(jobId, { status: "failed", error: message });
  }
}

export async function POST(req: NextRequest) {
  if (process.env.RENDER_ENABLED === "false") {
    return NextResponse.json(
      { error: "L'export vidéo serveur n'est pas disponible sur ce déploiement (Remotion Lambda non configuré)." },
      { status: 503 }
    );
  }

  try {
    cleanOldJobs();
    ensureRendersDir();

    const body = await req.json() as QuranCompositionProps;

    if (!body.verses?.length) {
      return NextResponse.json({ error: "Aucun verset à rendre" }, { status: 400 });
    }

    const jobId    = randomUUID();
    const safeName = sanitizeFilename(body.surahName ?? "video");
    const filename = `NourQuran_${safeName}_${body.aspectRatio.replace(":", "x")}.mp4`;
    const outPath  = path.join(RENDERS_DIR, `${jobId}.mp4`);

    createJob(jobId, filename);

    runRender(jobId, body, outPath).catch((e) =>
      console.error("[render] unhandled error:", e)
    );

    return NextResponse.json({ jobId });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
