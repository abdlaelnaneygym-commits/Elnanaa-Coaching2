"use client";

import type { FoodRow, RecipeRow } from "@/db/schema";
import { compressImage } from "@/lib/image";
import { itemTotals } from "@/lib/plans";
import {
  BookOpen,
  Camera,
  ChefHat,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FoodPicker } from "./pickers";
import { CoachBadge, EmptyState, LoadingGrid, Modal, Stepper } from "./ui";

const CATEGORIES = ["إفطار", "غداء", "عشاء", "سناك", "حلويات دايت"];

interface IngredientLine {
  name: string;
  grams: number;
}

export default function RecipesManager({ headers }: { headers: Record<string, string> }) {
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [foods, setFoods] = useState<FoodRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");
  const [modalOpen, setModalOpen] = useState(false);
  const [foodPickerOpen, setFoodPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    nameEn: "",
    category: "إفطار",
    steps: "",
    image: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<IngredientLine[]>([]);
  const [manualMacros, setManualMacros] = useState({ calories: "", protein: "", carbs: "", fats: "", fiber: "" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/recipes", { headers, cache: "no-store" });
      const json = await res.json();
      if (json.ok) setRecipes(json.data ?? []);
    } catch {
      /* تجاهل */
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    load();
    fetch("/api/foods", { headers, cache: "no-store" })
      .then((r) => r.json())
      .then((json) => json.ok && setFoods(json.data ?? []))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () =>
      recipes.filter(
        (r) =>
          (!query.trim() || r.name.includes(query.trim())) &&
          (category === "الكل" || r.category === category),
      ),
    [recipes, query, category],
  );

  /** إجماليات محسوبة تلقائياً من مكونات المكتبة */
  const autoTotals = useMemo(() => {
    let cal = 0, pro = 0, carb = 0, fat = 0;
    for (const ing of ingredients) {
      const food = foods.find((fd) => fd.name === ing.name);
      if (food) {
        const t = itemTotals({ foodId: food.id, name: food.name, grams: ing.grams, kcal: food.kcal, protein: food.protein, carbs: food.carbs, fats: food.fats });
        cal += t.calories; pro += t.protein; carb += t.carbs; fat += t.fats;
      }
    }
    return { calories: Math.round(cal), protein: Math.round(pro), carbs: Math.round(carb), fats: Math.round(fat) };
  }, [ingredients, foods]);

  function openCreate() {
    setForm({ name: "", nameEn: "", category: "إفطار", steps: "", image: "" });
    setImagePreview(null);
    setIngredients([]);
    setManualMacros({ calories: "", protein: "", carbs: "", fats: "", fiber: "" });
    setError("");
    setModalOpen(true);
  }

  async function handleImage(file: File | null) {
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 900, 0.8);
      setForm((prev) => ({ ...prev, image: dataUrl }));
      setImagePreview(dataUrl);
    } catch {
      setError("تعذّرت معالجة الصورة");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    // القيم اليدوية لها أولوية؛ وإلا القدرات تلقائياً من المكونات
    const calories = Number(manualMacros.calories) || autoTotals.calories;
    const protein = Number(manualMacros.protein) || autoTotals.protein;
    const carbs = Number(manualMacros.carbs) || autoTotals.carbs;
    const fats = Number(manualMacros.fats) || autoTotals.fats;
    const fiber = Number(manualMacros.fiber) || 0;

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          nameEn: form.nameEn,
          category: form.category,
          ingredients,
          steps: form.steps,
          calories, protein, carbs, fats, fiber,
          image: form.image,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "تعذّر حفظ الوصفة");
        return;
      }
      setModalOpen(false);
      setNotice(`✓ أُضيفت الوصفة «${form.name}» إلى كتاب الوصفات`);
      setTimeout(() => setNotice(""), 4000);
      await load();
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  /** حذف من Neon فعلياً مع تحديث فوري */
  async function remove(recipe: RecipeRow) {
    if (!confirm(`حذف وصفة «${recipe.name}» نهائياً من قاعدة البيانات؟`)) return;
    setRemovingId(recipe.id);
    setError("");
    try {
      const res = await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE", headers });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(`تعذّر حذف الوصفة — ${json?.error ?? "خطأ"}`);
        return;
      }
      setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
      setNotice(`✓ حُذفت الوصفة «${recipe.name}»`);
      setTimeout(() => setNotice(""), 3000);
    } catch {
      setError("تعذّر الاتصال بالخادم — لم تُحذف الوصفة");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/10 bg-coal-900/70 p-4 sm:gap-4 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-300">
            <BookOpen size={20} />
          </span>
          <div>
            <h2 className="text-sm font-black sm:text-base">كتاب الوصفات الدايت</h2>
            <p className="mt-0.5 text-[11px] text-bone/45">
              {recipes.length} وصفة — يُدرج كل منها بنقرة واحدة كخيار بديل داخل باني النظام الغذائي
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="btn-shine inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-gold-300 to-gold-600 px-6 py-3 text-xs font-black text-coal-950 transition-transform duration-300 hover:scale-[1.03]"
        >
          <Plus size={15} />
          وصفة جديدة
        </button>
      </div>

      {notice && (
        <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-[11px] font-black text-emerald-200">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-[11px] font-bold text-red-200">
          {error}
        </div>
      )}

      {/* البحث والفلترة */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full min-w-0 flex-1 sm:min-w-56">
          <Search size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-bone/35" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="field pr-11" placeholder="ابحث في الوصفات…" />
        </div>
        <div className="flex flex-wrap gap-2">
          {["الكل", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3.5 py-2 text-[11px] font-black transition ${category === cat ? "bg-gold-500 text-coal-950" : "border border-white/10 text-bone/55 hover:border-gold-500/40 hover:text-gold-300"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingGrid count={4} height="h-44" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          text="لا توجد وصفات مطابقة — أضف أول وصفة من الزر أعلاه، وسيظهر جزءها مباشرة داخل باني النظام الغذائي."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((recipe) => (
            <article key={recipe.id} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-coal-900/60 transition hover:border-gold-500/40">
              {recipe.image && (
                <img src={recipe.image} alt={recipe.name} className="h-36 w-full object-cover" />
              )}
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-black leading-6">{recipe.name}</h3>
                    {recipe.nameEn && (
                      <p className="text-[10px] font-bold text-bone/35" dir="ltr">{recipe.nameEn}</p>
                    )}
                  </div>
                  <CoachBadge>{recipe.category}</CoachBadge>
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

                {recipe.steps && (
                  <p className="mt-3 line-clamp-2 text-[11px] leading-6 text-bone/50">{recipe.steps}</p>
                )}

                <div className="mt-4 flex items-center gap-2">
                  <span className="flex-1 text-[10px] font-bold text-bone/35">
                    التركيب: {recipe.ingredients?.length ?? 0} مكوناً
                  </span>
                  <button
                    onClick={() => remove(recipe)}
                    disabled={removingId === recipe.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 px-3 py-1.5 text-[10px] font-black text-red-300 transition hover:bg-red-500/15 disabled:opacity-50"
                  >
                    {removingId === recipe.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                    حذف
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* نافذة إضافة وصفة */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} wide title="وصفة جديدة" subtitle="المكونات من المكتبة تحسب القيم تلقائياً (يمكنك تعديل الإجمالي يدوياً)">
        <form onSubmit={submit} className="space-y-4 pb-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-bone/60">اسم الوصفة (عربي) *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" placeholder="مثال: شوفان بروتين الفطور" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-bone/60">الاسم بالإنجليزية</label>
              <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="field" dir="ltr" placeholder="Protein Oatmeal" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-bone/60">الفئة *</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat })}
                  className={`rounded-full px-4 py-2 text-[11px] font-black transition ${form.category === cat ? "bg-gold-500 text-coal-950" : "border border-white/10 text-bone/55"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* المكونات */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[11px] font-bold text-bone/60">المكونات والمقادير (جم) *</label>
              <button
                type="button"
                onClick={() => setFoodPickerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-gold-500 px-3.5 py-1.5 text-[10px] font-black text-coal-950"
              >
                <Plus size={11} />
                من المكتبة
              </button>
            </div>
            {ingredients.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 px-4 py-4 text-center text-[11px] font-bold text-bone/35">
                لا مكونات بعد — أضف من مكتبة الأغذية
              </p>
            ) : (
              <div className="space-y-2">
                {ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-xs font-extrabold">{ing.name}</span>
                    <div className="w-32">
                      <Stepper
                        value={ing.grams}
                        onChange={(v) => setIngredients((prev) => prev.map((x, xi) => (xi === i ? { ...x, grams: v } : x)))}
                        step={10}
                        min={5}
                        max={1000}
                        suffix="جم"
                      />
                    </div>
                    <button type="button" onClick={() => setIngredients((prev) => prev.filter((_, xi) => xi !== i))} className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-bone/40 transition hover:text-red-300" aria-label="حذف">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-bone/60">طريقة التحضير خطوة بخطوة</label>
            <textarea rows={3} value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} className="field resize-none" placeholder="1) سخّن الحليب…&#10;2) أضف الشوفان…" />
          </div>

          {/* القيم الغذائية — تلقائية مع تعديل يدوي */}
          <div className="rounded-2xl border border-gold-500/25 bg-gold-500/[0.05] p-3.5">
            <p className="mb-2 text-[10px] font-black text-gold-300">
              القيم الغذائية الكلية — {autoTotals.calories > 0 ? `محسوبة تلقائياً من المكونات: ${autoTotals.calories} سعر` : "أدخلها يدوياً"}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {(
                [
                  ["calories", "سعرات"],
                  ["protein", "بروتين"],
                  ["carbs", "كارب"],
                  ["fats", "دهون"],
                  ["fiber", "ألياف"],
                ] as const
              ).map(([key, label]) => {
                const auto = key === "calories" ? autoTotals.calories : key === "protein" ? autoTotals.protein : key === "carbs" ? autoTotals.carbs : key === "fats" ? autoTotals.fats : 0;
                return (
                  <div key={key}>
                    <label className="mb-1 block text-center text-[9px] font-bold text-bone/45">{label}</label>
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={manualMacros[key]}
                      onChange={(e) => setManualMacros({ ...manualMacros, [key]: e.target.value })}
                      className="field px-2 py-2 text-center text-sm tabular-nums"
                      placeholder={auto > 0 ? String(auto) : "0"}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* الصورة */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-bone/60">صورة الوصفة (اختياري)</label>
            <button
              type="button"
              onClick={() => imgRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-5 text-[11px] font-black text-bone/50 transition hover:border-gold-500/50 hover:text-gold-300"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="معاينة" className="h-20 rounded-xl object-cover" />
              ) : (
                <>
                  <Camera size={15} />
                  ارفع صورة الوجبة
                </>
              )}
            </button>
            <input ref={imgRef} type="file" accept="image/*" className="sr-only" onChange={(e) => handleImage(e.target.files?.[0] ?? null)} />
          </div>

          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-200">{error}</div>
          )}

          <button
            type="submit"
            disabled={busy || ingredients.length === 0}
            className="btn-shine flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold-300 to-gold-600 py-3.5 text-sm font-black text-coal-950 disabled:opacity-60"
          >
            {busy && <Loader2 size={15} className="animate-spin" />}
            حفظ الوصفة
          </button>
        </form>
      </Modal>

      <FoodPicker
        open={foodPickerOpen}
        onClose={() => setFoodPickerOpen(false)}
        foods={foods}
        onPick={(food) => setIngredients((prev) => [...prev, { name: food.name, grams: 100 }])}
      />
    </div>
  );
}
