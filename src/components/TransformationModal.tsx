"use client";

import type { TransformationRow } from "@/db/schema";
import { resolveUpload } from "@/lib/plans";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Droplet,
  Minus,
  Plus,
  Quote,
  RotateCcw,
  Scale,
  TrendingDown,
  TrendingUp,
  X,
  ZoomIn,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

/* ================= أدوات مساعدة ================= */
function parseNum(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /-?\d+(?:\.\d+)?/.exec(value);
  return match ? Number(match[0]) : null;
}

function fmtDelta(delta: number): string {
  const rounded = Math.round(delta * 10) / 10;
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

/* ================= عارض الصورة بالتكبير ================= */
function ZoomViewer({
  src,
  label,
  onClose,
}: {
  src: string;
  label: string;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const movedRef = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function applyZoom(next: number) {
    const clamped = Math.min(4, Math.max(1, Math.round(next * 10) / 10));
    setZoom(clamped);
    if (clamped === 1) setOffset({ x: 0, y: 0 });
  }

  function toggle() {
    if (zoom > 1) applyZoom(1);
    else applyZoom(2.5);
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col bg-coal-950/[0.98] backdrop-blur-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-3 sm:gap-3 sm:px-6 sm:py-3.5">
        <span className="rounded-full bg-gold-500 px-4 py-1.5 text-[11px] font-black text-coal-950">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className="min-w-12 text-center text-xs font-black tabular-nums text-bone/50">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => applyZoom(zoom - 0.5)}
            disabled={zoom <= 1}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 text-bone/70 transition hover:border-gold-500/50 hover:text-gold-300 disabled:opacity-30 sm:h-9 sm:w-9"
            aria-label="تصغير"
          >
            <Minus size={15} />
          </button>
          <button
            onClick={() => applyZoom(zoom + 0.5)}
            disabled={zoom >= 4}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 text-bone/70 transition hover:border-gold-500/50 hover:text-gold-300 disabled:opacity-30 sm:h-9 sm:w-9"
            aria-label="تكبير"
          >
            <Plus size={15} />
          </button>
          <button
            onClick={() => {
              setOffset({ x: 0, y: 0 });
              setZoom(1);
            }}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-bone/70 transition hover:border-gold-500/50 hover:text-gold-300"
            aria-label="إعادة الضبط"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-bone/70 transition hover:border-red-400/60 hover:text-red-300"
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div
        className="relative flex-1 select-none overflow-hidden"
        style={{
          touchAction: "none",
          cursor: zoom > 1 ? "grab" : "zoom-in",
        }}
        onPointerDown={(e) => {
          dragRef.current = { sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y };
          movedRef.current = false;
          setIsDragging(true);
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = dragRef.current;
          if (!d) return;
          const dx = e.clientX - d.sx;
          const dy = e.clientY - d.sy;
          if (Math.abs(dx) > 4 || Math.abs(dy) > 4) movedRef.current = true;
          if (zoom > 1) setOffset({ x: d.ox + dx, y: d.oy + dy });
        }}
        onPointerUp={() => {
          dragRef.current = null;
          setIsDragging(false);
          if (!movedRef.current) toggle();
        }}
        onPointerCancel={() => {
          dragRef.current = null;
          setIsDragging(false);
        }}
      >
        <img
          src={src}
          alt={label}
          draggable={false}
          className="absolute inset-0 h-full w-full object-contain will-change-transform"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transition: isDragging ? "none" : "transform 0.25s ease-out",
          }}
        />
      </div>

      <p className="border-t border-white/10 px-4 py-3 text-center text-[10px] leading-5 font-bold text-bone/40 sm:text-[11px]">
        اضغط على الصورة للتكبير / التصغير • اسحب للتحريك • Esc للإغلاق
      </p>
    </div>
  );
}

