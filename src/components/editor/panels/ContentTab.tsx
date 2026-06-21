"use client";

import React, { useState, useRef } from "react";
import { Search, ChevronRight, Loader2, ChevronDown, Upload, Music, X } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { useSurahsLoader } from "@/hooks/useChapterLoader";
import { RECITERS } from "@/lib/quran/reciters";
import { CUSTOM_RECITER_ID, loadCustomAudioFile } from "@/lib/quran/customAudio";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { AspectRatio } from "@/types/quran";
import { SectionLabel } from "./SectionLabel";

interface FormatOption {
  ratio: AspectRatio;
  label: string;
  sub:   string;
  icon:  string;   // Tailwind classes for the visual thumbnail shape
}

const FORMAT_OPTIONS: FormatOption[] = [
  { ratio: "9:16", label: "9:16",  sub: "Shorts / Reels",  icon: "w-4 h-7 rounded-sm"  },
  { ratio: "16:9", label: "16:9",  sub: "YouTube Long",    icon: "w-7 h-4 rounded-sm"  },
  { ratio: "1:1",  label: "1:1",   sub: "Instagram Carré", icon: "w-5 h-5 rounded-sm"  },
  { ratio: "4:5",  label: "4:5",   sub: "Instagram Feed",  icon: "w-4 h-5 rounded-sm"  },
];

const TRANSLATION_OPTIONS = [
  { id: 136, label: "Français — Hamidullah",   flag: "🇫🇷" },
  { id: 131, label: "English — Saheeh Int'l",  flag: "🇬🇧" },
  { id: 85,  label: "English — Clear Quran",   flag: "🇺🇸" },
];

const inputCls = "w-full bg-studio-surface border border-studio-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50 transition-all duration-200 placeholder:text-muted-foreground/50";

