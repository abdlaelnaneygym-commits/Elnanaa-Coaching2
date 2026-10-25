"use client";

import { ArrowLeft, LayoutDashboard, Menu, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "#home", label: "الرئيسية" },
  { href: "#about", label: "الكابتن" },
  { href: "#transformations", label: "التحوّلات" },
  { href: "#packages", label: "الباقات" },
  { href: "#recipes", label: "الوصفات" },
  { href: "#register", label: "اشترك الآن" },
];

export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-2xl border border-gold-500/40 bg-gradient-to-br from-gold-500/20 to-transparent shadow-[0_0_28px_-6px_rgba(217,164,65,0.55)]"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 64 64" width={size * 0.62} height={size * 0.62} aria-hidden>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f3cd82" />
            <stop offset="1" stopColor="#b8862f" />
          </linearGradient>
        </defs>
        <g fill="url(#lg)">
          <rect x="8" y="20" width="10" height="24" rx="3.5" />
          <rect x="18" y="26" width="7" height="12" rx="2.5" />
          <rect x="46" y="20" width="10" height="24" rx="3.5" />
          <rect x="39" y="26" width="7" height="12" rx="2.5" />
          <rect x="25" y="28" width="14" height="8" rx="4" />
        </g>
      </svg>
    </span>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/10 bg-coal-950/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link href="#home" className="group flex items-center gap-3">
          <LogoMark />
          <span className="leading-none">
            <span className="block text-base font-black tracking-[0.18em] text-bone min-[400px]:text-lg min-[400px]:tracking-[0.22em]">
              ELNANAA
            </span>
            <span className="mt-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.42em] text-gold-400">
              COACHING
              <Sparkles size={9} className="opacity-70" />
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative text-sm font-semibold text-bone/70 transition-colors duration-300 hover:text-gold-300 after:absolute after:-bottom-1.5 after:right-0 after:h-px after:w-0 after:bg-gold-400 after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/coach"
            title="لوحة تحكم المدرب"
            className="hidden h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-bone/70 transition-all duration-300 hover:border-gold-500/50 hover:text-gold-300 sm:grid"
          >
            <LayoutDashboard size={18} />
          </Link>
          <a
            href="#register"
            className="btn-shine hidden items-center gap-2 rounded-full bg-gradient-to-l from-gold-400 to-gold-600 px-6 py-2.5 text-sm font-extrabold text-coal-950 shadow-[0_10px_30px_-10px_rgba(217,164,65,0.7)] transition-transform duration-300 hover:scale-105 lg:inline-flex"
          >
            اشترك الآن
            <ArrowLeft size={16} />
          </a>
          <button
            onClick={() => setOpen(!open)}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-bone lg:hidden"
            aria-label="القائمة"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* قائمة الموبايل */}
      <div
        className={`overflow-hidden border-b border-white/10 bg-coal-950/95 backdrop-blur-xl transition-all duration-500 lg:hidden ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col gap-1 px-4 py-3">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-bold text-bone/80 transition-colors hover:bg-white/5 hover:text-gold-300"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/coach"
            onClick={() => setOpen(false)}
            className="rounded-xl px-4 py-3 text-sm font-bold text-gold-300/90 transition-colors hover:bg-white/5"
          >
            لوحة تحكم المدرب
          </Link>
        </nav>
      </div>
    </header>
  );
}
