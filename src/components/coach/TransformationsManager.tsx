"use client";

import type { TransformationRow } from "@/db/schema";
import { compressImage, readAsDataUrl } from "@/lib/image";
import { resolveUpload } from "@/lib/plans";
import {
  CalendarDays,
  Droplet,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Plus,
  Scale,
  TrendingUp,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState, LoadingGrid } from "./ui";

type Slot = "beforeImage" | "afterImage";

const EMPTY_FORM = {
  clientName: "",
  duration: "",
  weightBefore: "",
  weightAfter: "",
  bodyFatBefore: "",
  bodyFatAfter: "",
  muscleBefore: "",
  muscleAfter: "",
  story: "",
  storyAuthor: "الكابتن",
};

/** يضغط صورة التحوّل في المتصفح ويرجعها كـ Data URL */
async function toDataUrl(file: File): Promise<string> {
  try {
    return await compressImage(file, 1300, 0.8);
  } catch {
    return readAsDataUrl(file);
  }
}

export default function TransformationsManager({
  headers,
}: {
  headers: Record<string, string>;
}) {
  const [rows, setRows] = useState<TransformationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [files, setFiles] = useState<Record<Slot, File | null>>({
    beforeImage: null,
    afterImage: null,
  });
  const [previews, setPreviews] = useState<Record<Slot, string | null>>({
    beforeImage: null,
    afterImage: null,
  });
  const [form, setForm] = useState(EMPTY_FORM);

  async function load() {
    try {
      const res = await fetch("/api/transformations", { headers, cache: "no-store" });
      const json = await res.json();
      if (json.ok) setRows(json.data ?? []);
    } catch {
      /* تجاهل */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function setSlot(slot: Slot, file: File | null) {
    setFiles((prev) => ({ ...prev, [slot]: file }));
    setPreviews((prev) => {
      if (prev[slot]) URL.revokeObjectURL(prev[slot]!);
      return { ...prev, [slot]: file ? URL.createObjectURL(file) : null };
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!files.beforeImage || !files.afterImage) {
      setError("برجاء رفع صورتي قبل وبعد");
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.set(key, value));
      data.set("beforeImage", await toDataUrl(files.beforeImage));
      data.set("afterImage", await toDataUrl(files.afterImage));

      const res = await fetch("/api/transformations", { method: "POST", headers, body: data });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "تعذّر حفظ التحوّل");
        return;
      }
      setSuccess("تم نشر التحوّل — اضغط على بطاقته في الصفحة الرئيسية لعرض التفاصيل");
      setForm(EMPTY_FORM);
      setSlot("beforeImage", null);
      setSlot("afterImage", null);
      await load();
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublish(row: TransformationRow) {
    await fetch(`/api/transformations/${row.id}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !row.isPublished }),
    });
    await load();
  }

  async function remove(row: TransformationRow) {
    if (!confirm(`حذف تحوّل "${row.clientName}" نهائياً؟`)) return;
    await fetch(`/api/transformations/${row.id}`, { method: "DELETE", headers });
    await load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-[1.5rem] border border-white/10 bg-coal-900/70 p-4 sm:items-center sm:p-6">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-500/15 text-gold-300">
          <ImagePlus size={20} />
        </span>
        <div>
          <h2 className="text-sm font-black sm:text-base">إدارة التحوّلات</h2>
          <p className="mt-0.5 text-[11px] leading-5 text-bone/45">
            كل التفاصيل التي تدخلها هنا تظهر تلقائياً داخل النافذة المنبثقة عند
            الضغط على البطاقة في الصفحة الرئيسية
          </p>
        </div>
      </div>

      {/* نموذج إضافة */}
      <form
        onSubmit={submit}
        className="space-y-5 rounded-[1.5rem] border border-white/10 bg-coal-900/70 p-4 sm:p-6"
      >
        <h3 className="text-sm font-black text-gold-300">إضافة تحوّل جديد</h3>

        {/* بيانات أساسية */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-bone/60">
              اسم العميل (أو اللقب) *
            </label>
            <input
              required
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              className="field"
              placeholder="مثال: محمود سعيد"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-bone/60">
              مدة التحوّل *
            </label>
            <input
              required
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              className="field"
              placeholder="مثال: 3 شهور / 12 أسبوع"
            />
          </div>
        </div>

        {/* الصور */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {(
            [
              ["beforeImage", "صورة قبل *"],
              ["afterImage", "صورة بعد *"],
            ] as const
          ).map(([slot, label]) => (
            <label
              key={slot}
              className="group relative flex aspect-[3/4] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/20 bg-white/[0.02] transition hover:border-gold-500/50 hover:bg-gold-500/5"
            >
              {previews[slot] ? (
                <>
                  <img
                    src={previews[slot]!}
                    alt={label}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <span className="absolute right-2 top-2 rounded-full bg-coal-950/80 px-3 py-1 text-[10px] font-black">
                    {label}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSlot(slot, null);
                    }}
                    className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-coal-950/80 transition hover:bg-red-500"
                    aria-label="إزالة"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-gold-500/15 text-gold-300 transition-transform group-hover:scale-110">
                    <ImagePlus size={22} />
                  </span>
                  <span className="mt-3 text-sm font-extrabold">{label}</span>
                  <span className="mt-1 px-4 text-center text-[10px] leading-5 text-bone/40">
                    نفس الوضع ونفس الملابس لوضوح المقارنة
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => setSlot(slot, e.target.files?.[0] ?? null)}
              />
            </label>
          ))}
        </div>

        {/* القياسات */}
        <div>
          <h4 className="mb-3 text-xs font-black text-bone/70">
            القياسات — تظهر داخل النافذة المنبثقة
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {(
              [
                ["weightBefore", "الوزن قبل", "104 كجم", Scale],
                ["weightAfter", "الوزن الحالي", "82 كجم", Scale],
                ["bodyFatBefore", "نسبة الدهون قبل", "32%", Droplet],
                ["bodyFatAfter", "نسبة الدهون الحالية", "17%", Droplet],
                ["muscleBefore", "الكتلة العضلية قبل", "36 كجم", TrendingUp],
                ["muscleAfter", "الكتلة العضلية الحالية", "43 كجم", TrendingUp],
              ] as const
            ).map(([key, label, placeholder, Icon]) => (
              <div key={key}>
                <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-bone/60">
                  <Icon size={12} className="text-gold-400" />
                  {label}
                </label>
                <input
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="field"
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>
        </div>

        {/* القصة */}
        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-bone/60">
            قصة النجاح — تظهر كاملة داخل النافذة
          </label>
          <textarea
            rows={4}
            value={form.story}
            onChange={(e) => setForm({ ...form, story: e.target.value })}
            className="field resize-none"
            placeholder="اشرح التحدي وكيف تحقق الهدف… مثال: العميل كان بيعاني من كرش بعد الولادة، بدأنا بتدريب تدريجي ونظام مرن، والنتيجة بعد 12 أسبوع…"
          />
          <div className="mt-3">
            <span className="mb-2 block text-[11px] font-bold text-bone/60">
              من كاتب القصة؟
            </span>
            <div className="flex flex-wrap gap-2">
              {(["الكابتن", "العميل", "العميلة"] as const).map((author) => (
                <button
                  key={author}
                  type="button"
                  onClick={() => setForm({ ...form, storyAuthor: author })}
                  className={`rounded-full px-4 py-2 text-[11px] font-black transition ${
                    form.storyAuthor === author
                      ? "bg-gold-500 text-coal-950"
                      : "border border-white/10 text-bone/55 hover:border-gold-500/40 hover:text-gold-300"
                  }`}
                >
                  بقلم {author}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-[11px] font-bold text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-[11px] font-bold leading-6 text-emerald-200">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn-shine flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold-300 to-gold-600 py-3.5 text-sm font-black text-coal-950 transition-transform duration-300 hover:scale-[1.01] disabled:opacity-60"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          نشر التحوّل
        </button>
      </form>

      {/* القائمة */}
      {loading ? (
        <LoadingGrid count={4} height="h-64" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ImagePlus}
          text="لا توجد تحوّلات منشورة — ابدأ بإضافة أول قصة نجاح من النموذج أعلاه."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-coal-900/60"
            >
              <div className="relative grid grid-cols-2">
                <img
                  src={resolveUpload(row.beforeImage)}
                  alt="قبل"
                  className="aspect-[3/4] w-full object-cover"
                />
                <img
                  src={resolveUpload(row.afterImage)}
                  alt="بعد"
                  className="aspect-[3/4] w-full object-cover"
                />
                {!row.isPublished && (
                  <span className="absolute right-2 top-2 rounded-full bg-red-500/90 px-2.5 py-1 text-[9px] font-black text-white">
                    مخفي
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-sm font-black">{row.clientName}</h3>
                <p className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-gold-300">
                  <CalendarDays size={11} />
                  {row.duration}
                </p>
                <div className="mt-2.5 space-y-1 text-[10px] font-bold text-bone/45">
                  {row.weightBefore && row.weightAfter && (
                    <p className="flex items-center gap-1.5">
                      <Scale size={10} />
                      {row.weightBefore} ← {row.weightAfter}
                    </p>
                  )}
                  {row.bodyFatBefore && row.bodyFatAfter && (
                    <p className="flex items-center gap-1.5">
                      <Droplet size={10} />
                      دهون {row.bodyFatBefore} ← {row.bodyFatAfter}
                    </p>
                  )}
                  {row.muscleBefore && row.muscleAfter && (
                    <p className="flex items-center gap-1.5">
                      <TrendingUp size={10} />
                      عضل {row.muscleBefore} ← {row.muscleAfter}
                    </p>
                  )}
                  {row.story && (
                    <p className="line-clamp-2 text-bone/35">“{row.story}”</p>
                  )}
                </div>
                <div className="mt-3.5 flex gap-2">
                  <button
                    onClick={() => togglePublish(row)}
                    className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[10px] font-black transition ${
                      row.isPublished
                        ? "border-white/15 text-bone/60 hover:text-bone"
                        : "border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/10"
                    }`}
                  >
                    {row.isPublished ? <EyeOff size={12} /> : <Eye size={12} />}
                    {row.isPublished ? "إخفاء" : "نشر"}
                  </button>
                  <button
                    onClick={() => remove(row)}
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-bone/40 transition hover:border-red-400/50 hover:text-red-300"
                    aria-label="حذف"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
