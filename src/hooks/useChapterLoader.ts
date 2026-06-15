"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditorStore } from "@/store/editorStore";
import type { LoadedChapter } from "@/lib/quran";

/**
 * Charge les données du chapitre coranique depuis /api/quran/chapter
 * dès que surahId ou reciterId changent dans le store.
 * Annule la requête en cours si les paramètres changent avant la fin.
 */
export function useChapterLoader() {
  const surahId       = useEditorStore((s) => s.config.surahId);
  const reciterId     = useEditorStore((s) => s.config.reciterId);
  const fromVerse     = useEditorStore((s) => s.config.fromVerse);
  const toVerse       = useEditorStore((s) => s.config.toVerse);
  const translationIds = useEditorStore((s) => s.config.translationIds);

  const setChapter   = useEditorStore((s) => s.setChapter);
  const setLoading   = useEditorStore((s) => s.setLoading);
  const setLoadError = useEditorStore((s) => s.setLoadError);

  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!surahId) return;

    // Annuler la requête précédente si elle est encore en cours
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setLoadError(null);

    try {
      const params = new URLSearchParams({
        surahId:     String(surahId),
        reciterId:   String(reciterId),
        from:        String(fromVerse),
        translations: translationIds.join(","),
      });
      if (toVerse) params.set("to", String(toVerse));

      const res = await fetch(`/api/quran/chapter?${params}`, {
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Erreur ${res.status}`);
      }

      const data: LoadedChapter = await res.json();
      setChapter(data);
    } catch (err) {
      const e = err as Error;
      if (e.name === "AbortError") return;
      setLoadError(e.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [surahId, reciterId, fromVerse, toVerse, translationIds, setChapter, setLoading, setLoadError]);

  // Chargement automatique quand les paramètres changent
  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  return { reload: load };
}

/**
 * Charge la liste des sourates (une seule fois, mise en cache côté client).
 */
export function useSurahsLoader() {
  const surahs    = useEditorStore((s) => s.surahs);
  const setSurahs = useEditorStore((s) => s.setSurahs);

  useEffect(() => {
    if (surahs.length > 0) return; // déjà chargées

    fetch("/api/quran/surahs")
      .then((r) => r.json())
      .then(setSurahs)
      .catch(console.error);
  }, [surahs.length, setSurahs]);

  return surahs;
}
