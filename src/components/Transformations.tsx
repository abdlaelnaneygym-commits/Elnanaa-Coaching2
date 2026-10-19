"use client";

import type { TransformationRow } from "@/db/schema";
import { resolveUpload } from "@/lib/plans";
import { animate, motion } from "framer-motion";
import { CalendarDays, ChevronsLeftRight, Maximize2, TrendingDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import TransformationModal from "./TransformationModal";

/** بطاقة مقارنة قبل/بعد تفاعلية — السحب يحرك الفاصل، والضغط يفتح التفاصيل */
function CompareCard({
  row,
  index,
  onOpen,
}: {
  row: TransformationRow;
  index: number;
  onOpen: () => void;
}) {
  const [pos, setPos] = useState(78);
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);

  // حركة تعريفية لطيفة عند الظهور
  useEffect(() => {
    const controls = animate(88, 52, {
      duration: 1.5,
      delay: 0.25 + index * 0.15,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setPos(v),
    });
    return () => controls.stop();
  }, [index]);

  function updateFromClient(clientX: number) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, pct)));
  }

  return (
    <Reveal delay={index * 0.1} className="h-full">
      <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-coal-900/60 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold-500/40 hover:shadow-[0_30px_70px_-30px_rgba(217,164,65,0.4)]">
        <div
          ref={ref}
          className="relative aspect-[4/5] w-full cursor-ew-resize select-none overflow-hidden"
          style={{ touchAction: "pan-y" }}
          onPointerDown={(e) => {
            dragStart.current = { x: e.clientX, y: e.clientY };
            movedRef.current = false;
            setDragging(true);
            (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
            updateFromClient(e.clientX);
          }}
          onPointerMove={(e) => {
            if (!dragging) return;
            if (
              dragStart.current &&
              (Math.abs(e.clientX - dragStart.current.x) > 5 ||
                Math.abs(e.clientY - dragStart.current.y) > 5)
            ) {
              movedRef.current = true;
            }
            updateFromClient(e.clientX);
          }}
          onPointerUp={() => {
            setDragging(false);
            dragStart.current = null;
            // ضغطة بدون سحب => فتح نافذة التفاصيل
            if (!movedRef.current) onOpen();
          }}
          onPointerCancel={() => {
            setDragging(false);
            dragStart.current = null;
          }}
        >
          {/* صورة "بعد" كطبقة أساسية */}
          <img
            src={resolveUpload(row.afterImage)}
            alt={`${row.clientName} — بعد التحوّل`}
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* صورة "قبل" مقصوصة حسب موضع الفاصل */}
          <img
            src={resolveUpload(row.beforeImage)}
            alt={`${row.clientName} — قبل التحوّل`}
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          />

          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-coal-950/75 px-3.5 py-1.5 text-[11px] font-black text-bone backdrop-blur-sm">
            بعد
          </span>
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-gold-500/90 px-3.5 py-1.5 text-[11px] font-black text-coal-950">
            قبل
          </span>

          {/* الفاصل */}
          <div className="pointer-events-none absolute inset-y-0 z-10" style={{ left: `${pos}%` }}>
            <div className="absolute inset-y-0 -left-px w-0.5 bg-white/90 shadow-[0_0_18px_rgba(255,255,255,0.6)]" />
            <div
              className={`absolute top-1/2 -left-6 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border-2 border-white/90 bg-coal-950/70 text-white backdrop-blur-md transition-transform duration-200 ${
                dragging ? "scale-110" : "group-hover:scale-105"
              }`}
            >
              <ChevronsLeftRight size={20} />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-coal-950/90 to-transparent" />

          {/* زر فتح التفاصيل */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              movedRef.current = true;
              onOpen();
            }}
            className="absolute bottom-3.5 left-1/2 inline-flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/20 bg-coal-950/70 px-4 py-2 text-[10px] font-black whitespace-nowrap text-bone backdrop-blur-md transition-all duration-300 hover:border-gold-400 hover:bg-gold-500 hover:text-coal-950 sm:bottom-4 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-[11px]"
          >
            <Maximize2 size={12} className="shrink-0" />
            عرض القصة كاملة
          </button>
        </div>

        {/* المنطقة النصية — قابلة للضغط أيضاً */}
        <div onClick={onOpen} className="flex flex-1 cursor-pointer flex-col p-5 sm:p-6">
          <h3 className="text-lg font-black sm:text-xl">{row.clientName}</h3>
          <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2.5 py-1.5 text-[10px] font-black text-gold-300 sm:gap-1.5 sm:px-3 sm:text-[11px]">
              <CalendarDays size={12} className="shrink-0" />
              {row.duration}
            </span>
            {row.weightBefore && row.weightAfter && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-black text-emerald-200 sm:gap-1.5 sm:px-3 sm:text-[11px]">
                <TrendingDown size={12} className="shrink-0" />
                {row.weightBefore} ← {row.weightAfter}
              </span>
            )}
            {row.bodyFatBefore && row.bodyFatAfter && (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-1.5 text-[10px] font-black text-sky-200 sm:gap-1.5 sm:px-3 sm:text-[11px]">
                <TrendingDown size={12} className="shrink-0" />
                دهون {row.bodyFatBefore} ← {row.bodyFatAfter}
              </span>
            )}
          </div>
          {row.story && (
            <p className="mt-3 flex-1 text-[11px] leading-6 text-bone/55 sm:mt-4 sm:text-xs sm:leading-7">
              “{row.story.length > 92 ? `${row.story.slice(0, 92)}…` : row.story}”
              <span className="mt-1 block text-[10px] font-black text-gold-400/70">
                اضغط لعرض القصة كاملة ←
              </span>
            </p>
          )}
        </div>
      </article>
    </Reveal>
  );
}

