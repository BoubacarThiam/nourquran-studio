import fs from "fs";
import path from "path";

export type RenderStatus = "queued" | "downloading" | "bundling" | "rendering" | "done" | "failed";

export interface RenderJob {
  id:         string;
  status:     RenderStatus;
  progress:   number;
  outputPath: string | null;
  error:      string | null;
  filename:   string;
  createdAt:  number;
}

export const RENDERS_DIR  = "/tmp/nourquran-renders";
const        JOBS_DIR     = "/tmp/nourquran-renders/jobs";

export function ensureRendersDir() {
  fs.mkdirSync(RENDERS_DIR, { recursive: true });
  fs.mkdirSync(JOBS_DIR,    { recursive: true });
}

function jobPath(id: string) {
  return path.join(JOBS_DIR, `${id}.json`);
}

export function createJob(id: string, filename: string): RenderJob {
  ensureRendersDir();
  const job: RenderJob = {
    id, status: "queued", progress: 0,
    outputPath: null, error: null, filename, createdAt: Date.now(),
  };
  fs.writeFileSync(jobPath(id), JSON.stringify(job), "utf8");
  return job;
}

export function getJob(id: string): RenderJob | undefined {
  try {
    const raw = fs.readFileSync(jobPath(id), "utf8");
    return JSON.parse(raw) as RenderJob;
  } catch {
    return undefined;
  }
}

export function updateJob(id: string, patch: Partial<RenderJob>) {
  const job = getJob(id);
  if (!job) return;
  const updated = { ...job, ...patch };
  fs.writeFileSync(jobPath(id), JSON.stringify(updated), "utf8");
}

export function cleanOldJobs() {
  try {
    const ONE_HOUR = 3_600_000;
    for (const file of fs.readdirSync(JOBS_DIR)) {
      if (!file.endsWith(".json")) continue;
      const p   = path.join(JOBS_DIR, file);
      const job = JSON.parse(fs.readFileSync(p, "utf8")) as RenderJob;
      if (Date.now() - job.createdAt > ONE_HOUR) {
        if (job.outputPath && fs.existsSync(job.outputPath)) {
          try { fs.unlinkSync(job.outputPath); } catch { /* ignore */ }
        }
        fs.unlinkSync(p);
      }
    }
    // Clean orphan background video temp files older than 1 hour
    for (const file of fs.readdirSync(RENDERS_DIR)) {
      if (!file.startsWith("bg_") || !file.endsWith(".mp4")) continue;
      const p    = path.join(RENDERS_DIR, file);
      const stat = fs.statSync(p);
      if (Date.now() - stat.mtimeMs > ONE_HOUR) {
        try { fs.unlinkSync(p); } catch { /* ignore */ }
      }
    }
  } catch { /* ignore */ }
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9\s_-]/gi, "").replace(/\s+/g, "_").slice(0, 60);
}

export function getCompositionId(aspectRatio: string): string {
  if (aspectRatio === "16:9") return "QuranVideo-16-9";
  if (aspectRatio === "1:1")  return "QuranVideo-1-1";
  if (aspectRatio === "4:5")  return "QuranVideo-4-5";
  return "QuranVideo-9-16";
}
