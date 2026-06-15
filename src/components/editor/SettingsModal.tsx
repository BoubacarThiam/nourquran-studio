"use client";

import React, { useEffect, useState } from "react";
import { X, Key, ExternalLink, CheckCircle2, AlertTriangle, Loader2, Eye, EyeOff, Trash2 } from "lucide-react";

interface ApiEntry {
  configured: boolean;
  preview: string;
}

type StatusState = "idle" | "validating" | "valid" | "invalid";

const API_DOCS: Record<string, { label: string; description: string; link: string; placeholder: string }> = {
  PEXELS_API_KEY: {
    label:       "Clé API Pexels",
    description: "Accès aux fonds vidéo et photos HD (gratuit — 200 requêtes/heure)",
    link:        "https://www.pexels.com/api/",
    placeholder: "Collez votre clé Pexels ici…",
  },
};

interface Props {
  onClose: () => void;
}

export function SettingsModal({ onClose }: Props) {
  const [settings, setSettings]   = useState<Record<string, ApiEntry>>({});
  const [inputs, setInputs]       = useState<Record<string, string>>({});
  const [show, setShow]           = useState<Record<string, boolean>>({});
  const [status, setStatus]       = useState<Record<string, StatusState>>({});
  const [saving, setSaving]       = useState<Record<string, boolean>>({});
  const [message, setMessage]     = useState<Record<string, string>>({});
  const [loadingInit, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => { setSettings(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function validate(key: string) {
    const value = inputs[key]?.trim();
    if (!value) return;
    setStatus((s) => ({ ...s, [key]: "validating" }));
    setMessage((m) => ({ ...m, [key]: "" }));
    try {
      const res  = await fetch("/api/settings/validate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ key, value }),
      });
      const data = await res.json();
      setStatus((s) => ({ ...s, [key]: data.valid ? "valid" : "invalid" }));
      setMessage((m) => ({ ...m, [key]: data.error ?? "" }));
    } catch {
      setStatus((s) => ({ ...s, [key]: "invalid" }));
      setMessage((m) => ({ ...m, [key]: "Impossible de valider" }));
    }
  }

  async function save(key: string) {
    const value = inputs[key]?.trim() ?? "";
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      await fetch("/api/settings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ key, value }),
      });
      // Re-fetch état
      const data = await fetch("/api/settings").then((r) => r.json());
      setSettings(data);
      setInputs((i) => ({ ...i, [key]: "" }));
      setStatus((s) => ({ ...s, [key]: "idle" }));
      setMessage((m) => ({ ...m, [key]: value ? "Clé enregistrée ✓" : "Clé supprimée" }));
    } catch {
      setMessage((m) => ({ ...m, [key]: "Erreur lors de la sauvegarde" }));
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  }

  async function remove(key: string) {
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      await fetch("/api/settings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ key, value: "" }),
      });
      const data = await fetch("/api/settings").then((r) => r.json());
      setSettings(data);
      setMessage((m) => ({ ...m, [key]: "Clé supprimée" }));
    } catch {
      setMessage((m) => ({ ...m, [key]: "Erreur" }));
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-studio-border overflow-hidden shadow-2xl"
        style={{ background: "hsl(var(--studio-panel))" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-studio-surface border border-studio-border flex items-center justify-center">
              <Key className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm">Clés API</p>
              <p className="text-[11px] text-muted-foreground/60">Stockées localement dans votre base de données</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/8 text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/50">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps */}
        <div className="px-6 py-5 space-y-6">
          {loadingInit ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-gold animate-spin" />
            </div>
          ) : (
            Object.entries(API_DOCS).map(([key, meta]) => {
              const entry  = settings[key];
              const st     = status[key] ?? "idle";
              const isBusy = saving[key];
              const val    = inputs[key] ?? "";

              return (
                <div key={key} className="space-y-3">
                  {/* Titre + lien doc */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{meta.label}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5">{meta.description}</p>
                    </div>
                    <a
                      href={meta.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[11px] text-gold/70 hover:text-gold transition-colors cursor-pointer flex-shrink-0 mt-0.5"
                    >
                      Obtenir une clé <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* État actuel */}
                  {entry?.configured && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald/8 border border-emerald/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald flex-shrink-0" />
                        <span className="text-xs text-muted-foreground font-mono">{entry.preview}</span>
                      </div>
                      <button
                        onClick={() => remove(key)}
                        disabled={isBusy}
                        className="p-1 rounded-lg hover:bg-destructive/20 text-muted-foreground/50 hover:text-destructive transition-colors cursor-pointer focus:outline-none disabled:opacity-40"
                        title="Supprimer la clé"
                      >
                        {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}

                  {/* Saisie nouvelle clé */}
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type={show[key] ? "text" : "password"}
                        placeholder={entry?.configured ? "Nouvelle clé pour remplacer…" : meta.placeholder}
                        value={val}
                        onChange={(e) => {
                          setInputs((i) => ({ ...i, [key]: e.target.value }));
                          setStatus((s) => ({ ...s, [key]: "idle" }));
                          setMessage((m) => ({ ...m, [key]: "" }));
                        }}
                        className="w-full bg-studio-surface border border-studio-border rounded-xl px-3 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50 transition-all duration-200 placeholder:text-muted-foreground/40"
                      />
                      <button
                        onClick={() => setShow((s) => ({ ...s, [key]: !s[key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
                      >
                        {show[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Indicateur de validation */}
                    {st === "valid" && (
                      <p className="text-xs text-emerald flex items-center gap-1.5 px-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Clé valide — prête à enregistrer
                      </p>
                    )}
                    {st === "invalid" && (
                      <p className="text-xs text-destructive flex items-center gap-1.5 px-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> {message[key] || "Clé invalide"}
                      </p>
                    )}
                    {message[key] && st === "idle" && (
                      <p className="text-xs text-muted-foreground/60 px-1">{message[key]}</p>
                    )}

                    {/* Boutons action */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => validate(key)}
                        disabled={!val.trim() || isBusy || st === "validating"}
                        className="flex-1 py-2 rounded-xl border border-studio-border text-xs font-medium hover:border-gold/30 hover:text-gold transition-all duration-200 cursor-pointer disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-gold/40 flex items-center justify-center gap-1.5"
                      >
                        {st === "validating" ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Test…</>
                        ) : "Tester la clé"}
                      </button>
                      <button
                        onClick={() => save(key)}
                        disabled={!val.trim() || isBusy || st === "invalid"}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-gold/40 flex items-center justify-center gap-1.5"
                        style={{
                          background: !val.trim() || st === "invalid"
                            ? "hsl(var(--studio-surface))"
                            : "linear-gradient(135deg, hsl(var(--gold)) 0%, hsl(43 80% 60%) 100%)",
                          color: !val.trim() || st === "invalid"
                            ? "hsl(var(--muted-foreground))"
                            : "hsl(var(--studio-bg))",
                          border: "1px solid transparent",
                        }}
                      >
                        {isBusy ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sauvegarde…</>
                        ) : "Enregistrer"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Note sécurité */}
          <p className="text-[10px] text-muted-foreground/40 text-center border-t border-studio-border pt-4">
            Les clés sont stockées dans votre base SQLite locale et ne quittent jamais votre appareil.
          </p>
        </div>
      </div>
    </div>
  );
}
