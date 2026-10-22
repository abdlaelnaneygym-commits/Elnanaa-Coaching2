"use client";

import { compressImage } from "@/lib/image";
import { Check, Database, ImageIcon, Loader2, RotateCcw, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_HERO = "/images/hero-coach.jpg";

/**
 * إدارة صورة الواجهة — الرفع والاستعادة عبر جدول settings في قاعدة البيانات (Neon).
 * بعد أي تعديل، الصفحة الرئيسية تقرأ القيمة مباشرة من القاعدة في كل زيارة،
 * فينعكس التغيير فوراً على جميع المستخدمين دون أي ذاكرة مؤقتة.
 */
export default function HeroManager({ headers }: { headers: Record<string, string> }) {
  const [current, setCurrent] = useState<string>(DEFAULT_HERO);
  const [isCustom, setIsCustom] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"gold" | "red">("gold");
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadCurrent = useCallback(async () => {
    try {
      const res = await fetch("/api/coach/hero-image", { headers, cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (json?.ok && json.data?.image) {
        setCurrent(json.data.image);
        setIsCustom(true);
      } else {
        setCurrent(DEFAULT_HERO);
        setIsCustom(false);
      }
    } catch {
      setCurrent(DEFAULT_HERO);
      setIsCustom(false);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    loadCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNoticeTone("red");
      setNotice("برجاء اختيار ملف صورة صالح");
      return;
    }
    setProcessing(true);
    setNotice("");
    try {
      // ضغط في المتصفح ثم إرسال كـ Data URL — نفس مسار صور التحوّلات
      const dataUrl = await compressImage(file, 1600, 0.78);
      const form = new FormData();
      form.set("image", dataUrl);

      const res = await fetch("/api/coach/hero-image", {
        method: "POST",
        headers,
        body: form,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setNoticeTone("red");
        setNotice(json?.error ?? "تعذّر حفظ الصورة، برجاء المحاولة مرة أخرى");
        return;
      }
      setCurrent(dataUrl);
      setIsCustom(true);
      setNoticeTone("gold");
      setNotice(json.message ?? "تم الحفظ — الصورة الجديدة ظاهرة الآن لجميع الزوار");
    } catch {
      setNoticeTone("red");
      setNotice("تعذّر حفظ الصورة — قد يكون حجمها كبيراً، جرّب صورة أصغر");
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function resetDefault() {
    setProcessing(true);
    setNotice("");
    try {
      const res = await fetch("/api/coach/hero-image", { method: "DELETE", headers });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setNoticeTone("red");
        setNotice(json?.error ?? "تعذّر استعادة الافتراضية");
        return;
      }
      setCurrent(DEFAULT_HERO);
      setIsCustom(false);
      setNoticeTone("gold");
      setNotice(json.message ?? "تم استعادة الصورة الافتراضية لجميع الزوار");
    } catch {
      setNoticeTone("red");
      setNotice("تعذّر الاتصال بالخادم");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-[1.75rem] border border-white/10 bg-coal-900/70 p-7">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-300">
            <ImageIcon size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-black sm:text-base">إدارة صورة الواجهة</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] leading-5 text-bone/45">
              <Database size={11} className="shrink-0 text-gold-400" />
              تُحفظ في جدول settings بقاعدة Neon — تنعكس فوراً لجميع الزوار
            </p>
          </div>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-3xl border border-white/10">
          {loading ? (
            <div className="grid aspect-video w-full animate-pulse place-items-center bg-white/[0.03]">
              <Loader2 size={22} className="animate-spin text-gold-400" />
            </div>
          ) : (
            <img
              src={current}
              alt="معاينة صورة الواجهة"
              className="aspect-video w-full object-cover"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-coal-950/90 to-transparent p-4">
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-black ${
                isCustom ? "bg-gold-500 text-coal-950" : "bg-white/15 text-bone"
              }`}
            >
              {isCustom ? "صورة مخصصة — محفوظة في قاعدة البيانات" : "الصورة الافتراضية"}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={processing || loading}
            className="btn-shine inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold-300 to-gold-600 px-7 py-3.5 text-sm font-black text-coal-950 transition-transform duration-300 hover:scale-[1.02] disabled:opacity-60 sm:flex-none"
          >
            {processing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {processing ? "جارٍ الحفظ في قاعدة البيانات…" : "رفع صورة جديدة"}
          </button>
          {isCustom && (
            <button
              onClick={resetDefault}
              disabled={processing}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-black text-bone/60 transition hover:border-gold-500/40 hover:text-gold-300 disabled:opacity-60"
            >
              <RotateCcw size={15} />
              استعادة الافتراضية
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {notice && (
          <div
            className={`mt-5 rounded-2xl border px-4 py-3 text-xs font-bold leading-6 ${
              noticeTone === "gold"
                ? "border-gold-500/30 bg-gold-500/10 text-gold-200"
                : "border-red-400/40 bg-red-500/10 text-red-200"
            }`}
          >
            {notice}
          </div>
        )}

        <ul className="mt-7 space-y-2 text-[11px] leading-6 text-bone/45">
          {[
            "تُضغط الصورة تلقائياً وتُحفظ رابطها في جدول settings بقاعدة Neon.",
            "كل الزوار يرون الصورة الجديدة فوراً — الصفحة تقرأ من القاعدة مباشرة بدون كاش.",
            "عند عدم وجود صورة مخصصة في settings تُعرض الصورة الافتراضية تلقائياً.",
            "تُعرض الصورة بنسبتها الطبيعية (object-fit: cover) بدون تشويه.",
          ].map((tip) => (
            <li key={tip} className="flex gap-2">
              <Check size={13} className="mt-1 shrink-0 text-gold-400" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
