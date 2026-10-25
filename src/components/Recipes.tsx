"use client";

import type { RecipeRow } from "@/db/schema";
import { BookOpen, ChefHat, Filter, Flame, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Reveal from "./Reveal";

const CATEGORIES = ["الكل", "إفطار", "غداء", "عشاء", "سناك", "حلويات دايت"];
const KCAL_FILTERS = [
  { id: "all", label: "كل السعرات", min: 0, max: 0 },
  { id: "lt300", label: "أقل من 300 سعر", min: 0, max: 300 },
  { id: "300to500", label: "300 — 500 سعر", min: 300, max: 500 },
  { id: "gt500", label: "أكثر من 500 سعر", min: 500, max: 0 },
];

/** كتاب الوصفات الدايت — عام للزوار والعملاء مع فلترة بالفئة والسعرات */
export default function Recipes() {
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");
  const [kcalId, setKcalId] = useState("all");
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/recipes")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setRecipes(json.data ?? []);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  // الفلترة حسب الفئة + نطاق السعرات (مناسبة لهدف العميل) + البحث
  const filtered = useMemo(() => {
    const kf = KCAL_FILTERS.find((k) => k.id === kcalId)!;
    return recipes.filter((r) => {
      if (category !== "الكل" && r.category !== category) return false;
      if (query.trim() && !r.name.includes(query.trim())) return false;
      if (kf.id !== "all") {
        if (kf.min > 0 && r.calories < kf.min) return false;
        if (kf.max > 0 && r.calories > kf.max) return false;
        if (kf.id === "gt500" && r.calories <= 500) return false;
      }
      return true;
    });
  }, [recipes, query, category, kcalId]);

  return (
    <section id="recipes" className="relative overflow-hidden py-20 sm:py-24 lg:py-36">
      <div className="pointer-events-none absolute -left-32 top-24 h-96 w-96 rounded-full bg-gold-500/[0.08] blur-[130px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-black tracking-[0.25em] text-gold-400 sm:text-xs sm:tracking-[0.35em]">
            04 — كتاب الوصفات
          </span>
          <h2 className="mt-4 text-3xl font-black leading-tight sm:mt-5 sm:text-4xl lg:text-5xl">
            وصفات دايت <span className="gold-gradient-text">لذيذة ومحسوبة بدقة</span>
          </h2>
          <p className="mt-4 text-[13px] leading-7 text-bone/60 sm:mt-5 sm:text-sm sm:leading-8">
            فلتر الوصفات حسب فئتك وسعراتك المستهدفة — كل وصفة عليها سعراتها
            وماكروزها محسوبة بالكامل، ولإدراجها في خطتك يضغط الكابتن عليها مرة
            واحدة من لوحة التحكم.
          </p>
        </Reveal>

        {/* الفلاتر */}
        <Reveal delay={0.1}>
          <div className="mx-auto mt-10 max-w-3xl space-y-3">
            <div className="relative">
              <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-bone/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="field pr-11"
                placeholder="ابحث عن وصفة… مثال: شوفان"
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-bone/40">
                <Filter size={11} />
                الفئة:
              </span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-3.5 py-1.5 text-[11px] font-black transition ${category === cat ? "bg-gold-500 text-coal-950" : "border border-white/10 text-bone/55 hover:border-gold-500/40 hover:text-gold-300"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-bone/40">
                <Flame size={11} />
                السعرات:
              </span>
              {KCAL_FILTERS.map((kf) => (
                <button
                  key={kf.id}
                  onClick={() => setKcalId(kf.id)}
                  className={`rounded-full px-3.5 py-1.5 text-[11px] font-black transition ${kcalId === kf.id ? "bg-gold-500/20 text-gold-300 border border-gold-500/50" : "border border-white/10 text-bone/55 hover:border-gold-500/40 hover:text-gold-300"}`}
                >
                  {kf.label}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* البطاقات */}
        {loading ? (
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-[1.5rem] border border-white/5 bg-white/[0.03]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Reveal delay={0.15}>
            <div className="mt-12 grid place-items-center rounded-[2rem] border border-dashed border-white/15 bg-white/[0.02] px-8 py-16 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-gold-500/10 text-gold-400">
                <ChefHat size={24} />
              </span>
              <p className="mt-4 text-sm font-semibold leading-7 text-bone/55">
                لا توجد وصفات مطابقة لهذه الفلاتر — جرّب فئة أخرى.
              </p>
            </div>
          </Reveal>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((recipe, i) => {
              const open = openId === recipe.id;
              return (
                <Reveal key={recipe.id} delay={Math.min(i, 4) * 0.07}>
                  <article className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-coal-900/60 transition-all duration-300 hover:-translate-y-1 hover:border-gold-500/40 hover:shadow-[0_25px_60px_-25px_rgba(217,164,65,0.35)]"
                    onClick={() => setOpenId(open ? null : recipe.id)}
                  >
                    {recipe.image && (
                      <img src={recipe.image} alt={recipe.name} className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-black leading-7">{recipe.name}</h3>
                        <span className="shrink-0 rounded-full bg-gold-500/15 px-3 py-1 text-[10px] font-black text-gold-300">
                          {recipe.category}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                        <div className="rounded-lg bg-gold-500/10 py-1.5">
                          <div className="text-sm font-black text-gold-300">{Math.round(recipe.calories)}</div>
                          <div className="text-[8px] font-bold text-bone/40">سعر</div>
                        </div>
                        <div className="rounded-lg bg-white/[0.04] py-1.5">
                          <div className="text-xs font-black">{Math.round(recipe.protein)}</div>
                          <div className="text-[8px] font-bold text-bone/40">بروتين</div>
                        </div>
                        <div className="rounded-lg bg-white/[0.04] py-1.5">
                          <div className="text-xs font-black">{Math.round(recipe.carbs)}</div>
                          <div className="text-[8px] font-bold text-bone/40">كارب</div>
                        </div>
                        <div className="rounded-lg bg-white/[0.04] py-1.5">
                          <div className="text-xs font-black">{Math.round(recipe.fats)}</div>
                          <div className="text-[8px] font-bold text-bone/40">دهون</div>
                        </div>
                      </div>

                      <p className="mt-3 flex-1 text-[11px] leading-6 text-bone/50">
                        {open ? recipe.steps ?? "" : (recipe.steps ?? "").slice(0, 80) + (recipe.steps && recipe.steps.length > 80 ? "…" : "")}
                      </p>
                      {recipe.steps && recipe.steps.length > 80 && (
                        <span className="mt-1 text-[10px] font-black text-gold-400/70">
                          {open ? "عرض أقل ←" : "طريقة التحضير كاملة ←"}
                        </span>
                      )}

                      <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-bone/35">
                        <BookOpen size={11} />
                        {recipe.ingredients?.length ?? 0} مكونات
                      </div>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
