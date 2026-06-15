"use client";

import React from "react";
import { useEditorStore } from "@/store/editorStore";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function EffetsTab() {
  const config    = useEditorStore((s) => s.config);
  const setConfig = useEditorStore((s) => s.setConfig);

  return (
    <div className="space-y-5 px-4 py-4">

      {/* ── Fond vidéo ── */}
      <section className="space-y-3">
        <SectionLabel>Fond vidéo</SectionLabel>
        <StudioSlider
          min={0} max={100} step={5}
          value={Math.round((config.overlayOpacity ?? 0.4) * 100)}
          onChange={(v) => setConfig({ overlayOpacity: v / 100 })}
          label="Assombrissement" unit="%"
        />
        <StudioSlider
          min={0} max={20} step={1}
          value={config.backgroundBlur ?? 0}
          onChange={(v) => setConfig({ backgroundBlur: v })}
          label="Flou" unit="px"
        />
      </section>

      <Separator className="bg-studio-border" />

      {/* ── Vignette ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <SectionLabel>Vignette</SectionLabel>
            <p className="text-[11px] text-muted-foreground/50 mt-0.5">Assombrit les bords</p>
          </div>
          <ToggleSwitch
            checked={config.vignette ?? false}
            onChange={(v) => setConfig({ vignette: v })}
          />
        </div>
        {config.vignette && (
          <div className="pl-3 border-l-2 border-gold/20">
            <StudioSlider
              min={10} max={80} step={5}
              value={config.vignetteIntensity ?? 40}
              onChange={(v) => setConfig({ vignetteIntensity: v })}
              label="Intensité" unit="%"
            />
          </div>
        )}
      </section>

      <Separator className="bg-studio-border" />

      {/* ── Ken Burns ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <SectionLabel>Animation Ken Burns</SectionLabel>
            <p className="text-[11px] text-muted-foreground/50 mt-0.5">Zoom lent sur l&apos;image de fond</p>
          </div>
          <ToggleSwitch
            checked={config.kenBurns ?? false}
            onChange={(v) => setConfig({ kenBurns: v })}
          />
        </div>
        {config.kenBurns && (
          <div className="pl-3 border-l-2 border-gold/20">
            <StudioSlider
              min={100} max={130} step={1}
              value={config.kenBurnsScale ?? 110}
              onChange={(v) => setConfig({ kenBurnsScale: v })}
              label="Zoom final" unit="%"
            />
          </div>
        )}
      </section>

      <Separator className="bg-studio-border" />

      {/* ── Transitions ── */}
      <section className="space-y-2">
        <SectionLabel>Transition entre versets</SectionLabel>
        <div className="space-y-1.5">
          {([
            { id: "fade",  label: "Fondu enchaîné",  desc: "Transition douce par opacité" },
            { id: "slide", label: "Glissement",       desc: "Le verset entre par le bas"   },
            { id: "none",  label: "Coupure nette",    desc: "Aucune transition"             },
          ] as const).map(({ id, label, desc }) => {
            const active = config.verseTransition === id;
            return (
              <button
                key={id}
                onClick={() => setConfig({ verseTransition: id })}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-gold/40",
                  active
                    ? "border-gold/40 bg-gold/10"
                    : "border-studio-border hover:border-gold/30 hover:bg-white/4"
                )}
              >
                <div className={cn(
                  "w-3 h-3 rounded-full border-2 flex-shrink-0 transition-colors duration-200",
                  active
                    ? "border-gold bg-gold shadow-[0_0_6px_hsl(var(--gold)/0.5)]"
                    : "border-studio-bright"
                )} />
                <div>
                  <p className={cn("text-sm", active ? "text-gold" : "text-foreground/80")}>{label}</p>
                  <p className="text-[11px] text-muted-foreground/60">{desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <Separator className="bg-studio-border" />

      {/* ── Pause entre versets ── */}
      <section className="space-y-2">
        <SectionLabel>Pause entre versets</SectionLabel>
        <StudioSlider
          min={0} max={5000} step={250}
          value={config.pauseBetweenVerses ?? 1000}
          onChange={(v) => setConfig({ pauseBetweenVerses: v })}
          label="Durée" unit="ms"
        />
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
