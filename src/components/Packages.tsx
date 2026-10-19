"use client";

import { Check, Crown, Flame, Rocket } from "lucide-react";
import Reveal from "./Reveal";

const ICONS: Record<string, typeof Rocket> = {
  starter: Rocket,
  transform: Flame,
  elite: Crown,
};

const FEATURES: Record<string, string[]> = {
  starter: [
    "نظام تدريبي مخصص لمستواك وهدفك",
    "نظام غذائي بسعرات محسوبة",
    "متابعة أسبوعية عبر واتساب",
    "تعديل الخطة حسب تقدمك",
  ],
  transform: [
    "كل مميزات الباقة الشهرية",
    "متابعة يومية وتعديل كل أسبوعين",
    "تحليل تقارير InBody",
    "مكالمة تقييم شهرية مع الكابتن",
    "خطة وجبات ببدائل مرنة",
  ],
  elite: [
    "كل مميزات باقة 3 شهور",
    "متابعة لحظية وأولوية رد فوري",
    "تحليل InBody دورياً وتعديل فوري",
    "مكالمة أسبوعية مع الكابتن",
    "خطة تجهيز للتصوير والمسابقات",
    "دخول مجتمع العملاء الخاص",
  ],
};

const PACKAGES = [
  {
    id: "transform",
    title: "باقة المتابعة 3 شهور",
    duration: "3 شهور",
    price: "1,350",
    tagline: "اختيار الأغلبية للتحول الحقيقي",
    featured: true,
  },
  {
    id: "starter",
    title: "باقة المتابعة الشهرية",
    duration: "شهر واحد",
    price: "499",
    tagline: "ابدأ رحلتك بخطوة صحيحة",
    featured: false,
  },
  {
    id: "elite",
    title: "باقة المتابعة 6 شهور",
    duration: "6 شهور",
    price: "2,600",
    tagline: "أفضل قيمة لأطول تحول ممكن",
    featured: false,
  },
];

export function selectPackage(id: string) {
  window.dispatchEvent(new CustomEvent("elnanaa:select-package", { detail: id }));
  document.getElementById("register")?.scrollIntoView({ behavior: "smooth" });
}

export default function Packages() {
  return (
    <section id="packages" className="relative overflow-hidden py-28 lg:py-36">
      <div className="pointer-events-none absolute -right-32 top-24 h-96 w-96 rounded-full bg-gold-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -left-32 bottom-24 h-96 w-96 rounded-full bg-gold-600/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-black tracking-[0.25em] text-gold-400 sm:text-xs sm:tracking-[0.35em]">
            03 — باقات المتابعة
          </span>
          <h2 className="mt-4 text-3xl font-black leading-tight sm:mt-5 sm:text-4xl lg:text-5xl xl:text-6xl">
            اختر باقتك… <span className="gold-gradient-text">وابدأ التحوّل</span>
          </h2>
          <p className="mt-4 text-[13px] leading-7 text-bone/60 sm:mt-5 sm:text-sm sm:leading-8 lg:text-base">
            كل الباقات تشمل نظاماً تدريبياً وغذائياً مصمماً خصيصاً لك بعد دراسة
            بياناتك وتقاريرك، مع متابعة مستمرة من الكابتن — ادفع بسهولة عبر
            InstaPay أو Fawry.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-3 lg:gap-8" dir="rtl">
          {PACKAGES.map((pkg, i) => {
            const Icon = ICONS[pkg.id];
            return (
              <Reveal key={pkg.id} delay={i * 0.12} className="h-full">
                <article
                  className={`group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border p-6 transition-all duration-500 hover:-translate-y-2 sm:rounded-[1.75rem] sm:p-8 ${
                    pkg.featured
                      ? "border-gold-500/60 bg-gradient-to-b from-gold-500/[0.14] to-coal-900 shadow-[0_30px_80px_-30px_rgba(217,164,65,0.5)]"
                      : "border-white/10 bg-coal-900/60 hover:border-gold-500/30"
                  }`}
                >
                  {pkg.featured && (
                    <div className="absolute left-0 top-0 rounded-br-2xl bg-gradient-to-l from-gold-400 to-gold-600 px-4 py-1.5 text-[11px] font-black text-coal-950">
                      الأكثر طلباً
                    </div>
                  )}
                  <div
                    className={`mb-6 grid h-14 w-14 place-items-center rounded-2xl transition-all duration-500 ${
                      pkg.featured
                        ? "bg-gold-500 text-coal-950"
                        : "bg-gold-500/15 text-gold-300 group-hover:bg-gold-500 group-hover:text-coal-950"
                    }`}
                  >
                    <Icon size={26} />
                  </div>

                  <h3 className="text-2xl font-black">{pkg.title}</h3>
                  <p className="mt-1.5 text-xs font-semibold text-bone/50">{pkg.tagline}</p>

                  <div className="mt-6 flex items-end gap-2">
                    <span className="text-5xl font-black tracking-tight text-gold-300">
                      {pkg.price}
                    </span>
                    <span className="pb-1.5 text-sm font-bold text-bone/50">
                      ج.م / {pkg.duration}
                    </span>
                  </div>

                  <ul className="mt-8 flex-1 space-y-3.5">
                    {FEATURES[pkg.id].map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-bone/75">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold-500/15 text-gold-300">
                          <Check size={12} strokeWidth={3.5} />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => selectPackage(pkg.id)}
                    className={`mt-8 w-full rounded-full px-4 py-3.5 text-xs font-black transition-all duration-300 active:scale-95 sm:mt-9 sm:text-sm ${
                      pkg.featured
                        ? "btn-shine bg-gradient-to-l from-gold-300 to-gold-600 text-coal-950 shadow-[0_15px_35px_-12px_rgba(217,164,65,0.8)] hover:scale-[1.03]"
                        : "border border-gold-500/40 text-gold-300 hover:bg-gold-500 hover:text-coal-950"
                    }`}
                  >
                    اشترك في {pkg.title}
                  </button>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.3}>
          <p className="mt-8 text-center text-[11px] font-semibold leading-6 text-bone/35 sm:mt-10">
            * الأسعار بالجنيه المصري — بإمكانك الترقية لباقة أطول في أي وقت وخصم
            قيمة اشتراكك الحالي.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