/* ================= بطاقة إحصائية ================= */
function StatCard({
  icon: Icon,
  label,
  before,
  after,
  unit,
  goodDirection,
}: {
  icon: typeof Droplet;
  label: string;
  before: string | null;
  after: string | null;
  unit?: string;
  goodDirection?: "up" | "down";
}) {
  const b = parseNum(before);
  const a = parseNum(after);
  const delta = b !== null && a !== null ? Math.round((a - b) * 10) / 10 : null;
  const isGain = delta !== null && delta > 0;
  const isGood =
    delta === null || delta === 0 || !goodDirection
      ? null
      : goodDirection === "down"
        ? delta < 0
        : delta > 0;

  return (
    <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center sm:p-4">
      <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-bone/50">
        <Icon size={13} className="text-gold-400" />
        {label}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        {before && (
          <span className="text-sm font-black text-bone/40">{before}</span>
        )}
        {before && after && (
          <ArrowLeft size={13} className="text-bone/30" />
        )}
        {after && (
          <span className="text-lg font-black text-gold-300">{after}</span>
        )}
        {!before && !after && (
          <span className="text-sm font-bold text-bone/30">غير متوفر</span>
        )}
      </div>

      {delta !== null && delta !== 0 && (
        <div
          className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ${
            isGood === null
              ? "bg-white/[0.07] text-bone/60"
              : isGood
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-red-500/15 text-red-300"
          }`}
        >
          {isGain ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {fmtDelta(delta)} {unit}
        </div>
      )}
    </div>
  );
}

/* ================= لوحة صورة قبل/بعد ================= */
function ImagePane({
  src,
  label,
  tone,
  onZoom,
}: {
  src: string;
  label: string;
  tone: "before" | "after";
  onZoom: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-coal-950">
      <img
        src={src}
        alt={`${label} التحوّل`}
        className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-coal-950/70 to-transparent" />
      <span
        className={`pointer-events-none absolute right-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-black sm:right-3 sm:top-3 sm:px-4 sm:text-[11px] ${
          tone === "before"
            ? "bg-gold-500 text-coal-950"
            : "bg-coal-950/80 text-bone backdrop-blur-sm"
        }`}
      >
        {label}
      </span>
      <button
        onClick={onZoom}
        className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-coal-950/80 px-2.5 py-1.5 text-[10px] font-black text-bone backdrop-blur-md transition-all duration-300 hover:bg-gold-500 hover:text-coal-950 sm:bottom-3 sm:left-3 sm:gap-1.5 sm:px-4 sm:py-2 sm:text-[11px]"
      >
        <ZoomIn size={13} />
        تكبير
      </button>
    </div>
  );
}

/* ================= النافذة الرئيسية ================= */
export default function TransformationModal({
  row,
  onClose,
}: {
  row: TransformationRow;
  onClose: () => void;
}) {
  const [zoomTarget, setZoomTarget] = useState<{ src: string; label: string } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !zoomTarget) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, zoomTarget]);

  const authorLabel =
    row.storyAuthor === "العميل" || row.storyAuthor === "العميلة"
      ? "بقلم العميل"
      : row.storyAuthor === "الكابتن"
        ? "بقلم الكابتن عبد الله النعناع"
        : "قصته مع الكابتن";

  const hasAnyStat = Boolean(
    row.weightBefore ||
      row.weightAfter ||
      row.bodyFatBefore ||
      row.bodyFatAfter ||
      row.muscleBefore ||
      row.muscleAfter,
  );

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-coal-950/90 p-3 backdrop-blur-md sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`تفاصيل تحوّل ${row.clientName}`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 26 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        className="modal-sheet mx-auto my-2 w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-gold-500/25 bg-coal-900 shadow-[0_60px_140px_-40px_rgba(0,0,0,0.95)] sm:my-3 sm:rounded-[2rem]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* رأس النافذة */}
        <div className="relative border-b border-white/[0.07] p-4 sm:p-7">
          <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-gold-500/15 blur-[70px]" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1.5 text-[10px] font-black text-gold-300">
                <Quote size={11} />
                قصّة تحوّل موثّقة
              </span>
              <h2 className="mt-2.5 text-2xl font-black leading-tight sm:mt-3 sm:text-3xl lg:text-4xl">
                {row.clientName}
              </h2>
              <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-gold-500/15 px-3.5 py-1.5 text-xs font-black text-gold-300">
                <CalendarDays size={13} />
                مدة التحوّل: {row.duration}
              </p>
            </div>
            <button
              onClick={onClose}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-bone/70 transition hover:border-red-400/60 hover:bg-red-500/10 hover:text-red-300"
              aria-label="إغلاق"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* الصور */}
        <div className="grid grid-cols-2 gap-2.5 p-4 sm:gap-4 sm:p-7">
          <ImagePane
            src={resolveUpload(row.beforeImage)}
            label="قبل"
            tone="before"
            onZoom={() =>
              setZoomTarget({ src: resolveUpload(row.beforeImage), label: "صورة قبل التحوّل" })
            }
          />
          <ImagePane
            src={resolveUpload(row.afterImage)}
            label="بعد"
            tone="after"
            onZoom={() =>
              setZoomTarget({ src: resolveUpload(row.afterImage), label: "صورة بعد التحوّل" })
            }
          />
        </div>

        {/* الإحصائيات */}
        {hasAnyStat && (
          <div className="grid grid-cols-1 gap-2.5 px-4 pb-4 sm:grid-cols-3 sm:gap-3 sm:px-7 sm:pb-6">
            <StatCard
              icon={Scale}
              label="الوزن"
              before={row.weightBefore}
              after={row.weightAfter}
              unit="كجم"
            />
            <StatCard
              icon={Droplet}
              label="نسبة الدهون"
              before={row.bodyFatBefore}
              after={row.bodyFatAfter}
              unit="%"
              goodDirection="down"
            />
            <StatCard
              icon={TrendingUp}
              label="الكتلة العضلية"
              before={row.muscleBefore}
              after={row.muscleAfter}
              unit="كجم"
              goodDirection="up"
            />
          </div>
        )}

        {/* قصة النجاح */}
        {row.story && (
          <div className="px-4 pb-4 sm:px-7 sm:pb-6">
            <div className="rounded-[1.25rem] border border-gold-500/20 bg-gold-500/[0.05] p-4 sm:rounded-[1.5rem] sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-black text-gold-300">
                  <Quote size={14} />
                  قصة النجاح
                </h3>
                <span className="rounded-full bg-white/[0.07] px-3 py-1 text-[10px] font-black text-bone/50">
                  {authorLabel}
                </span>
              </div>
              <p className="mt-3 text-[13px] leading-7 text-bone/75 sm:mt-4 sm:text-sm sm:leading-8">{row.story}</p>
            </div>
          </div>
        )}

        {/* دعوة لاتخاذ إجراء */}
        <div className="flex flex-col items-stretch gap-3 border-t border-white/[0.07] bg-coal-950/40 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:p-6 sm:px-7">
          <p className="text-xs font-bold leading-6 text-bone/50 sm:text-center">
            جاهز تبدأ قصيتك انت كمان؟
          </p>
          <a
            href="#register"
            onClick={onClose}
            className="btn-shine inline-flex items-center gap-2.5 rounded-full bg-gradient-to-l from-gold-300 to-gold-600 px-7 py-3 text-sm font-black text-coal-950 transition-transform duration-300 hover:scale-[1.03]"
          >
            ابدأ تحوّلك الآن
            <ArrowLeft size={16} />
          </a>
        </div>
      </motion.div>

      {zoomTarget && (
        <ZoomViewer
          src={zoomTarget.src}
          label={zoomTarget.label}
          onClose={() => setZoomTarget(null)}
        />
      )}
    </div>
  );
}