export function ContentTab() {
  const config        = useEditorStore((s) => s.config);
  const setConfig     = useEditorStore((s) => s.setConfig);
  const customAudio   = useEditorStore((s) => s.customAudio);
  const setCustomAudio = useEditorStore((s) => s.setCustomAudio);
  const surahs    = useSurahsLoader();
  const [search, setSearch]     = useState("");
  const [showList, setShowList] = useState(false);
  const [importState, setImportState] = useState<"idle" | "loading" | "error">("idle");
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isCustomActive = config.reciterId === CUSTOM_RECITER_ID;

  async function handleFileSelected(file: File | undefined) {
    if (!file) return;
    setImportState("loading");
    setImportError(null);
    try {
      const audio = await loadCustomAudioFile(file);
      // Libère l'ancienne URL blob si on remplace un import précédent.
      if (customAudio) URL.revokeObjectURL(customAudio.url);
      setCustomAudio(audio);
      setConfig({ reciterId: CUSTOM_RECITER_ID });
      setImportState("idle");
    } catch (err) {
      setImportError((err as Error).message);
      setImportState("error");
    }
  }

  function removeCustomAudio() {
    if (customAudio) URL.revokeObjectURL(customAudio.url);
    setCustomAudio(null);
    setImportState("idle");
    setImportError(null);
    setConfig({ reciterId: 97 });
  }

  const selectedSurah = surahs.find((s) => s.id === config.surahId);

  const filtered = search
    ? surahs.filter((s) =>
        s.name_simple.toLowerCase().includes(search.toLowerCase()) ||
        s.name_french.toLowerCase().includes(search.toLowerCase()) ||
        String(s.id).startsWith(search)
      )
    : surahs;

  return (
    <div className="space-y-5 px-4 py-4">

      {/* ── Format vidéo ── */}
      <section className="space-y-2">
        <SectionLabel>Format vidéo</SectionLabel>
        <div className="grid grid-cols-4 gap-1.5">
          {FORMAT_OPTIONS.map(({ ratio, label, sub, icon }) => {
            const active = config.aspectRatio === ratio;
            return (
              <button
                key={ratio}
                onClick={() => setConfig({ aspectRatio: ratio })}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border text-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/40",
                  active
                    ? "border-gold/40 bg-gold/10 text-gold shadow-[0_0_10px_hsl(var(--gold)/0.15)]"
                    : "border-studio-border bg-studio-surface text-muted-foreground hover:border-gold/20 hover:bg-gold/5 hover:text-foreground"
                )}
              >
                {/* Miniature format */}
                <div className={cn(
                  "border-2 transition-colors duration-200 flex-shrink-0",
                  active ? "border-gold" : "border-current/30",
                  icon
                )} />
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold leading-none">{label}</p>
                  <p className={cn(
                    "text-[9px] leading-none",
                    active ? "text-gold/70" : "text-muted-foreground/50"
                  )}>{sub}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Sourate */}
      <section className="space-y-2">
        <SectionLabel>Sourate</SectionLabel>

        {/* Pill sourate sélectionnée */}
        {selectedSurah && !showList && (
          <button
            onClick={() => setShowList(true)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-gold/30 bg-gold/5 text-left hover:bg-gold/10 hover:border-gold/50 transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-gold/40"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <span className="text-muted-foreground/60 text-xs w-5 font-mono flex-shrink-0">
                {selectedSurah.id}.
              </span>
              <span className="font-arabic text-xl leading-none">
                {selectedSurah.name_arabic}
              </span>
              <span className="text-gold text-xs truncate">{selectedSurah.name_french}</span>
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] text-muted-foreground/60 bg-studio-surface px-1.5 py-0.5 rounded-md">
                {selectedSurah.verses_count}v
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-gold transition-colors" />
            </div>
          </button>
        )}

        {/* Recherche + liste déroulante */}
        {(!selectedSurah || showList) && (
          <div className="space-y-1.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <input
                autoFocus={showList}
                type="text"
                placeholder="Nom ou numéro de sourate…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && showList && setShowList(false)}
                className={cn(inputCls, "pl-9")}
              />
            </div>
            <div className="max-h-52 overflow-y-auto rounded-xl border border-studio-border studio-scrollbar overflow-hidden"
              style={{ background: "hsl(var(--studio-surface))" }}>
              {surahs.length === 0 && (
                <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground/60 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-gold" />
                  Chargement…
                </div>
              )}
              {filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setConfig({ surahId: s.id, fromVerse: 1, toVerse: s.verses_count });
                    setSearch(""); setShowList(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm transition-all duration-150 text-left cursor-pointer",
                    config.surahId === s.id
                      ? "bg-gold/15 text-gold"
                      : "hover:bg-white/5 text-foreground/80 hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-muted-foreground/70 w-5 text-[11px] font-mono flex-shrink-0">{s.id}</span>
                    <span className="font-arabic text-lg leading-none flex-shrink-0">{s.name_arabic}</span>
                    <span className="text-muted-foreground/70 text-xs truncate">{s.name_french}</span>
                  </span>
                  <span className="text-muted-foreground/70 text-[10px] flex-shrink-0">{s.verses_count}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Plage de versets */}
      {selectedSurah && (
        <section className="space-y-2">
          <SectionLabel>Plage de versets</SectionLabel>
          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-1">
              <label htmlFor="from-verse" className="text-[11px] text-muted-foreground/80 ml-1 block">Du verset</label>
              <input
                id="from-verse"
                type="number" min={1} max={selectedSurah.verses_count}
                value={config.fromVerse}
                onChange={(e) => setConfig({ fromVerse: Math.min(Number(e.target.value), config.toVerse) })}
                className={cn(inputCls, "text-center")}
              />
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/60 mt-5 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 space-y-1">
              <label htmlFor="to-verse" className="text-[11px] text-muted-foreground/80 ml-1 block">Au verset</label>
              <input
                id="to-verse"
                type="number" min={config.fromVerse} max={selectedSurah.verses_count}
                value={config.toVerse}
                onChange={(e) => setConfig({ toVerse: Math.max(Number(e.target.value), config.fromVerse) })}
                className={cn(inputCls, "text-center")}
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/80 text-center">
            {config.toVerse - config.fromVerse + 1} verset(s) · {selectedSurah.verses_count} au total
          </p>
        </section>
      )}

      <Separator className="bg-studio-border" />

      {/* Récitateur */}
      <section className="space-y-2">
        <SectionLabel>Récitateur</SectionLabel>

        {/* Import d'une récitation personnelle */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="sr-only"
          onChange={(e) => { handleFileSelected(e.target.files?.[0]); e.target.value = ""; }}
        />
        {isCustomActive && customAudio ? (
          <div className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm border border-emerald/30 bg-emerald/10">
            <Music className="w-4 h-4 text-emerald flex-shrink-0" />
            <span className="text-xs text-foreground truncate flex-1">{customAudio.fileName}</span>
            <button
              onClick={removeCustomAudio}
              aria-label="Retirer la récitation importée"
              className="min-w-7 min-h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground cursor-pointer flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importState === "loading"}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm border border-dashed border-studio-border hover:border-gold/40 hover:bg-gold/5 transition-all duration-200 cursor-pointer text-left disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-gold/40"
          >
            {importState === "loading"
              ? <Loader2 className="w-4 h-4 text-gold flex-shrink-0 animate-spin" />
              : <Upload className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
            <span className="text-xs text-muted-foreground flex-1">
              {importState === "loading" ? "Lecture du fichier…" : "Importer ma récitation (MP3, WAV…)"}
            </span>
          </button>
        )}
        {importState === "error" && importError && (
          <p className="text-[11px] text-destructive px-1">{importError}</p>
        )}

        <div className="space-y-1">
          {RECITERS.map((r) => {
            const active = config.reciterId === r.id;
            const isPriority = r.id === 97;
            return (
              <button
                key={r.id}
                onClick={() => setConfig({ reciterId: r.id })}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm border transition-all duration-200 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/40",
                  active
                    ? "border-gold/30 bg-gold/10 text-foreground"
                    : "border-transparent hover:border-studio-border hover:bg-white/4 text-foreground/70 hover:text-foreground"
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-200",
                  active ? "bg-gold shadow-[0_0_6px_hsl(var(--gold)/0.6)]" : "bg-studio-border"
                )} />
                <span className="font-arabic text-lg leading-none flex-shrink-0">{r.name_arabic}</span>
                <span className="text-xs text-muted-foreground truncate flex-1">{r.name}</span>
                {isPriority && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--gold)/0.2), hsl(var(--gold)/0.1))",
                      border: "1px solid hsl(var(--gold)/0.3)",
                      color: "hsl(var(--gold))",
                    }}>
                    ⭐ Top
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <Separator className="bg-studio-border" />

      {/* Traductions */}
      <section className="space-y-2">
        <SectionLabel>Traduction (max 2)</SectionLabel>
        <div className="space-y-1">
          {TRANSLATION_OPTIONS.map((t) => {
            const active = config.translationIds.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => {
                  const ids = active
                    ? config.translationIds.filter((id) => id !== t.id)
                    : [...config.translationIds, t.id].slice(0, 2);
                  if (ids.length > 0) setConfig({ translationIds: ids });
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald/40",
                  active
                    ? "border-emerald/30 bg-emerald/10 text-foreground"
                    : "border-transparent hover:border-studio-border hover:bg-white/4 text-foreground/70 hover:text-foreground"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200",
                  active ? "bg-emerald border-emerald" : "border-studio-bright"
                )}>
                  {active && <span className="text-white text-[9px] leading-none font-bold">✓</span>}
                </div>
                <span className="text-base leading-none">{t.flag}</span>
                <span className="text-xs flex-1">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Translittération toggle */}
        <button
          role="switch"
          aria-checked={config.showTransliteration}
          onClick={() => setConfig({ showTransliteration: !config.showTransliteration })}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/4 cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span className="text-sm text-foreground/70">Translittération</span>
          <Toggle on={config.showTransliteration} color="emerald" />
        </button>
      </section>
    </div>
  );
}

/* ── Composants utilitaires ──────────────────────────────────────────────── */

function Toggle({ on, color = "gold" }: { on: boolean; color?: "gold" | "emerald" }) {
  const bg = on
    ? color === "emerald" ? "bg-emerald" : "bg-gold"
    : "bg-studio-surface border border-studio-border";
  return (
    <div className={cn("w-9 h-5 rounded-full relative transition-colors duration-200 flex-shrink-0", bg)}
      style={on ? { boxShadow: `0 0 8px hsl(var(--${color}) / 0.4)` } : {}}>
      <div className={cn(
        "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200",
        on ? "translate-x-[18px]" : "translate-x-0.5"
      )} />
    </div>
  );
}
