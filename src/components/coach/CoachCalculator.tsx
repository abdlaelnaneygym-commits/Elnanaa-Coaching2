"use client";

import type { CalculationRow } from "@/db/schema";
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  macroSplit,
  type ActivityKey,
  type Goal,
} from "@/lib/calories";
import {
  AlertTriangle,
  Baby,
  BarChart3,
  Calculator as CalcIcon,
  Equal,
  Flame,
  History,
  Loader2,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CoachBadge, ProgressBar } from "./ui";

export interface DietContext {
  clientName: string;
  calculationId: number | null;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
}

export interface CalcPrefill {
  name: string;
  age: number;
  gender: "male" | "female";
  weight: number;
  height: number;
  goal: string;
}

interface CalcResponse {
  id: number;
  input: {
    name: string;
    age: number;
    gender: string;
    weight: number;
    height: number;
    activityLevel: string;
    goal: string;
  };
  result: {
    bmr: number;
    tdee: number;
    bmi: number;
    isChild: boolean;
    equation: string;
    targetCalories: number | null;
    needsSpecialist: boolean;
  };
}

const GOAL_ICONS: Record<string, typeof TrendingDown> = {
  lose: TrendingDown,
  maintain: Equal,
  gain: TrendingUp,
};

export default function CoachCalculator({
  headers,
  prefill,
  onBuildDiet,
}: {
  headers: Record<string, string>;
  prefill: CalcPrefill | null;
  onBuildDiet: (ctx: DietContext) => void;
}) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityKey>("moderate");
  const [goal, setGoal] = useState<Goal>("maintain");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CalcResponse | null>(null);
  const [history, setHistory] = useState<CalculationRow[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/coach/calculations", { headers, cache: "no-store" });
      const json = await res.json();
      if (json.ok) setHistory(json.data.slice(0, 8));
    } catch {
      /* تجاهل */
    }
  }, [headers]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // تعبئة تلقائية من بيانات العميل
  useEffect(() => {
    if (!prefill) return;
    setName(prefill.name);
    setAge(String(prefill.age));
    setGender(prefill.gender);
    setWeight(String(prefill.weight));
    setHeight(String(prefill.height));
    if (["lose", "maintain", "gain"].includes(prefill.goal)) {
      setGoal(prefill.goal as Goal);
    }
    setResult(null);
    setError("");
  }, [prefill]);

  const ageNum = Number(age);
  const isChild = Number.isFinite(ageNum) && ageNum > 0 && ageNum < 18;

  async function calculate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/coach/calculate", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          age: Number(age),
          gender,
          weight: Number(weight),
          height: Number(height),
          activityLevel,
          goal,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "حدث خطأ في الحساب");
        return;
      }
      setResult(json.data);
      loadHistory();
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setResult(null);
    setError("");
    setName("");
    setAge("");
    setWeight("");
    setHeight("");
  }

  function buildDiet() {
    if (!result || result.result.targetCalories === null) return;
    const macros = macroSplit(
      result.result.targetCalories,
      Number(weight),
      result.input.goal as Goal,
      result.result.isChild,
    );
    onBuildDiet({
      clientName: result.input.name,
      calculationId: result.id,
      targetCalories: result.result.targetCalories,
      targetProtein: macros.protein,
      targetCarbs: macros.carbs,
      targetFats: macros.fats,
    });
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,420px)_1fr] xl:gap-6">
      {/* نموذج الحساب */}
      <form
        onSubmit={calculate}
        className="h-fit space-y-4 rounded-[1.5rem] border border-white/10 bg-coal-900/70 p-4 sm:p-6"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-500 text-coal-950">
            <CalcIcon size={20} />
          </span>
          <div>
            <h2 className="text-sm font-black sm:text-base">حاسبة السعرات</h2>
            <p className="text-[11px] text-bone/45">للمدرب فقط — النتائج تظهر فوراً</p>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-bone/60">اسم العميل *</label>
          <input
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field"
            placeholder="مثال: أحمد محمد"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-bone/60">السن *</label>
            <input
              required
              type="number"
              min={5}
              max={100}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="field"
              placeholder="24"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-bone/60">النوع *</label>
            <div className="grid grid-cols-2 gap-2">
              {(["male", "female"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`rounded-xl border py-2.5 text-xs font-bold transition ${
                    gender === g
                      ? "border-gold-500 bg-gold-500/15 text-gold-300"
                      : "border-white/10 text-bone/55"
                  }`}
                >
                  {g === "male" ? "ذكر" : "أنثى"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-bone/60">الوزن (كجم) *</label>
            <input
              required
              type="number"
              step="0.1"
              min={20}
              max={300}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="field"
              placeholder="85"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-bone/60">الطول (سم) *</label>
            <input
              required
              type="number"
              min={90}
              max={230}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="field"
              placeholder="178"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-bone/60">مستوى النشاط *</label>
          <select
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value as ActivityKey)}
            className="field"
          >
            {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-bone/60">الهدف *</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => {
              const Icon = GOAL_ICONS[g];
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-1 py-3 transition ${
                    goal === g
                      ? "border-gold-500 bg-gold-500/15 text-gold-300"
                      : "border-white/10 text-bone/55"
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-center text-[10px] font-bold leading-4">
                    {GOAL_LABELS[g].split(" — ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {isChild && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-sky-400/40 bg-sky-500/10 px-4 py-3 text-[11px] font-semibold leading-6 text-sky-200">
            <Baby size={15} className="mt-0.5 shrink-0" />
            سيتم تطبيق معادلات الأطفال (Schofield) تلقائياً لأن السن أقل من 18.
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-[11px] font-bold text-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn-shine flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold-300 to-gold-600 py-3.5 text-sm font-black text-coal-950 transition-transform duration-300 hover:scale-[1.02] disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <BarChart3 size={16} />}
          {busy ? "جارٍ الحساب…" : "احسب السعرات الآن"}
        </button>
      </form>

      {/* النتائج */}
      <div className="space-y-5">
        {!result ? (
          <div className="grid h-full min-h-72 place-items-center rounded-[1.75rem] border border-dashed border-white/15 bg-white/[0.02] px-8 text-center">
            <div>
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold-500/10 text-gold-400">
                <Flame size={26} />
              </span>
              <p className="mt-5 max-w-sm text-sm font-semibold leading-8 text-bone/50">
                أدخل بيانات العميل واضغط «احسب السعرات الآن» — ستظهر النتائج الكاملة
                هنا مع زر إنشاء النظام الغذائي مباشرة.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-[1.5rem] border border-gold-500/30 bg-gradient-to-b from-gold-500/[0.1] to-coal-900/70 p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-black">{result.input.name}</h3>
                <div className="flex flex-wrap gap-2">
                  <CoachBadge>{GOAL_LABELS[result.input.goal as Goal]}</CoachBadge>
                  {result.result.isChild && (
                    <CoachBadge tone="gray">
                      <Baby size={11} /> طفل / مراهق
                    </CoachBadge>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
                <Stat label="الأيض BMR" value={result.result.bmr} />
                <Stat label="الحرق TDEE" value={result.result.tdee} />
                <Stat label="مؤشر BMI" value={result.result.bmi} />
                <Stat
                  label="السعرات المستهدفة"
                  value={result.result.targetCalories ?? "—"}
                  highlight
                />
              </div>

              {result.result.targetCalories !== null && (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2.5">
                  <ProgressBar
                    label="بروتين"
                    value={macroSplit(result.result.targetCalories, Number(weight), result.input.goal as Goal, result.result.isChild).protein}
                    target={macroSplit(result.result.targetCalories, Number(weight), result.input.goal as Goal, result.result.isChild).protein}
                    unit="جم"
                  />
                  <ProgressBar
                    label="كربوهيدرات"
                    value={macroSplit(result.result.targetCalories, Number(weight), result.input.goal as Goal, result.result.isChild).carbs}
                    target={macroSplit(result.result.targetCalories, Number(weight), result.input.goal as Goal, result.result.isChild).carbs}
                    unit="جم"
                  />
                  <ProgressBar
                    label="دهون"
                    value={macroSplit(result.result.targetCalories, Number(weight), result.input.goal as Goal, result.result.isChild).fats}
                    target={macroSplit(result.result.targetCalories, Number(weight), result.input.goal as Goal, result.result.isChild).fats}
                    unit="جم"
                  />
                </div>
              )}

              <p className="mt-3 text-[10px] font-semibold text-bone/40">
                المعادلة:{" "}
                {result.result.equation === "schofield"
                  ? "Schofield — معادلات الأطفال المعتمدة"
                  : "Mifflin-St Jeor — البالغين"}
              </p>

              {result.result.needsSpecialist ? (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-400/40 bg-red-500/10 p-4">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-300" />
                  <p className="text-[11px] font-semibold leading-6 text-red-200">
                    طفل يحتاج تخسيس — <span className="font-black">ممنوع</span> إنشاء خطة
                    تخسيس تلقائية. يجب إحالة الحالة لأخصائي تغذية أطفال معتمد.
                  </p>
                </div>
              ) : (
                <button
                  onClick={buildDiet}
                  className="btn-shine mt-5 flex w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-l from-gold-300 to-gold-600 py-4 text-sm font-black text-coal-950 transition-transform duration-300 hover:scale-[1.02]"
                >
                  <UtensilsCrossed size={17} />
                  إنشاء نظام غذائي وفقاً لهذه السعرات
                </button>
              )}
            </div>

            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-[11px] font-black text-bone/55 transition hover:text-gold-300"
            >
              <RotateCcw size={13} />
              حسبة جديدة
            </button>
          </>
        )}

        {/* سجل الحسابات */}
        {history.length > 0 && (
          <div className="rounded-[1.5rem] border border-white/10 bg-coal-900/70 p-4 sm:p-5">
            <h3 className="flex items-center gap-2 text-sm font-black">
              <History size={15} className="text-gold-400" />
              آخر الحسابات
            </h3>
            <div className="mt-4 space-y-2">
              {history.map((row) => (
                <button
                  key={row.id}
                  onClick={() => {
                    setName(row.name);
                    setAge(String(row.age));
                    setGender(row.gender === "female" ? "female" : "male");
                    setWeight(String(row.weight));
                    setHeight(String(row.height));
                    setActivityLevel(row.activityLevel as ActivityKey);
                    setGoal(row.goal as Goal);
                    setResult(null);
                  }}
                  className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-2.5 text-start transition hover:border-gold-500/40"
                >
                  <span className="text-xs font-extrabold">{row.name}</span>
                  <span className="flex items-center gap-2 text-[10px] font-bold text-bone/45">
                    <span>{row.age} سنة</span>
                    <span className="text-gold-300">{row.targetCalories ?? "إحالة"} سعر</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 text-center ${
        highlight ? "border-gold-500/50 bg-gold-500/10" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="text-[10px] font-bold text-bone/45">{label}</div>
      <div className={`mt-1 text-xl font-black ${highlight ? "text-gold-300" : "text-bone"}`}>
        {value}
      </div>
    </div>
  );
}
