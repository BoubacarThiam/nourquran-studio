import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formate "1:1" → { surahId: 1, verseNumber: 1 } */
export function parseVerseKey(key: string) {
  const [s, v] = key.split(":").map(Number);
  return { surahId: s, verseNumber: v };
}

/** Milliseconds → MM:SS */
export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Nombre de frames Remotion pour une durée en secondes à 30fps */
export function secondsToFrames(seconds: number, fps = 30): number {
  return Math.ceil(seconds * fps);
}

/** Clamp une valeur entre min et max */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}
