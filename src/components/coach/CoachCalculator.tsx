"use client";

import type { CalculationRow } from "@/db/schema";
import {
  ACTIVITY_FACTORS,
  ACTIVITY_LABELS,
  EQUATION_LABELS,
  GOAL_LABELS,
  assessCalories,
  macroSplit,
  type ActivityKey,
  type EquationKey,
  type Goal,
} from "@/lib/calories";
import { macroEnergy } from "@/lib/plans";
import {
  AlertTriangle,
  Baby,
  BarChart3,
  Calculator as CalcIcon,
  CheckCircle2,
  Equal,
  Flame,
  History,
  Loader2,
  RefreshCw,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CoachBadge } from "./ui";

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

interface CalcSuccess {
  id: number;
  input: { name: string; goal: string; weight: number };
  result: {
    bmr: number;
    tdee: number;
    bmi: number;
    isChild: boolean;
    equation: "mifflin" | "katch" | "schofield";
    targetCalories: number | null;
    needsSpecialist: boolean;
    delta: number | null;
    activityFactor: number;
    leanMass?: number;
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
  const [equation, setEquation] = useState<EquationKey>("mifflin");
  const [bodyFat, setBodyFat] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CalcSuccess | null>(null);
  const [history, setHistory] = useState<CalculationRow[]>([]);
  const [notice, setNotice] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // الماكروز المستهدفة — قابلة للتعديل يدوياً
  const [mProtein, setMProtein] = useState("0");
  const [mCarbs, setMCarbs] = useState("0");
  const [mFats, setMFats] = useState("0");

  const p = Number(mProtein) || 0;
  const c = Number(mCarbs) || 0;
  const f = Number(mFats) || 0;
  const macrosValid = p >= 0 && c >= 0 && f >= 0;
  const computedKcal = macroEnergy(p, c, f);
  const targetKcal = result?.result.targetCalories ?? 0;
  const kcalDiff = targetKcal > 0 ? computedKcal - targetKcal : 0;

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

  useEffect(() => {
    if (!prefill) return;
    setName(prefill.name);
    setAge(String(prefill.age));
    setGender(prefill.gender);
    setWeight(String(prefill.weight));
    setHeight(String(prefill.height));
    if (["lose", "maintain", "gain"].includes(prefill.goal)) setGoal(prefill.goal as Goal);
    setResult(null);
    setError("");
    setNotice("");
  }, [prefill]);

  const ageNum = Number(age);
  const isChild = Number.isFinite(ageNum) && ageNum > 0 && ageNum < 18;
  const katchSelected = equation === "katch" && !isChild;
  const bfNum = Number(bodyFat);
  const bfExtreme = katchSelected && bodyFat !== "" && (bfNum < 5 || bfNum > 55);

  /** إعادة توزيع الماكروز تلقائياً وفق السعرات المستهدفة */
  function redistribute() {
    if (!result?.result.targetCalories) return;
    const split = macroSplit(
      result.result.targetCalories,
      Number(weight),
      result.input.goal as Goal,
      result.result.isChild,
    );
    setMProtein(String(split.protein));
    setMCarbs(String(split.carbs));
    setMFats(String(split.fats));
  }

  async function calculate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    setResult(null);

    const payload: Record<string, unknown> = {
      name,
      age: Number(age),
      gender,
      weight: Number(weight),
      height: Number(height),
      activityLevel,
      goal,
      equation,
    };
    if (katchSelected) payload.bodyFat = Number(bodyFat);

    try {
      const res = await fetch("/api/coach/calculate", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "حدث خطأ في الحساب");
        return;
      }
      const data = json.data as CalcSuccess;
      setResult(data);
      // تعبئة الماكروز بالتوزيع التلقائي (المعادلة 4/4/9)
      if (data.result.targetCalories !== null) {
        const split = macroSplit(
          data.result.targetCalories,
          data.input.weight,
          data.input.goal as Goal,
          data.result.isChild,
        );
        setMProtein(String(split.protein));
        setMCarbs(String(split.carbs));
        setMFats(String(split.fats));
      }
      loadHistory();
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  /** حذف سجل من Neon فعلياً + تحديث القائمة فوراً */
  async function deleteRecord(row: CalculationRow) {
    if (!confirm(`حذف سجل «${row.name}» نهائياً من قاعدة البيانات؟ لا يمكن التراجع.`)) return;
    setDeletingId(row.id);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/coach/calculations", {
        method: "DELETE",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(`تعذّر حذف سجل «${row.name}» — ${json?.error ?? "خطأ في الخادم"}`);
        return;
      }
      // تحديث مباشر بدون Refresh
      setHistory((prev) => prev.filter((r) => r.id !== row.id));
      setNotice(`✓ تم حذف سجل «${row.name}» من قاعدة البيانات`);
    } catch {
      setError("تعذّر الاتصال بالخادم — لم يُحذف السجل");
    } finally {
      setDeletingId(null);
    }
  }

  function buildDiet() {
    if (!result || result.result.targetCalories === null || !macrosValid) return;
    onBuildDiet({
      clientName: result.input.name,
      calculationId: result.id,
      // إجمالي السعرات من الماكروز المعدّلة 4/4/9 (المصدر الموحّد)
      targetCalories: computedKcal,
      targetProtein: p,
      targetCarbs: c,
      targetFats: f,
    });
  }

  const equationOptions: { key: EquationKey; label: string; short: string }[] = [
    { key: "mifflin", label: "Mifflin-St Jeor", short: "الأعم استخداماً" },
    { key: "katch", label: "Katch-McArdle", short: "الأدق عند معرفة نسبة الدهون" },
  ];

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
            <h2 className="text-sm font-black sm:text-base">حاسبة السعرات والماكروز</h2>
            <p className="text-[11px] text-bone/45">للمدرب فقط — النتائج تظهر فوراً</p>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-bone/60">اسم العميل *</label>
          <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="مثال: أحمد محمد" />
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-bone/60">السن *</label>
            <input required type="number" min={5} max={100} value={age} onChange={(e) => setAge(e.target.value)} className="field" placeholder="24" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-bone/60">النوع *</label>
            <div className="grid grid-cols-2 gap-2">
              {(["male", "female"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`rounded-xl border py-2.5 text-xs font-bold transition ${gender === g ? "border-gold-500 bg-gold-500/15 text-gold-300" : "border-white/10 text-bone/55"}`}
                >
                  {g === "male" ? "ذكر" : "أنثى"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-bone/60">الوزن (كجم) *</label>
            <input required type="number" step="0.1" min={20} max={300} value={weight} onChange={(e) => setWeight(e.target.value)} className="field" placeholder="85" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-bone/60">الطول (سم) *</label>
            <input required type="number" min={90} max={230} value={height} onChange={(e) => setHeight(e.target.value)} className="field" placeholder="178" />
          </div>
        </div>

        {/* اختيار المعادلة */}
        {!isChild ? (
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-bone/60">المعادلة *</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {equationOptions.map((eq) => (
                <button
                  key={eq.key}
                  type="button"
                  onClick={() => setEquation(eq.key)}
                  className={`rounded-xl border px-3 py-2.5 text-start transition ${equation === eq.key ? "border-gold-500 bg-gold-500/15" : "border-white/10 hover:border-white/25"}`}
                >
                  <span className={`block text-xs font-black ${equation === eq.key ? "text-gold-300" : "text-bone/70"}`} dir="ltr">{eq.label}</span>
                  <span className="mt-0.5 block text-[10px] font-bold text-bone/40">{eq.short}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 rounded-2xl border border-sky-400/40 bg-sky-500/10 px-4 py-3 text-[11px] font-semibold leading-6 text-sky-200">
            <Baby size={15} className="mt-0.5 shrink-0" />
            طفل / مراهق — سيتم تطبيق معادلات الأطفال (Schofield) تلقائياً.
          </div>
        )}

        {/* نسبة الدهون — تظهر فقط مع Katch-McArdle */}
        {katchSelected && (
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-bone/60">
              نسبة الدهون في الجسم % *
            </label>
            <input
              required
              type="number"
              step="0.1"
              min={0}
              max={100}
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
              className="field"
              placeholder="مثال: 20"
            />
            <p className="mt-1.5 text-[10px] leading-5 text-bone/40" dir="ltr">
              LBM = الوزن × (1 − نسبة الدهون ÷ 100) ‏؛‏ BMR = 370 + 21.6 × LBM
            </p>
            {bfExtreme && (
              <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-[10px] font-bold leading-5 text-amber-200">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                نسبة الدهون {bodyFat}% قيمة متطرفة — تحقق من صحة الإدخال قبل المتابعة.
              </div>
            )}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-bone/60">مستوى النشاط * (قابل للتعديل لكل عميل)</label>
          <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value as ActivityKey)} className="field">
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
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-1 py-3 transition ${goal === g ? "border-gold-500 bg-gold-500/15 text-gold-300" : "border-white/10 text-bone/55"}`}
                >
                  <Icon size={16} />
                  <span className="text-center text-[10px] font-bold leading-4">{GOAL_LABELS[g].split(" — ")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-[11px] font-bold leading-6 text-red-200">
            {error}
          </div>
        )}
        {notice && (
          <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-[11px] font-bold text-emerald-200">
            {notice}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn-shine flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold-300 to-gold-600 py-3.5 text-sm font-black text-coal-950 transition-transform duration-300 hover:scale-[1.02] disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <BarChart3 size={16} />}
          {busy ? "جارٍ الحساب…" : "احسب السعرات والماكروز"}
        </button>
      </form>

      {/* النتائج */}
      <div className="space-y-5">
        {!result ? (
          <div className="grid min-h-72 place-items-center rounded-[1.75rem] border border-dashed border-white/15 bg-white/[0.02] px-8 py-16 text-center">
            <div>
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold-500/10 text-gold-400">
                <Flame size={26} />
              </span>
              <p className="mt-5 max-w-sm text-sm font-semibold leading-8 text-bone/50">
                أدخل بيانات العميل واختر المعادلة — ستظهر النتائج الكاملة هنا مع إمكانية
                تعديل الماكروز يدوياً ثم إنشاء النظام الغذائي مباشرة.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-gold-500/30 bg-gradient-to-b from-gold-500/[0.1] to-coal-900/70 p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-black">{result.input.name}</h3>
                <div className="flex flex-wrap gap-2">
                  <CoachBadge>{GOAL_LABELS[result.input.goal as Goal]}</CoachBadge>
                  <CoachBadge tone="gray"><span dir="ltr">{EQUATION_LABELS[result.result.equation]}</span></CoachBadge>
                  {result.result.isChild && (
                    <CoachBadge tone="gray"><Baby size={11} /> طفل / مراهق</CoachBadge>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
                <Stat label="الأيض BMR" value={result.result.bmr} />
                <Stat label={`الحرق TDEE (×${result.result.activityFactor})`} value={result.result.tdee} />
                <Stat label="مؤشر BMI" value={result.result.bmi} />
                <Stat
                  label="السعرات المستهدفة"
                  value={result.result.targetCalories ?? "—"}
                  highlight
                />
              </div>

              {typeof result.result.leanMass === "number" && (
                <p className="mt-3 text-[11px] font-bold text-bone/50">
                  الكتلة الخالية من الدهون LBM = {result.result.leanMass} كجم
                  <span className="text-bone/35" dir="ltr"> (Katch-McArdle)</span>
                </p>
              )}

              {result.result.delta !== null && result.result.delta !== 0 && (
                <div className={`mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-black ${result.result.delta < 0 ? "border-red-400/40 bg-red-500/10 text-red-200" : "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"}`}>
                  {result.result.delta < 0 ? "عجز حراري: " : "فائض حراري: "}
                  {Math.abs(result.result.delta)} سعر يومياً
                </div>
              )}

              {result.result.needsSpecialist ? (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-400/40 bg-red-500/10 p-4">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-300" />
                  <p className="text-[11px] font-semibold leading-6 text-red-200">
                    طفل يحتاج تخسيس — <span className="font-black">ممنوع</span> إنشاء خطة
                    تخسيس تلقائية. يجب إحالة الحالة لأخصائي تغذية أطفال معتمد.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-black text-bone/70">الماكروز المستهدفة — قابلة للتعديل يدوياً</h4>
                    <button
                      type="button"
                      onClick={redistribute}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/40 px-3 py-1.5 text-[10px] font-black text-gold-300 transition hover:bg-gold-500 hover:text-coal-950"
                    >
                      <RefreshCw size={11} />
                      إعادة التوزيع التلقائي
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      ["البروتين (جم)", mProtein, setMProtein],
                      ["الكربوهيدرات (جم)", mCarbs, setMCarbs],
                      ["الدهون (جم)", mFats, setMFats],
                    ].map(([label, val, set]) => (
                      <div key={label as string}>
                        <label className="mb-1 block text-center text-[10px] font-bold text-bone/45">{label as string}</label>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={val as string}
                          onChange={(e) => (set as (v: string) => void)(e.target.value)}
                          className="field text-center tabular-nums"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-coal-950/60 px-4 py-3">
                    <span className="text-[11px] font-bold text-bone/50">
                      إجمالي السعرات من الماكروز (4/4/9): <span className="text-gold-300 font-black">{computedKcal}</span>
                    </span>
                    <span className={`text-[11px] font-black ${Math.abs(kcalDiff) <= 60 ? "text-emerald-300" : "text-amber-300"}`}>
                      {kcalDiff === 0 ? "مطابق للهدف" : `${kcalDiff > 0 ? "+" : "−"}${Math.abs(kcalDiff)} سعر عن الهدف`}
                    </span>
                  </div>

                  <button
                    onClick={buildDiet}
                    disabled={!macrosValid || computedKcal < 500}
                    className="btn-shine flex w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-l from-gold-300 to-gold-600 py-4 text-sm font-black text-coal-950 transition-transform duration-300 hover:scale-[1.02] disabled:opacity-50"
                  >
                    <UtensilsCrossed size={17} />
                    إنشاء نظام غذائي وفقاً لهذه السعرات
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => { setResult(null); setError(""); setNotice(""); }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-[11px] font-black text-bone/55 transition hover:text-gold-300"
            >
              <RotateCcw size={13} />
              حسبة جديدة
            </button>
          </div>
        )}

        {/* سجل الحسابات + حذف */}
        {history.length > 0 && (
          <div className="rounded-[1.5rem] border border-white/10 bg-coal-900/70 p-4 sm:p-5">
            <h3 className="flex items-center gap-2 text-sm font-black">
              <History size={15} className="text-gold-400" />
              آخر الحسابات (حفظ حقيقي في Neon)
            </h3>
            <div className="mt-4 space-y-2">
              {history.map((row) => (
                <div key={row.id} className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-2.5">
                  <button
                    onClick={() => {
                      setName(row.name);
                      setAge(String(row.age));
                      setGender(row.gender === "female" ? "female" : "male");
                      setWeight(String(row.weight));
                      setHeight(String(row.height));
                      setActivityLevel(row.activityLevel as ActivityKey);
                      setGoal(row.goal as Goal);
                      if (row.equation === "katch" || row.equation === "mifflin") setEquation(row.equation as EquationKey);
                      setResult(null);
                    }}
                    className="flex flex-1 min-w-0 items-center justify-between gap-2 text-start transition hover:text-gold-300"
                  >
                    <span className="truncate text-xs font-extrabold">{row.name}</span>
                    <span className="flex shrink-0 items-center gap-2 text-[10px] font-bold text-bone/45">
                      <span className="hidden sm:inline" dir="ltr">{(EQUATION_LABELS as Record<string, string>)[row.equation] ?? row.equation}</span>
                      <span>{row.age} سنة</span>
                      <span className="text-gold-300">{row.targetCalories ?? "إحالة"} سعر</span>
                    </span>
                  </button>
                  <button
                    onClick={() => deleteRecord(row)}
                    disabled={deletingId === row.id}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-red-400/30 px-3 py-1.5 text-[10px] font-black text-red-300 transition hover:bg-red-500/15 disabled:opacity-50"
                    aria-label="حذف السجل"
                  >
                    {deletingId === row.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                    حذف السجل
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 text-center ${highlight ? "border-gold-500/50 bg-gold-500/10" : "border-white/10 bg-white/[0.03]"}`}>
      <div className="text-[10px] font-bold text-bone/45">{label}</div>
      <div className={`mt-1 text-xl font-black ${highlight ? "text-gold-300" : "text-bone"}`}>
        {value}
      </div>
    </div>
  );
}
