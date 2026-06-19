"use client";

import React from "react";
import { useEditorStore } from "@/store/editorStore";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { ArabicFont } from "@/types/quran";
import { SectionLabel } from "./SectionLabel";

const FONTS: { id: ArabicFont; label: string; fontClass: string; sample: string }[] = [
  { id: "uthmanic",     label: "Noto Naskh Arabic",  fontClass: "font-arabic",       sample: "بِسْمِ ٱللَّهِ" },
  { id: "amiri",        label: "Amiri",               fontClass: "font-amiri",        sample: "بِسْمِ ٱللَّهِ" },
  { id: "scheherazade", label: "Scheherazade New",    fontClass: "font-scheherazade", sample: "بِسْمِ ٱللَّهِ" },
];

const ARABIC_SIZES = [
  { label: "S",  value: 36 },
  { label: "M",  value: 48 },
  { label: "L",  value: 64 },
  { label: "XL", value: 80 },
];

const TRANS_SIZES = [
  { label: "S",  value: 14 },
  { label: "M",  value: 16 },
  { label: "L",  value: 18 },
  { label: "XL", value: 22 },
];

const POSITIONS = [
  { id: "top",    label: "↑ Haut",   icon: "⬆" },
  { id: "center", label: "● Centre", icon: "●" },
  { id: "bottom", label: "↓ Bas",    icon: "⬇" },
] as const;

const ARABIC_COLORS  = ["#ffffff", "#fabe00", "#e8d5a3", "#c5e8d5", "#f0e6ff"];
const KARAOKE_COLORS = ["#fabe00", "#10b981", "#3b82f6", "#f97316", "#ec4899"];