export default function Transformations({
  initial,
}: {
  initial: TransformationRow[];
}) {
  const [rows, setRows] = useState<TransformationRow[]>(initial);
  const [selected, setSelected] = useState<TransformationRow | null>(null);
  const [loading, setLoading] = useState(initial.length === 0);

  // تحديث البيانات من الخادم لالتقاط أي تحوّلات جديدة أضيفها المدرب
  useEffect(() => {
    if (initial.length > 0) return;
    let cancelled = false;
    fetch("/api/transformations")
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json.ok) setRows(json.data ?? []);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initial.length]);

  return (
    <section id="transformations" className="relative overflow-hidden py-20 sm:py-24 lg:py-36">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-gold-500/[0.07] blur-[130px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-black tracking-[0.25em] text-gold-400 sm:text-xs sm:tracking-[0.35em]">
            02 — قصص نجاح حقيقية
          </span>
          <h2 className="mt-4 text-3xl font-black leading-tight sm:mt-5 sm:text-4xl lg:text-5xl xl:text-6xl">
            تحوّلات <span className="gold-gradient-text">تتحدث عن نفسها</span>
          </h2>
          <p className="mt-4 text-[13px] leading-7 text-bone/60 sm:mt-5 sm:text-sm sm:leading-8 lg:text-base">
            اسحب الفاصل يميناً وشمالاً لترى الفرق — واضغط على أي بطاقة لعرض
            التفاصيل الكاملة: الصور بحجم أكبر، الوزن، نسبة الدهون والعضلات، وقصة
            النجاح كاملة.
          </p>
        </Reveal>

        {loading ? (
          <div className="mt-12 grid grid-cols-1 gap-5 sm:mt-16 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-[480px] animate-pulse rounded-[1.75rem] border border-white/5 bg-white/[0.03] sm:h-[540px]"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <Reveal delay={0.15}>
            <div className="mt-16 grid place-items-center rounded-[2rem] border border-dashed border-white/15 bg-white/[0.02] px-8 py-20 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-gold-500/10 text-gold-400">
                <TrendingDown size={26} />
              </span>
              <p className="mt-5 max-w-md text-sm font-semibold leading-8 text-bone/55">
                قصص النجاح الجديدة قادمة قريباً — تابعنا على مواقع التواصل لمشاهدة
                أحدث تحوّلات عملاء الكابتن.
              </p>
            </div>
          </Reveal>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-5 sm:mt-16 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((row, i) => (
              <CompareCard
                key={row.id}
                row={row}
                index={i}
                onOpen={() => setSelected(row)}
              />
            ))}
          </div>
        )}

        <motion.p
          className="mt-10 text-center text-[11px] font-semibold leading-6 text-bone/35 sm:mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          * النتائج تختلف من شخص لآخر حسب الالتزام بالنظام والاستجابة الجسدية.
        </motion.p>
      </div>

      {/* نافذة تفاصيل التحوّل */}
      {selected && (
        <TransformationModal row={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
