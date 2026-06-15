"use client";

import React, { useState, useRef, useEffect } from "react";
import { BookOpen, Image, Type, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentTab }    from "./panels/ContentTab";
import { BackgroundTab } from "./panels/BackgroundTab";
import { TextTab }       from "./panels/TextTab";
import { EffetsTab }     from "./panels/EffetsTab";
import { BrandingTab }   from "./panels/BrandingTab";

type TabId = "content" | "background" | "text" | "effects" | "branding";

const TABS: { id: TabId; icon: React.ElementType; label: string }[] = [
  { id: "content",    icon: BookOpen, label: "Contenu"  },
  { id: "background", icon: Image,    label: "Fond"     },
  { id: "text",       icon: Type,     label: "Texte"    },
  { id: "effects",    icon: Sparkles, label: "Effets"   },
  { id: "branding",   icon: Star,     label: "Marque"   },
];

export function ControlsPanel() {
  const [activeTab, setActiveTab] = useState<TabId>("content");
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const barRef  = useRef<HTMLDivElement>(null);

  /* Anime le pill doré sous l'onglet actif */
  useEffect(() => {
    const btn = tabRefs.current[activeTab];
    const bar = barRef.current;
    if (!btn || !bar) return;
    const barRect = bar.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setPillStyle({
      left:  btnRect.left - barRect.left,
      width: btnRect.width,
    });
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full">

      {/* Tab bar avec pill animé */}
      <div ref={barRef} className="relative flex border-b border-studio-border flex-shrink-0 px-1 pt-1">

        {/* Pill de fond (indicateur actif) */}
        <div
          className="absolute top-1 h-[calc(100%-5px)] rounded-lg transition-all duration-300 ease-out"
          style={{
            left:  pillStyle.left,
            width: pillStyle.width,
            background: "linear-gradient(135deg, hsl(var(--gold) / 0.15) 0%, hsl(var(--gold) / 0.08) 100%)",
            border: "1px solid hsl(var(--gold) / 0.2)",
          }}
        />

        {/* Boutons */}
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            ref={(el) => { tabRefs.current[id] = el; }}
            onClick={() => setActiveTab(id)}
            className={cn(
              "relative flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors duration-200 cursor-pointer rounded-lg",
              activeTab === id
                ? "text-gold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn(
              "w-[15px] h-[15px] transition-transform duration-200",
              activeTab === id && "scale-110"
            )} />
            {label}
          </button>
        ))}

        {/* Bordure dorée en bas (indicateur de ligne) */}
        <div
          className="absolute bottom-0 h-[2px] rounded-full transition-all duration-300 ease-out"
          style={{
            left:  pillStyle.left + pillStyle.width * 0.2,
            width: pillStyle.width * 0.6,
            background: "linear-gradient(90deg, transparent, hsl(var(--gold)), transparent)",
          }}
        />
      </div>

      {/* Contenu de l'onglet — scrollable */}
      <div className="flex-1 overflow-y-auto studio-scrollbar">
        {activeTab === "content"    && <ContentTab />}
        {activeTab === "background" && <BackgroundTab />}
        {activeTab === "text"       && <TextTab />}
        {activeTab === "effects"    && <EffetsTab />}
        {activeTab === "branding"   && <BrandingTab />}
      </div>
    </div>
  );
}
