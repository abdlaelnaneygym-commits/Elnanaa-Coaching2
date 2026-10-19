"use client";

import type { DietPlanRow, FoodRow } from "@/db/schema";
import type { DietContext } from "./CoachCalculator";
import {
  computeTotals,
  DEFAULT_MEAL_NAMES,
  dietPlanText,
  itemTotals,
  mealTotals,
  uid,
  type Meal,
} from "@/lib/plans";
import {
  ArrowLeft,
  Check,
  ClipboardCopy,
  Flame,
  Loader2,
  Plus,
  Save,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FoodPicker } from "./pickers";
import { ProgressBar, Stepper } from "./ui";

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
  const [foodsLoading, setFoodsLoading] = useState(true);
  const [meals, setMeals] = useState<Meal[]>(() =>
    DEFAULT_MEAL_NAMES.map((name) => ({ id: uid(), name, items: [] })),
  );
  const [notes, setNotes] = useState("");
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [saving, setSaving] = useState<"draft" | "confirmed" | null>(null);
  const [error, setError] = useState("");
  const [savedPlan, setSavedPlan] = useState<DietPlanRow | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/foods", { headers, cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setFoods(json.data ?? []);
      })
      .catch(() => undefined)
      .finally(() => setFoodsLoading(false));
  }, [headers]);

  const totals = useMemo(() => computeTotals(meals), [meals]);

  function updateMeal(id: string, patch: Partial<Meal>) {
    setMeals((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function addItem(mealId: string, food: FoodRow, grams = 100) {
    setMeals((prev) =>
      prev.map((m) =>
        m.id === mealId
          ? {
              ...m,
              items: [
                ...m.items,
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
            }
          : m,
      ),
    );
  }

  function updateItem(mealId: string, index: number, grams: number) {
    setMeals((prev) =>
      prev.map((m) =>
        m.id === mealId
          ? { ...m, items: m.items.map((it, i) => (i === index ? { ...it, grams } : it)) }
          : m,
      ),
    );
  }

  function removeItem(mealId: string, index: number) {
    setMeals((prev) =>
      prev.map((m) =>
        m.id === mealId ? { ...m, items: m.items.filter((_, i) => i !== index) } : m,
      ),
    );
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
          targetCalories: context.targetCalories,
          targetProtein: context.targetProtein,
          targetCarbs: context.targetCarbs,
          targetFats: context.targetFats,
          meals: meals.map((m) => ({ name: m.name, items: m.items })),
          notes,
          status,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "تعذّر حفظ النظام");
        return;
      }
      setSavedPlan(json.data);
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setSaving(null);
    }
  }

  async function copyPlan() {
    try {
      await navigator.clipboard.writeText(
        dietPlanText({
          clientName: context.clientName,
          targetCalories: context.targetCalories,
          meals,
        }),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* تجاهل */
    }
  }

  const mealCount = meals.reduce((n, m) => n + m.items.length, 0);

  return (
    <div className="space-y-6">
      {/* رأس الشاشة مع شريط التقدم الحي */}
      <div className="static rounded-[1.5rem] sm:rounded-[1.75rem] lg:sticky lg:top-0 lg:z-20 border border-gold-500/30 bg-coal-900/95 p-6 shadow-[0_25px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl lg:top-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black tracking-wider text-gold-400">
              <UtensilsCrossed size={13} />
              بناء النظام الغذائي
            </div>
            <h2 className="mt-1.5 text-2xl font-black">{context.clientName}</h2>
            <p className="mt-1 text-[11px] font-bold text-bone/45">
              الهدف: {context.targetCalories} سعر يومياً • {meals.length} وجبة •{" "}
              {mealCount} صنف
            </p>
          </div>
          <button
            onClick={onExit}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-[11px] font-black text-bone/55 transition hover:text-gold-300"
          >
            رجوع
            <ArrowLeft size={13} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-2.5 lg:grid-cols-4">
          <ProgressBar
            label="إجمالي السعرات"
            value={totals.calories}
            target={context.targetCalories}
            unit="سعر"
            icon={Flame}
          />
          <ProgressBar label="بروتين" value={totals.protein} target={context.targetProtein} unit="جم" />
          <ProgressBar label="كربوهيدرات" value={totals.carbs} target={context.targetCarbs} unit="جم" />
          <ProgressBar label="دهون" value={totals.fats} target={context.targetFats} unit="جم" />
        </div>
      </div>

      {savedPlan ? (
        <div className="rounded-[1.75rem] border border-emerald-400/40 bg-emerald-500/[0.07] p-8 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
            <Check size={30} />
          </span>
          <h3 className="mt-5 text-xl font-black">
            تم {savedPlan.status === "confirmed" ? "تأكيد" : "حفظ"} النظام الغذائي بنجاح
          </h3>
          <p className="mt-2 text-xs text-bone/55">
            {totals.calories} سعر — بروتين {totals.protein} جم / كربوهيدرات {totals.carbs} جم /
            دهون {totals.fats} جم
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {savedPlan.status === "confirmed" && (
              <button
                onClick={() => onPlanSaved(savedPlan.id, context.clientName)}
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
              const mt = mealTotals(meal);
              return (
                <div
                  key={meal.id}
                  className="rounded-[1.25rem] border border-white/10 bg-coal-900/70 p-4 sm:rounded-[1.5rem] sm:p-5"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      value={meal.name}
                      onChange={(e) => updateMeal(meal.id, { name: e.target.value })}
                      className="min-w-32 flex-1 rounded-xl border border-transparent bg-transparent px-2 py-1 text-base font-black text-bone outline-none transition hover:border-white/10 focus:border-gold-500/50 focus:bg-white/[0.04]"
                    />
                    <span className="rounded-full bg-gold-500/15 px-3.5 py-1.5 text-[11px] font-black text-gold-300">
                      {mt.calories} سعر
                    </span>
                    <span className="hidden text-[10px] font-bold text-bone/40 sm:block">
                      ب {mt.protein} • ك {mt.carbs} • د {mt.fats}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPickerFor(meal.id)}
                        disabled={foodsLoading}
                        className="inline-flex items-center gap-1.5 rounded-full bg-gold-500 px-4 py-2 text-[11px] font-black text-coal-950 transition hover:bg-gold-400 disabled:opacity-50"
                      >
                        <Plus size={13} />
                        طعام
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

                  {meal.items.length === 0 ? (
                    <p className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-[11px] font-bold text-bone/35">
                      لا توجد أطعمة بعد — اضغط «طعام» لاختيار من المكتبة
                    </p>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {meal.items.map((item, index) => {
                        const it = itemTotals(item);
                        return (
                          <div
                            key={`${meal.id}-${index}`}
                            className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-3 py-3 sm:gap-3 sm:px-4"
                          >
                            <span className="w-full min-w-0 flex-1 text-sm font-extrabold sm:w-auto sm:min-w-28">
                              {item.name}
                            </span>
                            <div className="w-full sm:w-40">
                              <Stepper
                                value={item.grams}
                                onChange={(v) => updateItem(meal.id, index, v)}
                                step={item.kcal > 400 ? 5 : 25}
                                min={5}
                                max={1000}
                                suffix="جم"
                              />
                            </div>
                            <span className="w-20 shrink-0 text-center text-sm font-black text-gold-300">
                              {Math.round(it.calories)}
                              <span className="block text-[9px] font-bold text-bone/35">سعر</span>
                            </span>
                            <span className="hidden w-44 shrink-0 justify-between text-[10px] font-black text-bone/45 sm:flex">
                              <span>ب {Math.round(it.protein)}</span>
                              <span>ك {Math.round(it.carbs)}</span>
                              <span>د {Math.round(it.fats)}</span>
                            </span>
                            <button
                              onClick={() => removeItem(meal.id, index)}
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 text-bone/40 transition hover:border-red-400/50 hover:text-red-300"
                              aria-label="حذف"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setMeals((prev) => [...prev, { id: uid(), name: "وجبة جديدة", items: [] }])}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-4 text-xs font-black text-bone/55 transition hover:border-gold-500/50 hover:text-gold-300"
          >
            <Plus size={15} />
            إضافة وجبة جديدة
          </button>

          <div className="rounded-[1.75rem] border border-white/10 bg-coal-900/70 p-6">
            <label className="mb-2 block text-[11px] font-bold text-bone/60">
              ملاحظات للعميل (اختياري)
            </label>
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

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => save("draft")}
              disabled={saving !== null || mealCount === 0}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-black text-bone/65 transition hover:border-gold-500/40 hover:text-gold-300 disabled:opacity-50"
            >
              {saving === "draft" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              حفظ كمسودة
            </button>
            <button
              onClick={() => save("confirmed")}
              disabled={saving !== null || mealCount === 0}
              className="btn-shine inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold-300 to-gold-600 px-6 py-3.5 text-sm font-black text-coal-950 transition-transform duration-300 hover:scale-[1.02] disabled:opacity-50"
            >
              {saving === "confirmed" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Check size={15} />
              )}
              تأكيد النظام الغذائي
            </button>
          </div>
          {mealCount === 0 && (
            <p className="text-center text-[11px] font-bold text-bone/35">
              أضف صنفاً واحداً على الأقل لتتمكن من الحفظ
            </p>
          )}
        </>
      )}

      <FoodPicker
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        foods={foods}
        onPick={(food) => {
          if (pickerFor) addItem(pickerFor, food);
        }}
        mealName={meals.find((m) => m.id === pickerFor)?.name}
      />
    </div>
  );
}
