import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getJob } from "@/lib/render/jobs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const job = getJob(params.jobId);

  if (!job) {
    return NextResponse.json({ error: "Job introuvable" }, { status: 404 });
  }
  if (job.status !== "done" || !job.outputPath) {
    return NextResponse.json({ error: "Rendu non terminé" }, { status: 400 });
  }
  if (!fs.existsSync(job.outputPath)) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(job.outputPath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type":        "video/mp4",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(job.filename)}"`,
      "Content-Length":      String(fileBuffer.length),
    },
  });
}
