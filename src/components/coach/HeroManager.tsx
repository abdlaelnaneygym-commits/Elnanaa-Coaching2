"use client";

import { HERO_STORAGE_KEY, HERO_UPDATED_EVENT, compressImage } from "@/lib/image";
import { Check, ImageIcon, Loader2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const DEFAULT_HERO = "/images/hero-coach.jpg";

export default function HeroManager() {
  const [current, setCurrent] = useState<string>(DEFAULT_HERO);
  const [isCustom, setIsCustom] = useState(false);
  const [notice, setNotice] = useState("");
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(HERO_STORAGE_KEY);
    if (saved) {
      setCurrent(saved);
      setIsCustom(true);
    }
  }, []);

  async function handleFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice("برجاء اختيار ملف صورة صالح");
      return;
    }
    setProcessing(true);
    setNotice("");
    try {
      const dataUrl = await compressImage(file, 1920, 0.82);
      window.localStorage.setItem(HERO_STORAGE_KEY, dataUrl);
      window.dispatchEvent(new Event(HERO_UPDATED_EVENT));
      setCurrent(dataUrl);
      setIsCustom(true);
      setNotice("تم تحديث صورة الواجهة — عُد للصفحة الرئيسية لرؤيتها فوراً");
    } catch {
      setNotice("تعذّر حفظ الصورة — قد يكون حجمها كبيراً، جرّب صورة أصغر");
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function resetDefault() {
    window.localStorage.removeItem(HERO_STORAGE_KEY);
    window.dispatchEvent(new Event(HERO_UPDATED_EVENT));
    setCurrent(DEFAULT_HERO);
    setIsCustom(false);
    setNotice("تم استعادة الصورة الافتراضية");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-[1.75rem] border border-white/10 bg-coal-900/70 p-7">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-500/15 text-gold-300">
            <ImageIcon size={20} />
          </span>
          <div>
            <h2 className="text-base font-black">إدارة صورة الواجهة</h2>
            <p className="mt-0.5 text-[11px] text-bone/45">
              تُحفظ في LocalStorage وتحدّث الهيرو فوراً
            </p>
          </div>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-3xl border border-white/10">
          <img
            src={current}
            alt="معاينة صورة الواجهة"
            className="aspect-video w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-coal-950/90 to-transparent p-4">
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-black ${
                isCustom ? "bg-gold-500 text-coal-950" : "bg-white/15 text-bone"
              }`}
            >
              {isCustom ? "صورة مخصصة — من LocalStorage" : "الصورة الافتراضية"}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={processing}
            className="btn-shine inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold-300 to-gold-600 px-7 py-3.5 text-sm font-black text-coal-950 transition-transform duration-300 hover:scale-[1.02] disabled:opacity-60 sm:flex-none"
          >
            {processing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            رفع صورة جديدة
          </button>
          {isCustom && (
            <button
              onClick={resetDefault}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-black text-bone/60 transition hover:border-gold-500/40 hover:text-gold-300"
            >
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
          <div className="mt-5 rounded-2xl border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-xs font-bold leading-6 text-gold-200">
            {notice}
          </div>
        )}

        <ul className="mt-7 space-y-2 text-[11px] leading-6 text-bone/45">
          {[
            "تُضغط الصورة تلقائياً وتُحفظ داخل LocalStorage المتصفح.",
            "تُعرض بنسبتها الطبيعية (object-fit: cover) بدون تشويه.",
            "التحديث فوري — انتقل للصفحة الرئيسية وستجد الواجهة الجديدة.",
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