export function TextTab() {
  const config    = useEditorStore((s) => s.config);
  const setConfig = useEditorStore((s) => s.setConfig);

  return (
    <div className="space-y-5 px-4 py-4">

      {/* Police arabe */}
      <section className="space-y-2">
        <SectionLabel>Police arabe</SectionLabel>
        <div className="space-y-1.5">
          {FONTS.map((f) => {
            const active = config.arabicFont === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setConfig({ arabicFont: f.id })}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-gold/40",
                  active
                    ? "border-gold/40 bg-gold/10"
                    : "border-studio-border hover:border-gold/30 hover:bg-white/4"
                )}
              >
                <span className={cn("text-xs", active ? "text-gold" : "text-muted-foreground/70")}>
                  {f.label}
                </span>
                <span dir="rtl" className={cn("text-2xl leading-none", f.fontClass)}>
                  {f.sample}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <Separator className="bg-studio-border" />

      {/* Taille texte arabe */}
      <section className="space-y-2">
        <SectionLabel>Taille du texte arabe</SectionLabel>
        <div className="grid grid-cols-4 gap-1.5">
          {ARABIC_SIZES.map((s) => {
            const active = config.arabicFontSize === s.value;
            return (
              <button
                key={s.value}
                onClick={() => setConfig({ arabicFontSize: s.value })}
                className={cn(
                  "py-2 rounded-xl text-sm font-medium border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/40",
                  active
                    ? "border-gold/40 bg-gold/15 text-gold shadow-[0_0_8px_hsl(var(--gold)/0.2)]"
                    : "border-studio-border hover:border-gold/30 text-muted-foreground hover:text-foreground"
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <StudioSlider
          min={24} max={120} step={2}
          value={config.arabicFontSize}
          onChange={(v) => setConfig({ arabicFontSize: v })}
          label="Personnalisé" unit="px"
        />
      </section>

      <Separator className="bg-studio-border" />

      {/* Taille traduction */}
      <section className="space-y-2">
        <SectionLabel>Taille de la traduction</SectionLabel>
        <div className="grid grid-cols-4 gap-1.5">
          {TRANS_SIZES.map((s) => {
            const active = config.translationFontSize === s.value;
            return (
              <button
                key={s.value}
                onClick={() => setConfig({ translationFontSize: s.value })}
                className={cn(
                  "py-2 rounded-xl text-sm font-medium border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/40",
                  active
                    ? "border-gold/40 bg-gold/15 text-gold shadow-[0_0_8px_hsl(var(--gold)/0.2)]"
                    : "border-studio-border hover:border-gold/30 text-muted-foreground hover:text-foreground"
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <StudioSlider
          min={10} max={40} step={1}
          value={config.translationFontSize}
          onChange={(v) => setConfig({ translationFontSize: v })}
          label="Personnalisé" unit="px"
        />
      </section>

      <Separator className="bg-studio-border" />

      {/* Position du texte */}
      <section className="space-y-2">
        <SectionLabel>Position du texte</SectionLabel>
        <div className="grid grid-cols-3 gap-1.5">
          {POSITIONS.map((p) => {
            const active = config.textPosition === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setConfig({ textPosition: p.id })}
                className={cn(
                  "py-2.5 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer flex flex-col items-center gap-1 focus:outline-none focus:ring-2 focus:ring-gold/40",
                  active
                    ? "border-gold/40 bg-gold/15 text-gold"
                    : "border-studio-border hover:border-gold/30 text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="text-base leading-none">{p.icon}</span>
                <span>{p.id === "top" ? "Haut" : p.id === "center" ? "Centre" : "Bas"}</span>
              </button>
            );
          })}
        </div>
      </section>

      <Separator className="bg-studio-border" />

      {/* Couleur texte arabe */}
      <section className="space-y-2">
        <SectionLabel>Couleur du texte arabe</SectionLabel>
        <ColorRow
          value={config.arabicColor ?? "#ffffff"}
          presets={ARABIC_COLORS}
          onChange={(c) => setConfig({ arabicColor: c })}
        />
      </section>

      {/* Couleur karaoké */}
      <section className="space-y-2">
        <SectionLabel>Couleur du mot actif (karaoké)</SectionLabel>
        <ColorRow
          value={config.highlightColor ?? "#fabe00"}
          presets={KARAOKE_COLORS}
          onChange={(c) => setConfig({ highlightColor: c })}
          accentColor="emerald"
        />
      </section>
    </div>
  );
}

/* ── Composants utilitaires ──────────────────────────────────────────────── */

function StudioSlider({
  min, max, step = 1, value, onChange, label, unit = "",
}: {
  min: number; max: number; step?: number;
  value: number; onChange: (v: number) => void;
  label: string; unit?: string;
}) {
  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground/80">{label}</span>
        <span className="text-xs font-mono text-gold tabular-nums">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="w-full accent-gold h-1 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
      />
      <div className="flex justify-between text-muted-foreground/70 text-[10px]">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

function ColorRow({
  value, presets, onChange, accentColor = "gold",
}: {
  value: string;
  presets: string[];
  onChange: (v: string) => void;
  accentColor?: "gold" | "emerald";
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="cursor-pointer flex-shrink-0">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Couleur personnalisée"
          className="sr-only"
        />
        <div
          className="w-10 h-10 rounded-xl border-2 border-studio-border hover:border-gold/50 transition-colors duration-200 shadow-sm cursor-pointer"
          style={{ background: value }}
        />
      </label>
      <div className="flex gap-1.5 flex-wrap">
        {presets.map((c) => {
          const sel = value === c;
          return (
            <button
              key={c}
              onClick={() => onChange(c)}
              style={{ background: c }}
              aria-label={`Couleur ${c}`}
              aria-pressed={sel}
              className={cn(
                "w-8 h-8 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:scale-110 focus:outline-none focus:ring-2",
                sel
                  ? accentColor === "emerald"
                    ? "border-emerald shadow-[0_0_8px_hsl(var(--emerald)/0.5)] focus:ring-emerald/40"
                    : "border-gold shadow-[0_0_8px_hsl(var(--gold)/0.4)] focus:ring-gold/40"
                  : "border-studio-border hover:border-gold/30 focus:ring-gold/40"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
