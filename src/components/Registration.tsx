"use client";

import { PACKAGE_OPTIONS } from "@/lib/calories";
import { compressImage, readAsDataUrl } from "@/lib/image";
import {
  BadgeCheck,
  Camera,
  FileText,
  Loader2,
  RotateCcw,
  Smartphone,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";

type PhotoKey = "frontPhoto" | "sidePhoto" | "backPhoto";
type Status = "idle" | "sending" | "done" | "error";

const PHOTO_SLOTS: { key: PhotoKey; label: string }[] = [
  { key: "frontPhoto", label: "صورة أمامية" },
  { key: "sidePhoto", label: "صورة جانبية" },
  { key: "backPhoto", label: "صورة خلفية" },
];

/* بيانات الدفع الرسمية — مكتوبة مباشرة في الكود */
export const INSTAPAY_NUMBER = "01009611266";
export const VODAFONE_CASH_NUMBER = "01006251009";

const PAYMENT_INFO: Record<string, { title: string; lines: string[] }> = {
  instapay: {
    title: "التحويل عبر InstaPay",
    lines: [`رقم المحفظة: ${INSTAPAY_NUMBER}`, "حوّل المبلغ ثم أرسل صورة الإيصال على واتساب"],
  },
  vodafone: {
    title: "الدفع عبر فودافون كاش",
    lines: [`رقم المحفظة: ${VODAFONE_CASH_NUMBER}`, "من أي منفذ فودافون كاش أو تطبيق فودافون كاش"],
  },
};

/** يضغط الصورة في المتصفح ويرجعها كـ Data URL جاهزة للحفظ في قاعدة البيانات */
async function toDataUrl(file: File): Promise<string> {
  if (file.type === "application/pdf") return readAsDataUrl(file);
  try {
    return await compressImage(file, 1100, 0.78);
  } catch {
    return readAsDataUrl(file);
  }
}

export default function Registration() {
  const [packageId, setPackageId] = useState<string>("transform");
  const [paymentMethod, setPaymentMethod] = useState<string>("instapay");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [formKey, setFormKey] = useState(0);

  const [inbody, setInbody] = useState<File | null>(null);
  const [photos, setPhotos] = useState<Record<PhotoKey, File | null>>({
    frontPhoto: null,
    sidePhoto: null,
    backPhoto: null,
  });
  const [previews, setPreviews] = useState<Record<PhotoKey, string | null>>({
    frontPhoto: null,
    sidePhoto: null,
    backPhoto: null,
  });

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (PACKAGE_OPTIONS.some((p) => p.id === id)) setPackageId(id);
    };
    window.addEventListener("elnanaa:select-package", handler);
    return () => window.removeEventListener("elnanaa:select-package", handler);
  }, []);

  function handlePhoto(key: PhotoKey, file: File | null) {
    setPhotos((prev) => ({ ...prev, [key]: file }));
    setPreviews((prev) => {
      if (prev[key]) URL.revokeObjectURL(prev[key]!);
      return { ...prev, [key]: file ? URL.createObjectURL(file) : null };
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("sending");
    setError("");

    try {
      const data = new FormData(form);
      if (inbody) data.set("inbody", await toDataUrl(inbody));
      for (const { key } of PHOTO_SLOTS) {
        const file = photos[key];
        if (file) data.set(key, await toDataUrl(file));
      }

      const res = await fetch("/api/subscriptions", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "حدث خطأ، برجاء المحاولة مرة أخرى");
        setStatus("error");
        return;
      }
      setMessage(json.message);
      setStatus("done");
    } catch {
      setError("تعذّر إرسال الطلب، تحقق من الإنترنت وحاول مجدداً");
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setInbody(null);
    setFormKey((k) => k + 1);
    (Object.keys(photos) as PhotoKey[]).forEach((k) => handlePhoto(k, null));
    formRef.current?.reset();
  }

  const selectedPackage = PACKAGE_OPTIONS.find((p) => p.id === packageId);

  if (status === "done") {
    return (
      <section id="register" className="relative overflow-hidden py-28 lg:py-36">
        <div className="mx-auto max-w-2xl px-5 text-center">
          <div className="rounded-[2rem] border border-gold-500/30 bg-coal-900/70 p-12">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gold-500/15 text-gold-300 shadow-[0_0_50px_-10px_rgba(217,164,65,0.6)]">
              <BadgeCheck size={40} />
            </span>
            <h3 className="mt-7 text-2xl font-black leading-relaxed">{message}</h3>
            <p className="mt-4 text-sm leading-8 text-bone/60">
              احتفظ بلقطة شاشة من إيصال الدفع — سيتم مراجعة طلبك وتفعيل اشتراكك
              بعد تأكيد التحويل مباشرة.
            </p>
            <button
              onClick={reset}
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold-500/40 px-7 py-3 text-sm font-black text-gold-300 transition-all duration-300 hover:bg-gold-500 hover:text-coal-950"
            >
              <RotateCcw size={16} />
              تسجيل طلب جديد
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="register" className="relative overflow-hidden py-20 sm:py-24 lg:py-36">
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-gold-500/[0.08] blur-[130px]" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-black tracking-[0.25em] text-gold-400 sm:text-xs sm:tracking-[0.35em]">
            05 — نموذج الاشتراك
          </span>
          <h2 className="mt-4 text-3xl font-black leading-tight sm:mt-5 sm:text-4xl lg:text-5xl xl:text-6xl">
            سجّل بياناتك و<span className="gold-gradient-text">ابدأ اليوم</span>
          </h2>
          <p className="mt-4 text-[13px] leading-7 text-bone/60 sm:mt-5 sm:text-sm sm:leading-8 lg:text-base">
            نموذج شامل يمكّن الكابتن من تصميم خطتك بدقة: بياناتك، تقرير InBody،
            صور جسمك الحالية، ووسيلة الدفع المناسبة لك.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="mt-10 space-y-7 rounded-[1.5rem] border border-white/10 bg-coal-900/70 p-4 backdrop-blur-xl sm:mt-14 sm:space-y-9 sm:rounded-[2rem] sm:p-8 lg:p-10"
          >
            {/* البيانات الشخصية */}
            <fieldset>
              <legend className="mb-4 flex items-center gap-2.5 text-base font-black sm:mb-5 sm:gap-3 sm:text-lg">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-xs text-gold-300 sm:h-9 sm:w-9 sm:text-sm">1</span>
                البيانات الشخصية
              </legend>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <label className="mb-2 block text-xs font-bold text-bone/60">الاسم الكامل *</label>
                  <input name="name" required minLength={2} className="field" placeholder="مثال: أحمد محمد علي" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold text-bone/60">رقم الواتساب *</label>
                  <input name="phone" required minLength={8} className="field" placeholder="01xxxxxxxxx" dir="ltr" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold text-bone/60">السن *</label>
                  <input name="age" required type="number" min={5} max={100} className="field" placeholder="24" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold text-bone/60">الوزن (كجم) *</label>
                  <input name="weight" required type="number" step="0.1" min={20} max={300} className="field" placeholder="85" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold text-bone/60">الطول (سم) *</label>
                  <input name="height" required type="number" min={90} max={230} className="field" placeholder="178" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold text-bone/60">النوع *</label>
                  <select name="gender" className="field" defaultValue="male">
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <label className="mb-2 block text-xs font-bold text-bone/60">هدفك الرئيسي *</label>
                  <select name="goal" className="field" defaultValue="lose">
                    <option value="lose">تخسيس وحرق دهون</option>
                    <option value="maintain">الحفاظ على الوزن وتحسين الشكل</option>
                    <option value="gain">تضخيم وبناء عضلات</option>
                  </select>
                </div>
              </div>
            </fieldset>

            {/* الملفات والصور */}
            <fieldset>
              <legend className="mb-4 flex items-center gap-2.5 text-base font-black sm:mb-5 sm:gap-3 sm:text-lg">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-xs text-gold-300 sm:h-9 sm:w-9 sm:text-sm">2</span>
                تقرير InBody وصور الجسم
              </legend>

              <label className="group flex cursor-pointer items-start justify-between gap-3 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-4 transition-all duration-300 hover:border-gold-500/50 hover:bg-gold-500/5 sm:items-center sm:gap-4 sm:px-5 sm:py-5">
                <span className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-300 sm:h-12 sm:w-12">
                    <FileText size={20} className="sm:hidden" />
                    <FileText size={22} className="hidden sm:block" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-extrabold break-words sm:text-sm">
                      {inbody ? inbody.name : "ارفع تقرير InBody (اختياري)"}
                    </span>
                    <span className="mt-1 block text-[10px] leading-5 text-bone/45 sm:text-[11px]">
                      صورة أو PDF — يساعد الكابتن على قراءة تكوين جسمك بدقة
                    </span>
                  </span>
                </span>
                <Upload size={18} className="mt-1 shrink-0 text-bone/40 transition-colors group-hover:text-gold-300 sm:mt-0" />
                <input
                  key={`inbody-${formKey}`}
                  type="file"
                  accept="image/*,application/pdf"
                  className="sr-only"
                  onChange={(e) => setInbody(e.target.files?.[0] ?? null)}
                />
              </label>

              <div className="mt-3 grid grid-cols-3 gap-2.5 sm:mt-4 sm:gap-4">
                {PHOTO_SLOTS.map((slot) => (
                  <label
                    key={slot.key}
                    className="group relative flex aspect-[3/4] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/20 bg-white/[0.02] transition-all duration-300 hover:border-gold-500/50 hover:bg-gold-500/5"
                  >
                    {previews[slot.key] ? (
                      <>
                        <img
                          src={previews[slot.key]!}
                          alt={slot.label}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePhoto(slot.key, null);
                          }}
                          className="absolute left-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-coal-950/80 text-bone transition hover:bg-red-500"
                          aria-label="إزالة الصورة"
                        >
                          <X size={14} />
                        </button>
                        <span className="absolute bottom-2 right-2 rounded-full bg-coal-950/80 px-3 py-1 text-[10px] font-bold">
                          {slot.label}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="grid h-12 w-12 place-items-center rounded-xl bg-gold-500/15 text-gold-300 transition-transform duration-300 group-hover:scale-110">
                          <Camera size={22} />
                        </span>
                        <span className="mt-3 text-sm font-extrabold">{slot.label}</span>
                        <span className="mt-1 px-4 text-center text-[10px] leading-5 text-bone/40">
                          ملابس رياضية، إضاءة واضحة، جسم كامل
                        </span>
                      </>
                    )}
                    <input
                      key={`${slot.key}-${formKey}`}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => handlePhoto(slot.key, e.target.files?.[0] ?? null)}
                    />
                  </label>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-5 text-bone/40">
                صور الجسم اختيارية لكنها مطلوبة لمتابعة دقيقة للتقدم — يتم ضغطها
                تلقائياً ولا تُنشر في أي مكان.
              </p>
            </fieldset>

            {/* الباقة */}
            <fieldset>
              <legend className="mb-4 flex items-center gap-2.5 text-base font-black sm:mb-5 sm:gap-3 sm:text-lg">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-xs text-gold-300 sm:h-9 sm:w-9 sm:text-sm">3</span>
                اختر باقتك
              </legend>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
                {PACKAGE_OPTIONS.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setPackageId(pkg.id)}
                    className={`rounded-2xl border p-5 text-start transition-all duration-300 ${
                      packageId === pkg.id
                        ? "border-gold-500 bg-gold-500/10 shadow-[0_15px_40px_-18px_rgba(217,164,65,0.6)]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/25"
                    }`}
                  >
                    <span className="block text-sm font-black text-bone">{pkg.title}</span>
                    <span className="mt-1 block text-[11px] text-bone/45">{pkg.duration}</span>
                    <span className="mt-3 block text-2xl font-black text-gold-300">
                      {pkg.price.toLocaleString("ar-EG")}
                      <span className="mr-1 text-xs font-bold text-bone/45">ج.م</span>
                    </span>
                  </button>
                ))}
              </div>
              <input type="hidden" name="packageId" value={packageId} />
            </fieldset>

            {/* الدفع */}
            <fieldset>
              <legend className="mb-4 flex items-center gap-2.5 text-base font-black sm:mb-5 sm:gap-3 sm:text-lg">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-xs text-gold-300 sm:h-9 sm:w-9 sm:text-sm">4</span>
                وسيلة الدفع
              </legend>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("instapay")}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-start transition-all duration-300 sm:items-center sm:gap-4 sm:p-5 ${
                    paymentMethod === "instapay"
                      ? "border-gold-500 bg-gold-500/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/25"
                  }`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl sm:h-12 sm:w-12 bg-gradient-to-br from-purple-500/30 to-fuchsia-500/20 text-fuchsia-200">
                    <Smartphone size={22} />
                  </span>
                  <span>
                    <span className="block text-sm font-black">InstaPay</span>
                    <span className="mt-0.5 block text-[11px] text-bone/45">تحويل فوري من أي بنك أو محفظة</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("vodafone")}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-start transition-all duration-300 sm:items-center sm:gap-4 sm:p-5 ${
                    paymentMethod === "vodafone"
                      ? "border-gold-500 bg-gold-500/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/25"
                  }`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-red-500/30 to-rose-500/20 text-red-200 sm:h-12 sm:w-12">
                    <Smartphone size={22} />
                  </span>
                  <span>
                    <span className="block text-sm font-black">فودافون كاش</span>
                    <span className="mt-0.5 block text-[11px] text-bone/45">ادفع من أقرب منفذ أو التطبيق</span>
                  </span>
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-gold-500/30 bg-gold-500/[0.07] px-5 py-4">
                <div className="text-xs font-black text-gold-300">{PAYMENT_INFO[paymentMethod].title}</div>
                {PAYMENT_INFO[paymentMethod].lines.map((line) => (
                  <div key={line} className="mt-1.5 text-xs font-semibold leading-6 text-bone/70" dir="auto">
                    {line}
                  </div>
                ))}
                <div className="mt-2 text-[11px] text-bone/45">
                  المبلغ المطلوب:{" "}
                  <span className="font-black text-gold-300">
                    {selectedPackage?.price.toLocaleString("ar-EG")} ج.م
                  </span>{" "}
                  — {selectedPackage?.title}
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-bold text-bone/60">
                  رقم العملية / الرقم المرجعي للتحويل (اختياري لكن يُسرّع التفعيل)
                </label>
                <input name="paymentReference" className="field" placeholder="مثال: 123456789012" />
              </div>
              <input type="hidden" name="paymentMethod" value={paymentMethod} />
            </fieldset>

            {/* ملاحظات */}
            <div>
              <label className="mb-2 block text-xs font-bold text-bone/60">
                ملاحظات صحية أو إصابات سابقة (اختياري)
              </label>
              <textarea
                name="notes"
                rows={3}
                className="field resize-none"
                placeholder="أي تفاصيل تساعد الكابتن في تصميم برنامج آمن لك…"
              />
            </div>

            {status === "error" && (
              <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="btn-shine flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-l from-gold-300 via-gold-400 to-gold-600 py-4.5 text-lg font-black text-coal-950 shadow-[0_20px_45px_-12px_rgba(217,164,65,0.75)] transition-transform duration-300 hover:scale-[1.015] active:scale-95 disabled:opacity-60"
            >
              {status === "sending" ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  جارٍ إرسال طلب الاشتراك…
                </>
              ) : (
                <>
                  إرسال طلب الاشتراك
                  {selectedPackage && (
                    <span className="rounded-full bg-coal-950/15 px-3 py-1 text-xs">
                      {selectedPackage.price.toLocaleString("ar-EG")} ج.م
                    </span>
                  )}
                </>
              )}
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
