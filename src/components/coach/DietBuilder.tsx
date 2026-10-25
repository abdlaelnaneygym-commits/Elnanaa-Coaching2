"use client";

import type { FoodRow, RecipeRow } from "@/db/schema";
import type { DietContext } from "./CoachCalculator";
import {
  computeTotals,
  DEFAULT_MEAL_NAMES,
  dietPlanText,
  itemTotals,
  macroConsistencyWarning,
  macroEnergy,
  mealOptions,
  OPTION_ALERT,
  optionLabel,
  optionTotals,
  uid,
  type DietOption,
  type Meal,
} from "@/lib/plans";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Flame,
  Loader2,
  Plus,
  Save,
  Trash2,
  TriangleAlert,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FoodPicker } from "./pickers";
import { Modal, ProgressBar, Stepper } from "./ui";

interface PickerCtx {
  mealId: string;
  optionId: string;
}

export default function DietBuilder({
  headers,
  context,
  onExit,
  onPlanSaved,
}: {
  headers: Record<string, string>;
  context: DietContext;
  onExit: () => void;
  onPlanSaved: (dietPlanId: number, clientName: string) => void;
}) {
  const [foods, setFoods] = useState<FoodRow[]>([]);
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [foodsLoading, setFoodsLoading] = useState(true);
  const [meals, setMeals] = useState<Meal[]>(() =>
    DEFAULT_MEAL_NAMES.map((name) => ({
      id: uid(),
      name,
      items: [],
      options: [{ id: uid(), name: optionLabel(0), items: [] }],
    })),
  );
  const [notes, setNotes] = useState("");
  const [picker, setPicker] = useState<PickerCtx | null>(null);
  const [recipePickerMeal, setRecipePickerMeal] = useState<string | null>(null);
  const [saving, setSaving] = useState<"draft" | "confirmed" | null>(null);
  const [error, setError] = useState("");
  const [savedPlanId, setSavedPlanId] = useState<number | null>(null);
  const [savedStatus, setSavedStatus] = useState<"draft" | "confirmed" | null>(null);
  const [copied, setCopied] = useState(false);

  // الماكروز المستهدفة — قابلة للتعديل يدوياً
  const [tProtein, setTProtein] = useState(String(context.targetProtein));
  const [tCarbs, setTCarbs] = useState(String(context.targetCarbs));
  const [tFats, setTFats] = useState(String(context.targetFats));
  const tp = Number(tProtein) || 0;
  const tc = Number(tCarbs) || 0;
  const tf = Number(tFats) || 0;
  const targetsValid = tp >= 0 && tc >= 0 && tf >= 0;
  const targetCalories = macroEnergy(tp, tc, tf);

  useEffect(() => {
    Promise.all([
      fetch("/api/foods", { headers, cache: "no-store" }).then((r) => r.json()).catch(() => null),
      fetch("/api/recipes", { headers, cache: "no-store" }).then((r) => r.json()).catch(() => null),
    ]).then(([fjson, rjson]) => {
      if (fjson?.ok) setFoods(fjson.data ?? []);
      if (rjson?.ok) setRecipes(rjson.data ?? []);
      setFoodsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => computeTotals(meals), [meals]);
  const consistencyWarning = useMemo(() => macroConsistencyWarning(totals), [totals]);
  const totalItems = meals.reduce(
    (n, m) => n + mealOptions(m).reduce((s, o) => s + o.items.length, 0),
    0,
  );

  /* ==================== أدوات تعديل الخيارات ==================== */
  function updateMeal(mealId: string, patch: Partial<Meal>) {
    setMeals((prev) => prev.map((m) => (m.id === mealId ? { ...m, ...patch } : m)));
  }

  function patchOption(mealId: string, optionId: string, patch: Partial<DietOption>) {
    updateMeal(mealId, {
      options: mealOptions(getMeal(mealId)).map((o) => (o.id === optionId ? { ...o, ...patch } : o)),
    });
  }

  function getMeal(mealId: string): Meal {
    return meals.find((m) => m.id === mealId)!;
  }

  function addOption(mealId: string) {
    const options = mealOptions(getMeal(mealId));
    updateMeal(mealId, {
      options: [...options, { id: uid(), name: optionLabel(options.length), items: [] }],
    });
  }

  function removeOption(mealId: string, optionId: string) {
    const options = mealOptions(getMeal(mealId));
    if (options.length <= 1) return;
    const next = options.filter((o) => o.id !== optionId);
    updateMeal(mealId, { options: next.map((o, i) => ({ ...o, name: optionLabel(i) })) });
  }

  function moveOption(mealId: string, optionId: string, dir: -1 | 1) {
    const options = [...mealOptions(getMeal(mealId))];
    const i = options.findIndex((o) => o.id === optionId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= options.length) return;
    [options[i], options[j]] = [options[j], options[i]];
    updateMeal(mealId, { options: options.map((o, k) => ({ ...o, name: optionLabel(k) })) });
  }

  function addItem(mealId: string, optionId: string, food: FoodRow, grams = 100) {
    patchOption(mealId, optionId, {
      items: [
        ...mealOptions(getMeal(mealId)).find((o) => o.id === optionId)!.items,
        {
          foodId: food.id,
          name: food.name,
          grams,
          kcal: food.kcal,
          protein: food.protein,
          carbs: food.carbs,
          fats: food.fats,
        },
      ],
    });
  }

  function updateItemGrams(mealId: string, optionId: string, index: number, grams: number) {
    const option = mealOptions(getMeal(mealId)).find((o) => o.id === optionId)!;
    patchOption(mealId, optionId, {
      items: option.items.map((it, i) => (i === index ? { ...it, grams } : it)),
    });
  }

  function removeItem(mealId: string, optionId: string, index: number) {
    const option = mealOptions(getMeal(mealId)).find((o) => o.id === optionId)!;
    patchOption(mealId, optionId, { items: option.items.filter((_, i) => i !== index) });
  }

  /** إضافة وصفة كاملة كخيار جديد داخل الوجبة بنقرة واحدة */
  function addRecipeAsOption(mealId: string, recipe: RecipeRow) {
    const options = mealOptions(getMeal(mealId));
    const newOption: DietOption = {
      id: uid(),
      name: recipe.name,
      items: (recipe.ingredients ?? []).map((ing) => ({
        foodId: null,
        name: ing.name,
        grams: ing.grams,
        kcal: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      })),
    };
    // صفرية — نضيف في نهايتها سطر القيم الإجمالية للوصفة ليظهر الحساب صحيحًا
    newOption.items.push({
      foodId: null,
      name: `إجمالي الوصفة (${recipe.name})`,
      grams: 100,
      kcal: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fats: recipe.fats,
    });
    updateMeal(mealId, { options: [...options, newOption] });
    setRecipePickerMeal(null);
  }

  async function save(status: "draft" | "confirmed") {
    setSaving(status);
    setError("");
    try {
      const res = await fetch("/api/diet-plans", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: context.clientName,
          calculationId: context.calculationId,
          targetCalories,
          targetProtein: tp,
          targetCarbs: tc,
          targetFats: tf,
          meals: meals.map((m) => {
            const options = mealOptions(m);
            return {
              name: m.name,
              items: options[0].items,
              options: options.map((o) => ({ name: o.name, items: o.items })),
            };
          }),
          notes,
          status,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "تعذّر حفظ النظام");
        return;
      }
      setSavedPlanId(json.data.id);
      setSavedStatus(status);
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setSaving(null);
    }
  }

  async function copyPlan() {
    try {
      await navigator.clipboard.writeText(
        dietPlanText({ clientName: context.clientName, targetCalories, meals }),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* تجاهل */
    }
  }

  return (
    <div className="space-y-6 pb-28">
      {/* رأس الشاشة مع شريط التقدم الحي */}
      <div className="static rounded-[1.5rem] border border-gold-500/30 bg-coal-900/95 p-4 shadow-[0_25px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:rounded-[1.75rem] sm:p-6 lg:sticky lg:top-0 lg:z-20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-black tracking-wider text-gold-400">
              <UtensilsCrossed size={13} />
              بناء النظام الغذائي
            </div>
            <h2 className="mt-1.5 text-xl font-black sm:text-2xl">{context.clientName}</h2>
            <p className="mt-1 text-[11px] font-bold text-bone/45">
              الهدف: {targetCalories} سعر يومياً • {meals.length} وجبة • {totalItems} صنف
            </p>
          </div>
          <button
            onClick={onExit}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-[11px] font-black text-bone/55 transition hover:text-gold-300"
          >
            رجوع
            <ArrowUp size={13} className="rotate-90" />
          </button>
        </div>

        {/* الماكروز المستهدفة — قابلة للتعديل */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-2.5">
          {[
            ["بروتين مستهدف", tProtein, setTProtein],
            ["كارب مستهدف", tCarbs, setTCarbs],
            ["دهون مستهدفة", tFats, setTFats],
          ].map(([label, val, set]) => (
            <div key={label as string} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <label className="mb-1 block text-center text-[9px] font-bold text-bone/45">{label as string}</label>
              <div className="flex items-center justify-center gap-1">
                <input
                  type="number"
                  min={0}
                  value={val as string}
                  onChange={(e) => (set as (v: string) => void)(e.target.value)}
                  className="w-full bg-transparent text-center text-base font-black text-gold-300 outline-none tabular-nums"
                />
                <span className="text-[9px] font-bold text-bone/35">جم</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-coal-950/60 px-4 py-2.5 text-[11px]">
          <span className="font-bold text-bone/50">
            السعرات المستهدفة من الماكروز (4/4/9): <span className="font-black text-gold-300">{targetCalories}</span>
          </span>
          <span className={`font-black ${Math.abs(totals.calories - targetCalories) <= 60 ? "text-emerald-300" : "text-amber-300"}`}>
            الفارق الحالي: {totals.calories - targetCalories > 0 ? "+" : "−"}{Math.abs(totals.calories - targetCalories)} سعر
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-4">
          <ProgressBar label="إجمالي السعرات" value={totals.calories} target={targetCalories} unit="سعر" icon={Flame} />
          <ProgressBar label="بروتين" value={totals.protein} target={tp} unit="جم" />
          <ProgressBar label="كربوهيدرات" value={totals.carbs} target={tc} unit="جم" />
          <ProgressBar label="دهون" value={totals.fats} target={tf} unit="جم" />
        </div>

        {consistencyWarning && (
          <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-[11px] font-bold leading-6 text-amber-200">
            <TriangleAlert size={15} className="mt-0.5 shrink-0" />
            {consistencyWarning}
          </div>
        )}
      </div>

      {savedPlanId !== null ? (
        <div className="rounded-[1.75rem] border border-emerald-400/40 bg-emerald-500/[0.07] p-8 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
            <Check size={30} />
          </span>
          <h3 className="mt-5 text-xl font-black">
            تم {savedStatus === "confirmed" ? "تأكيد" : "حفظ"} النظام الغذائي بنجاح
          </h3>
          <p className="mt-2 text-xs text-bone/55">
            {totals.calories} سعر — بروتين {totals.protein} جم / كربوهيدرات {totals.carbs} جم / دهون {totals.fats} جم
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {savedStatus === "confirmed" && (
              <button
                onClick={() => onPlanSaved(savedPlanId, context.clientName)}
                className="btn-shine inline-flex items-center gap-2.5 rounded-full bg-gradient-to-l from-gold-300 to-gold-600 px-7 py-3.5 text-sm font-black text-coal-950 transition-transform duration-300 hover:scale-[1.03]"
              >
                <Plus size={16} />
                إنشاء البرنامج التدريبي للعميل
              </button>
            )}
            <button
              onClick={copyPlan}
              className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 px-7 py-3.5 text-sm font-black text-gold-300 transition hover:bg-gold-500 hover:text-coal-950"
            >
              {copied ? <Check size={15} /> : <ClipboardCopy size={15} />}
              {copied ? "تم النسخ!" : "نسخ الخطة"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* الوجبات */}
          <div className="space-y-4">
            {meals.map((meal) => {
              const options = mealOptions(meal);
              const multi = options.length > 1;
              const refTotals = optionTotals(options[0]);
              return (
                <div key={meal.id} className="rounded-[1.25rem] border border-white/10 bg-coal-900/70 p-4 sm:rounded-[1.5rem] sm:p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      value={meal.name}
                      onChange={(e) => updateMeal(meal.id, { name: e.target.value })}
                      className="min-w-0 flex-1 rounded-xl border border-transparent bg-transparent px-2 py-1 text-base font-black text-bone outline-none transition hover:border-white/10 focus:border-gold-500/50 focus:bg-white/[0.04]"
                    />
                    <span className="rounded-full bg-gold-500/15 px-3.5 py-1.5 text-[11px] font-black text-gold-300">
                      {multi ? `الخيار الأول: ${refTotals.calories} سعر` : `${refTotals.calories} سعر`}
                    </span>
                    {meal.items !== undefined && meal.options === undefined && null}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRecipePickerMeal(meal.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/40 px-4 py-2 text-[11px] font-black text-gold-300 transition hover:bg-gold-500 hover:text-coal-950"
                      >
                        <BookOpen size={13} />
                        وصفة جاهزة
                      </button>
                      <button
                        onClick={() => addOption(meal.id)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-gold-500 px-4 py-2 text-[11px] font-black text-coal-950 transition hover:bg-gold-400"
                      >
                        <Plus size={13} />
                        خيار بديل
                      </button>
                      {meals.length > 1 && (
                        <button
                          onClick={() => setMeals((prev) => prev.filter((m) => m.id !== meal.id))}
                          className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-bone/40 transition hover:border-red-400/50 hover:text-red-300"
                          aria-label="حذف الوجبة"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* الخيارات البديلة */}
                  <div className="mt-4 space-y-3">
                    {options.map((option, oi) => {
                      const ot = optionTotals(option);
                      return (
                        <div
                          key={option.id}
                          className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              value={option.name}
                              onChange={(e) => patchOption(meal.id, option.id, { name: e.target.value })}
                              className="min-w-28 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-black text-gold-200 outline-none transition hover:border-white/10 focus:border-gold-500/40 focus:bg-white/[0.04]"
                            />
                            <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-black text-bone/60">
                              {ot.calories} سعر • ب {ot.protein} • ك {ot.carbs} • د {ot.fats}
                            </span>
                            <div className="flex items-center gap-1">
                              {multi && (
                                <>
                                  <button
                                    onClick={() => moveOption(meal.id, option.id, -1)}
                                    disabled={oi === 0}
                                    className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-bone/50 transition hover:text-gold-300 disabled:opacity-30"
                                    aria-label="تقديم الخيار"
                                  >
                                    <ArrowUp size={12} />
                                  </button>
                                  <button
                                    onClick={() => moveOption(meal.id, option.id, 1)}
                                    disabled={oi === options.length - 1}
                                    className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-bone/50 transition hover:text-gold-300 disabled:opacity-30"
                                    aria-label="تأخير الخيار"
                                  >
                                    <ArrowDown size={12} />
                                  </button>
                                </>
                              )}
                              {multi && (
                                <button
                                  onClick={() => removeOption(meal.id, option.id)}
                                  className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-bone/50 transition hover:border-red-400/50 hover:text-red-300"
                                  aria-label="حذف الخيار"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          {option.items.length === 0 ? (
                            <p className="mt-3 rounded-xl border border-dashed border-white/10 px-4 py-4 text-center text-[11px] font-bold text-bone/35">
                              لا توجد أصناف — أضف من المكتبة
                            </p>
                          ) : (
                            <div className="mt-3 space-y-2">
                              {option.items.map((item, index) => {
                                const it = itemTotals(item);
                                return (
                                  <div
                                    key={`${option.id}-${index}`}
                                    className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.06] bg-coal-950/40 px-3 py-2.5 sm:gap-3"
                                  >
                                    <span className="w-full min-w-0 flex-1 text-xs font-extrabold sm:w-auto sm:text-sm">
                                      {item.name}
                                    </span>
                                    <div className="w-full sm:w-40">
                                      <Stepper
                                        value={item.grams}
                                        onChange={(v) => updateItemGrams(meal.id, option.id, index, v)}
                                        step={item.kcal > 400 ? 5 : 25}
                                        min={5}
                                        max={1000}
                                        suffix="جم"
                                      />
                                    </div>
                                    <span className="w-16 shrink-0 text-center text-xs font-black text-gold-300 sm:text-sm">
                                      {Math.round(it.calories)}
                                      <span className="block text-[9px] font-bold text-bone/35">سعر</span>
                                    </span>
                                    <span className="hidden w-36 shrink-0 justify-between text-[10px] font-black text-bone/45 sm:flex">
                                      <span>ب {Math.round(it.protein)}</span>
                                      <span>ك {Math.round(it.carbs)}</span>
                                      <span>د {Math.round(it.fats)}</span>
                                    </span>
                                    <button
                                      onClick={() => removeItem(meal.id, option.id, index)}
                                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 text-bone/40 transition hover:border-red-400/50 hover:text-red-300"
                                      aria-label="حذف الصنف"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <button
                            onClick={() => setPicker({ mealId: meal.id, optionId: option.id })}
                            disabled={foodsLoading}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gold-500/40 px-3.5 py-2 text-[11px] font-black text-gold-300 transition hover:bg-gold-500 hover:text-coal-950 disabled:opacity-50"
                          >
                            <Plus size={12} />
                            طعام من المكتبة
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* تنبيه الخيار الواحد — يظهر فقط عند تعدد الخيارات */}
                  {multi && (
                    <div className="mt-3 rounded-xl border border-gold-500/25 bg-gold-500/[0.06] px-4 py-2.5 text-center text-[11px] font-black text-gold-200">
                      {OPTION_ALERT}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() =>
              setMeals((prev) => [
                ...prev,
                { id: uid(), name: "وجبة جديدة", items: [], options: [{ id: uid(), name: optionLabel(0), items: [] }] },
              ])
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-4 text-xs font-black text-bone/55 transition hover:border-gold-500/50 hover:text-gold-300"
          >
            <Plus size={15} />
            إضافة وجبة جديدة
          </button>

          <div className="rounded-[1.5rem] border border-white/10 bg-coal-900/70 p-4 sm:p-6">
            <label className="mb-2 block text-[11px] font-bold text-bone/60">ملاحظات للعميل (اختياري)</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="field resize-none"
              placeholder="مثال: اشرب 3 لتر ماء يومياً — الوجبة الرابعة بعد التمرين مباشرة…"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-200">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => save("draft")}
              disabled={saving !== null || totalItems === 0 || !targetsValid}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-black text-bone/65 transition hover:border-gold-500/40 hover:text-gold-300 disabled:opacity-50"
            >
              {saving === "draft" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              حفظ كمسودة
            </button>
            <button
              onClick={() => save("confirmed")}
              disabled={saving !== null || totalItems === 0 || !targetsValid}
              className="btn-shine inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold-300 to-gold-600 px-6 py-3.5 text-sm font-black text-coal-950 transition-transform duration-300 hover:scale-[1.02] disabled:opacity-50"
            >
              {saving === "confirmed" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              تأكيد النظام الغذائي
            </button>
          </div>
          {totalItems === 0 && (
            <p className="text-center text-[11px] font-bold text-bone/35">
              أضف صنفاً واحداً على الأقل لتتمكن من الحفظ
            </p>
          )}
        </>
      )}

      <FoodPicker
        open={picker !== null}
        onClose={() => setPicker(null)}
        foods={foods}
        onPick={(food) => {
          if (picker) addItem(picker.mealId, picker.optionId, food);
        }}
        mealName={
          picker
            ? `${getMeal(picker.mealId)?.name} — ${mealOptions(getMeal(picker.mealId)).find((o) => o.id === picker.optionId)?.name}`
            : undefined
        }
      />

      <RecipesModal
        open={recipePickerMeal !== null}
        onClose={() => setRecipePickerMeal(null)}
        recipes={recipes}
        onPick={(recipe) => recipePickerMeal && addRecipeAsOption(recipePickerMeal, recipe)}
      />
    </div>
  );
}

/** نافذة اختيار وصفة من كتاب الوصفات — إضافة بنقرة واحدة */
function RecipesModal({
  open,
  onClose,
  recipes,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  recipes: RecipeRow[];
  onPick: (recipe: RecipeRow) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = recipes.filter((r) => !query.trim() || r.name.includes(query.trim()));
  return (
    <Modal open={open} onClose={onClose} wide title="كتاب الوصفات" subtitle="اختر وصفة لإضافتها كخيار بديل هذه الوجبة — بنقرة واحدة">
      <input value={query} onChange={(e) => setQuery(e.target.value)} className="field" placeholder="ابحث في الوصفات…" />
      <div className="mt-4 max-h-[52vh] space-y-2 overflow-y-auto overscroll-contain pl-1 sm:max-h-[46vh]">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-xs font-bold text-bone/40">لا توجد وصفات — أنشئ وصفات من قسم «كتاب الوصفات»</p>
        ) : (
          filtered.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => onPick(recipe)}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-start transition hover:border-gold-500/50 hover:bg-gold-500/[0.07] sm:gap-4 sm:px-4 sm:py-3"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-300">
                <BookOpen size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold">{recipe.name}</span>
                <span className="mt-0.5 block text-[10px] font-bold text-bone/40">{recipe.category}</span>
              </span>
              <span className="shrink-0 text-end">
                <span className="block text-base font-black text-gold-300">{Math.round(recipe.calories)}</span>
                <span className="block text-[9px] font-bold text-bone/35">سعر</span>
              </span>
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}
