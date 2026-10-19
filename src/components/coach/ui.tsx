"use client";

import type { LucideIcon } from "lucide-react";
import { Loader2, Minus, Plus, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto overscroll-contain bg-coal-950/85 p-3 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className={`modal-sheet my-3 w-full max-w-full rounded-[1.5rem] border border-white/10 bg-coal-900 p-4 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.95)] sm:my-6 sm:rounded-[1.75rem] sm:p-6 ${
          wide ? "sm:max-w-4xl" : "sm:max-w-lg"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-black sm:text-lg">{title}</h3>
            {subtitle && <p className="mt-1 text-xs text-bone/50">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 text-bone/60 transition hover:border-red-400/50 hover:text-red-300 sm:h-9 sm:w-9"
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** شريط تقدم حي يقارن القيمة الفعلية بالمستهدفة */
export function ProgressBar({
  label,
  value,
  target,
  unit,
  icon: Icon,
}: {
  label: string;
  value: number;
  target: number;
  unit?: string;
  icon?: LucideIcon;
}) {
  const pct = target > 0 ? (value / target) * 100 : 0;
  const clamped = Math.min(100, Math.max(0, pct));
  const inRange = pct >= 90 && pct <= 110;
  const over = pct > 110;
  const barColor = inRange
    ? "from-emerald-400 to-emerald-500"
    : over
      ? "from-red-400 to-red-500"
      : "from-gold-400 to-gold-600";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-bone/55">
          {Icon && <Icon size={12} className="text-gold-400" />}
          {label}
        </span>
        <span className="text-[10px] font-black text-bone/40">{Math.round(pct)}%</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className={`text-xl font-black ${
            inRange ? "text-emerald-300" : over ? "text-red-300" : "text-gold-300"
          }`}
        >
          {value}
        </span>
        <span className="text-[10px] font-bold text-bone/40">
          / {target} {unit}
        </span>
      </div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className={`h-full rounded-full bg-gradient-to-l transition-all duration-500 ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function Stepper({
  value,
  onChange,
  step = 10,
  min = 0,
  max = 2000,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, Math.round((value - step) * 10) / 10))}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 text-bone/60 transition hover:border-gold-500/50 hover:text-gold-300"
        aria-label="تقليل"
      >
        <Minus size={13} />
      </button>
      <div className="relative flex-1">
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
          onBlur={(e) => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n)) return onChange(min);
            onChange(Math.min(max, Math.max(min, n)));
          }}
          className="field px-2 py-1.5 text-center text-sm font-black tabular-nums"
        />
        {suffix && (
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-bone/35">
            {suffix}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, Math.round((value + step) * 10) / 10))}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 text-bone/60 transition hover:border-gold-500/50 hover:text-gold-300"
        aria-label="زيادة"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  text,
  action,
}: {
  icon: LucideIcon;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-[2rem] border border-dashed border-white/15 bg-white/[0.02] px-8 py-20 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-gold-500/10 text-gold-400">
        <Icon size={28} />
      </span>
      <p className="mt-5 max-w-md text-sm font-semibold leading-8 text-bone/50">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function LoadingGrid({ count = 4, height = "h-44" }: { count?: number; height?: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`${height} animate-pulse rounded-3xl border border-white/5 bg-white/[0.03]`} />
      ))}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-bold text-gold-300">
      <Loader2 size={14} className="animate-spin" />
      {label}
    </span>
  );
}

export function CoachBadge({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "green" | "red" | "gray" }) {
  const tones: Record<string, string> = {
    gold: "border-gold-500/40 bg-gold-500/10 text-gold-300",
    green: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
    red: "border-red-400/40 bg-red-500/10 text-red-200",
    gray: "border-white/20 bg-white/5 text-bone/60",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black ${tones[tone]}`}>
      {children}
    </span>
  );
}
