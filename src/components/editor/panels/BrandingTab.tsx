"use client";

import React, { useRef } from "react";
import { Upload, Volume2, CheckCircle2 } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const WATERMARK_POSITIONS = [
  { id: "top-left",     label: "↖" },
  { id: "top-right",    label: "↗" },
  { id: "bottom-left",  label: "↙" },
  { id: "bottom-right", label: "↘" },
] as const;

const AMBIENT_PRESETS = [
  { id: null,             label: "Aucun",                  icon: "🔇" },
  { id: "mosque_reverb",  label: "Réverbération mosquée",  icon: "🕌" },
  { id: "nature_soft",    label: "Nature douce",           icon: "🌿" },
  { id: "wind_soft",      label: "Vent léger",             icon: "🍃" },
] as const;

export function BrandingTab() {
  const config       = useEditorStore((s) => s.config);
  const setConfig    = useEditorStore((s) => s.setConfig);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const ambientRef   = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setConfig({ watermark: { ...config.watermark, enabled: true, url: URL.createObjectURL(file) } });
  };

  const handleAmbientUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setConfig({ ambientSound: { ...config.ambientSound, url: URL.createObjectURL(file), preset: null } });
  };

  return (
    <div className="space-y-5 px-4 py-4">

      {/* ── Filigrane ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <SectionLabel>Filigrane (logo)</SectionLabel>
            <p className="text-[11px] text-muted-foreground/50 mt-0.5">Votre logo sur la vidéo</p>
          </div>
          <ToggleSwitch
            checked={config.watermark?.enabled ?? false}
            onChange={(v) => setConfig({ watermark: { ...config.watermark, enabled: v } })}
          />
        </div>

        {config.watermark?.enabled && (
          <div className="space-y-3 pl-3 border-l-2 border-gold/20">
            {/* Aperçu + upload */}
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <div className="flex items-center gap-3">
              <button
                onClick={() => logoInputRef.current?.click()}
                className={cn(
                  "w-16 h-16 rounded-xl border-2 flex items-center justify-center flex-shrink-0 overflow-hidden transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/40",
                  config.watermark?.url
                    ? "border-gold/30 hover:border-gold/60"
                    : "border-dashed border-studio-border hover:border-gold/50 hover:bg-gold/5"
                )}
              >
                {config.watermark?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={config.watermark.url} alt="Logo" className="w-full h-full object-contain p-1.5" />
                ) : (
                  <Upload className="w-5 h-5 text-muted-foreground/50" />
                )}
              </button>
              <div className="flex-1 space-y-1.5">
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full py-1.5 rounded-xl border border-studio-border hover:border-gold/40 hover:text-gold text-xs text-muted-foreground/70 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/40"
                >
                  {config.watermark?.url ? "Changer le logo" : "Choisir PNG / SVG"}
                </button>
                <p className="text-[10px] text-muted-foreground/40 px-1">PNG avec transparence recommandé</p>
              </div>
            </div>

            {/* Position */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground/60">Position</span>
              <div className="grid grid-cols-4 gap-1.5">
                {WATERMARK_POSITIONS.map((p) => {
                  const active = config.watermark?.position === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setConfig({ watermark: { ...config.watermark, position: p.id } })}
                      className={cn(
                        "py-2 rounded-xl text-lg border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/40",
                        active
                          ? "border-gold/40 bg-gold/15 text-gold"
                          : "border-studio-border hover:border-gold/30 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <StudioSlider
              min={10} max={100} step={5}
              value={Math.round((config.watermark?.opacity ?? 0.8) * 100)}
              onChange={(v) => setConfig({ watermark: { ...config.watermark, opacity: v / 100 } })}
              label="Opacité" unit="%"
            />
            <StudioSlider
              min={5} max={30} step={1}
              value={config.watermark?.size ?? 12}
              onChange={(v) => setConfig({ watermark: { ...config.watermark, size: v } })}
              label="Taille" unit="%"
            />
          </div>
        )}
      </section>

      <Separator className="bg-studio-border" />

      {/* ── Intro / Outro ── */}
      <section className="space-y-3">
        <SectionLabel>Intro / Outro</SectionLabel>

        {/* Intro */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/4 transition-colors duration-200">
            <div>
              <p className="text-sm text-foreground/80">Intro</p>
              <p className="text-[11px] text-muted-foreground/50">Écran titre avec nom de la sourate</p>
            </div>
            <ToggleSwitch
              checked={config.intro?.enabled ?? false}
              onChange={(v) => setConfig({ intro: { ...config.intro, enabled: v } })}
            />
          </div>
          {config.intro?.enabled && (
            <div className="pl-3 border-l-2 border-gold/20">
              <StudioSlider
                min={2} max={10} step={1}
                value={config.intro?.durationSec ?? 3}
                onChange={(v) => setConfig({ intro: { ...config.intro, durationSec: v } })}
                label="Durée" unit="s"
              />
            </div>
          )}
        </div>

        {/* Outro */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/4 transition-colors duration-200">
            <div>
              <p className="text-sm text-foreground/80">Outro</p>
              <p className="text-[11px] text-muted-foreground/50">Écran de fin avec appel à l&apos;action</p>
            </div>
            <ToggleSwitch
              checked={config.outro?.enabled ?? false}
              onChange={(v) => setConfig({ outro: { ...config.outro, enabled: v } })}
            />
          </div>
          {config.outro?.enabled && (
            <div className="pl-3 border-l-2 border-gold/20 space-y-3">
              <StudioSlider
                min={2} max={10} step={1}
                value={config.outro?.durationSec ?? 5}
                onChange={(v) => setConfig({ outro: { ...config.outro, durationSec: v } })}
                label="Durée" unit="s"
              />
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground/60">Texte d&apos;appel à l&apos;action</span>
                <input
                  type="text"
                  value={config.outro?.callToAction ?? ""}
                  onChange={(e) => setConfig({ outro: { ...config.outro, callToAction: e.target.value } })}
                  placeholder="Abonnez-vous pour plus…"
                  className="w-full bg-studio-surface border border-studio-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50 transition-all duration-200 placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <Separator className="bg-studio-border" />

      {/* ── Son ambiant ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <SectionLabel>Son ambiant</SectionLabel>
            <p className="text-[11px] text-muted-foreground/50 mt-0.5">Fond sonore discret sous la récitation</p>
          </div>
          <ToggleSwitch
            checked={config.ambientSound?.enabled ?? false}
            onChange={(v) => setConfig({ ambientSound: { ...config.ambientSound, enabled: v } })}
          />
        </div>

        {config.ambientSound?.enabled && (
          <div className="space-y-3 pl-3 border-l-2 border-gold/20">
            {/* Préréglages */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground/60">Préréglage</span>
              <div className="space-y-1">
                {AMBIENT_PRESETS.map((p) => {
                  const active = config.ambientSound?.preset === p.id;
                  return (
                    <button
                      key={String(p.id)}
                      onClick={() => setConfig({ ambientSound: { ...config.ambientSound, preset: p.id } })}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-sm text-left transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/40",
                        active
                          ? "border-gold/40 bg-gold/10 text-gold"
                          : "border-studio-border hover:border-gold/30 hover:bg-white/4 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="text-base leading-none flex-shrink-0">{p.icon}</span>
                      <span className="flex-1">{p.label}</span>
                      {active && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-gold" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upload custom */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground/60">Ou votre propre audio</span>
              <input ref={ambientRef} type="file" accept="audio/*" onChange={handleAmbientUpload} className="hidden" />
              <button
                onClick={() => ambientRef.current?.click()}
                className="w-full py-2.5 rounded-xl border border-dashed border-studio-border hover:border-gold/50 hover:bg-gold/5 hover:text-gold text-xs text-muted-foreground/70 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-gold/40"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Importer MP3 ou WAV
              </button>
              {config.ambientSound?.url && (
                <p className="text-[11px] text-emerald flex items-center gap-1.5 px-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Fichier chargé
                </p>
              )}
            </div>

            <StudioSlider
              min={0} max={100} step={5}
              value={Math.round((config.ambientSound?.volume ?? 0.2) * 100)}
              onChange={(v) => setConfig({ ambientSound: { ...config.ambientSound, volume: v / 100 } })}
              label="Volume" unit="%"
            />
          </div>
        )}
      </section>
    </div>
  );
}

/* ── Composants utilitaires ──────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-0.5">
      {children}
    </p>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative flex-shrink-0 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/40",
        checked ? "bg-gold" : "bg-studio-surface border border-studio-border"
      )}
      style={{ width: 36, height: 20, boxShadow: checked ? "0 0 10px hsl(var(--gold)/0.3)" : "none" }}
    >
      <div className={cn(
        "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200",
        checked ? "translate-x-[17px]" : "translate-x-0.5"
      )} />
    </button>
  );
}

function StudioSlider({
  min, max, step = 1, value, onChange, label, unit = "",
}: {
  min: number; max: number; step?: number;
  value: number; onChange: (v: number) => void;
  label: string; unit?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground/70">{label}</span>
        <span className="text-xs font-mono text-gold tabular-nums">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-gold h-1 rounded-full cursor-pointer focus:outline-none"
      />
      <div className="flex justify-between text-muted-foreground/40 text-[10px]">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}
