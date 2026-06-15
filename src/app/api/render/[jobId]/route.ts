import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/render/jobs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const job = getJob(params.jobId);

  if (!job) {
    return NextResponse.json({ error: "Job introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    jobId:    job.id,
    status:   job.status,
    progress: job.progress,
    error:    job.error,
    // Fournit l'URL de téléchargement quand c'est prêt
    downloadUrl: job.status === "done"
      ? `/api/render/${job.id}/download`
      : null,
  });
}
