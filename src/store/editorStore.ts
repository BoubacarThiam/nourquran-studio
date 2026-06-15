import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { EditorConfig, Surah } from "@/types/quran";
import type { LoadedChapter } from "@/lib/quran";

// Config par défaut de l'éditeur
const DEFAULT_CONFIG: EditorConfig = {
  surahId:              1,
  fromVerse:            1,
  toVerse:              7,
  reciterId:            97,   // Yasser Al-Dosari (prioritaire)
  translationIds:       [136], // Hamidullah FR
  showTransliteration:  false,

  background:           { type: "color", color: "#0d1117" },
  overlayOpacity:       0.55,
  backgroundBlur:       0,
  vignette:             true,
  vignetteIntensity:    40,
  kenBurns:             false,
  kenBurnsScale:        110,

  arabicFont:           "uthmanic",
  arabicFontSize:       64,   // px
  translationFontSize:  16,   // px
  textPosition:         "bottom",
  arabicColor:          "#ffffff",
  highlightColor:       "#fabe00",

  verseTransition:      "fade",
  pauseBetweenVerses:   1000,

  reciterVolume:        1,
  ambientSound:         { enabled: false, preset: null, volume: 0.2 },

  aspectRatio:          "9:16",
  resolution:           "1080p",

  watermark:            { enabled: false, position: "bottom-right", opacity: 0.8, size: 12 },
  intro:                { enabled: false, durationSec: 3, showSurahName: true, showReciterName: true },
  outro:                { enabled: false, durationSec: 5, showSurahName: true, showReciterName: true, callToAction: "" },
};

interface EditorState {
  // Configuration complète
  config: EditorConfig;

  // Données chargées (non persistées)
  surahs:       Surah[];
  loadedChapter: LoadedChapter | null;
  isLoading:     boolean;
  loadError:     string | null;

  // Progression du rendu
  renderJobId:      string | null;
  renderProgress:   number;
  renderStatus:     "idle" | "rendering" | "done" | "failed";
  renderOutputPath: string | null;

  // Préview Remotion
  isPlayerReady: boolean;

  // Actions — config
  setConfig:     (patch: Partial<EditorConfig>) => void;
  resetConfig:   () => void;

  // Actions — données
  setSurahs:     (surahs: Surah[]) => void;
  setChapter:    (chapter: LoadedChapter | null) => void;
  setLoading:    (loading: boolean) => void;
  setLoadError:  (err: string | null) => void;

  // Actions — rendu
  startRender:   (jobId: string) => void;
  updateRender:  (progress: number, status?: EditorState["renderStatus"]) => void;
  finishRender:  (outputPath: string) => void;
  failRender:    (error: string) => void;
  resetRender:   () => void;

  setPlayerReady: (ready: boolean) => void;
}

export const useEditorStore = create<EditorState>()(
  devtools(
    persist(
      (set) => ({
        config:         DEFAULT_CONFIG,
        surahs:         [],
        loadedChapter:  null,
        isLoading:      false,
        loadError:      null,
        renderJobId:    null,
        renderProgress: 0,
        renderStatus:   "idle",
        renderOutputPath: null,
        isPlayerReady:  false,

        setConfig:  (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
        resetConfig: ()    => set({ config: DEFAULT_CONFIG }),

        setSurahs:    (surahs)  => set({ surahs }),
        setChapter:   (chapter) => set({ loadedChapter: chapter }),
        setLoading:   (loading) => set({ isLoading: loading }),
        setLoadError: (err)     => set({ loadError: err }),

        startRender:  (jobId) => set({ renderJobId: jobId, renderProgress: 0, renderStatus: "rendering", renderOutputPath: null }),
        updateRender: (progress, status) => set((s) => ({
          renderProgress: progress,
          renderStatus:   status ?? s.renderStatus,
        })),
        finishRender: (outputPath) => set({ renderStatus: "done", renderProgress: 100, renderOutputPath: outputPath }),
        failRender:   (error) => set({ renderStatus: "failed", loadError: error }),
        resetRender:  ()      => set({ renderJobId: null, renderProgress: 0, renderStatus: "idle", renderOutputPath: null }),

        setPlayerReady: (ready) => set({ isPlayerReady: ready }),
      }),
      {
        name: "nourquran-editor-v2",
        // Ne pas persister les données dynamiques — seulement la config
        partialize: (s) => ({ config: s.config }),
      }
    ),
    { name: "NourQuranEditor" }
  )
);

/** Hook utilitaire — config seulement */
export const useEditorConfig = () => useEditorStore((s) => s.config);
/** Hook utilitaire — actions seulement */
export const useEditorActions = () =>
  useEditorStore((s) => ({
    setConfig:    s.setConfig,
    resetConfig:  s.resetConfig,
    setSurahs:    s.setSurahs,
    setChapter:   s.setChapter,
    setLoading:   s.setLoading,
    setLoadError: s.setLoadError,
    startRender:  s.startRender,
    updateRender: s.updateRender,
    finishRender: s.finishRender,
    failRender:   s.failRender,
    resetRender:  s.resetRender,
  }));
