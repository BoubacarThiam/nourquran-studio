import { cn } from "@/lib/utils";

export function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative flex-shrink-0 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40",
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
