import { Sparkles } from "lucide-react";

const ITEMS = [
  "تدريب شخصي أونلاين",
  "أنظمة غذائية مخصصة",
  "متابعة يومية عبر واتساب",
  "تضخيم وبناء عضلات",
  "تخسيس وحرق دهون",
  "إعداد بدني للمبتدئين",
  "تحليل تقارير InBody",
  "استشارات تغذية رياضية",
];

function Row({ hidden }: { hidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={hidden}>
      {ITEMS.map((item) => (
        <span key={item} className="flex items-center gap-7 pl-7">
          <span className="whitespace-nowrap text-sm font-black tracking-wide sm:text-base">
            {item}
          </span>
          <Sparkles size={16} className="shrink-0 opacity-70" />
        </span>
      ))}
    </div>
  );
}

export default function Marquee() {
  return (
    <section className="relative z-10 -rotate-1 border-y-2 border-coal-950 bg-gradient-to-l from-gold-300 via-gold-400 to-gold-600 py-4 text-coal-950 shadow-[0_20px_60px_-20px_rgba(217,164,65,0.5)]">
      <div dir="ltr" className="flex w-max animate-marquee">
        <Row />
        <Row hidden />
      </div>
    </section>
  );
}
