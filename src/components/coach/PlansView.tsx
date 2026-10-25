"use client";

import type { DietPlanRow, WorkoutPlanRow } from "@/db/schema";
import {
  computeTotals,
  countWorkoutSets,
  dietPlanText,
  mealOptions,
  OPTION_ALERT,
  optionTotals,
  workoutPlanText,
} from "@/lib/plans";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCopy,
  Dumbbell,
  Plus,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CoachBadge, EmptyState, LoadingGrid } from "./ui";

function fmtDate(value: string | Date) {
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(value));
}

export default function PlansView({
  headers,
  onCreateWorkout,
}: {
  headers: Record<string, string>;
  onCreateWorkout: (dietPlanId: number, clientName: string) => void;
}) {
  const [diets, setDiets] = useState<DietPlanRow[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDiet, setOpenDiet] = useState<number | null>(null);
  const [openWorkout, setOpenWorkout] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  async function load() {
    try {
      const [dRes, wRes] = await Promise.all([
        fetch("/api/diet-plans", { headers, cache: "no-store" }),
        fetch("/api/workout-plans", { headers, cache: "no-store" }),
      ]);
      const [dJson, wJson] = await Promise.all([dRes.json(), wRes.json()]);
      if (dJson.ok) setDiets(dJson.data ?? []);
      if (wJson.ok) setWorkouts(wJson.data ?? []);
    } catch {
      /* تجاهل */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function copy(text: string, id: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* تجاهل */
    }
  }

  async function deleteDiet(id: number) {
    if (!confirm("حذف هذا النظام الغذائي نهائياً؟")) return;
    setDiets((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/diet-plans/${id}`, { method: "DELETE", headers });
  }

  async function deleteWorkout(id: number) {
    if (!confirm("حذف هذا البرنامج التدريبي نهائياً؟")) return;
    setWorkouts((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/workout-plans/${id}`, { method: "DELETE", headers });
  }

  if (loading) return <LoadingGrid count={4} />;

  return (
    <div className="space-y-8">
      {/* أنظمة غذائية */}
      <section>
        <h2 className="flex items-center gap-2 text-base font-black">
          <UtensilsCrossed size={17} className="text-gold-400" />
          الأنظمة الغذائية
          <span className="text-xs font-bold text-bone/40">({diets.length})</span>
        </h2>

        {diets.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={UtensilsCrossed}
              text="لا توجد أنظمة غذائية محفوظة — ابدأ من حاسبة السعرات لحساب سعرات العميل ثم إنشاء نظامه."
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {diets.map((plan) => {
              const totals = computeTotals(plan.meals);
              const items = plan.meals.reduce((n, m) => n + m.items.length, 0);
              const open = openDiet === plan.id;
              return (
                <div
                  key={plan.id}
                  className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-coal-900/60 sm:rounded-[1.5rem]"
                >
                  <button
                    onClick={() => setOpenDiet(open ? null : plan.id)}
                    className="flex w-full flex-wrap items-center gap-2.5 p-4 text-start transition hover:bg-white/[0.02] sm:gap-3 sm:p-5"
                  >
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-bone/40 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                    <span className="w-full min-w-0 flex-1 sm:w-auto sm:min-w-32">
                      <span className="block text-sm font-black">{plan.clientName}</span>
                      <span className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-bone/40">
                        <CalendarDays size={11} />
                        {fmtDate(plan.createdAt)} • {plan.meals.length} وجبة • {items} صنف
                      </span>
                    </span>
                    <span className="text-lg font-black text-gold-300">
                      {totals.calories}
                      <span className="text-[10px] font-bold text-bone/40"> / {plan.targetCalories} سعر</span>
                    </span>
                    {plan.status === "confirmed" ? (
                      <CoachBadge tone="green">
                        <Check size={10} /> مؤكد
                      </CoachBadge>
                    ) : (
                      <CoachBadge tone="gray">مسودة</CoachBadge>
                    )}
                  </button>

                  {open && (
                    <div className="border-t border-white/[0.07] p-5">
                      <div className="grid grid-cols-3 gap-2.5">
                        <MiniStat label="بروتين" value={`${totals.protein}/${plan.targetProtein}`} />
                        <MiniStat label="كربوهيدرات" value={`${totals.carbs}/${plan.targetCarbs}`} />
                        <MiniStat label="دهون" value={`${totals.fats}/${plan.targetFats}`} />
                      </div>

                      <div className="mt-4 space-y-3">
                        {plan.meals.map((meal, mi) => {
                          const options = mealOptions(meal);
                          const multi = options.length > 1;
                          return (
                            <div key={mi} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm font-extrabold text-gold-300">{meal.name}</h4>
                                {multi && (
                                  <span className="rounded-full bg-gold-500/15 px-2.5 py-1 text-[9px] font-black text-gold-300">
                                    {options.length} خيارات بديلة
                                  </span>
                                )}
                              </div>
                              <div className={`mt-2.5 space-y-3 ${multi ? "" : ""}`}>
                                {options.map((option) => {
                                  const ot = optionTotals(option);
                                  return (
                                    <div key={option.id} className={multi ? "rounded-xl border border-white/[0.06] bg-coal-950/40 p-3" : ""}>
                                      {multi && (
                                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                          <span className="text-xs font-black text-bone">{option.name}</span>
                                          <span className="text-[10px] font-black text-gold-300/90">
                                            {ot.calories} سعر • ب {ot.protein} • ك {ot.carbs} • د {ot.fats}
                                          </span>
                                        </div>
                                      )}
                                      {option.items.length > 0 ? (
                                        <ul className="space-y-1.5">
                                          {option.items.map((item, ii) => (
                                            <li
                                              key={ii}
                                              className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-bone/60"
                                            >
                                              <span className="font-bold text-bone/80">
                                                {item.name} — {item.grams} جم
                                              </span>
                                              <span className="font-black text-gold-300/80">
                                                {Math.round((item.kcal * item.grams) / 100)} سعر
                                              </span>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-[10px] text-bone/35">لا أصناف</p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              {multi && (
                                <div className="mt-3 rounded-xl border border-gold-500/25 bg-gold-500/[0.06] px-3 py-2 text-center text-[10px] font-black text-gold-200">
                                  {OPTION_ALERT}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {plan.notes && (
                        <p className="mt-3 rounded-xl bg-white/[0.03] px-4 py-3 text-[11px] leading-6 text-bone/55">
                          ملاحظات: {plan.notes}
                        </p>
                      )}

                      <div className="mt-3.5 flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            onCreateWorkout(
                              plan.id,
                              plan.clientName,
                            )
                          }
                          className="btn-shine inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-gold-300 to-gold-600 px-5 py-2.5 text-[11px] font-black text-coal-950"
                        >
                          <Plus size={13} />
                          إنشاء برنامج تدريبي
                        </button>
                        <button
                          onClick={() =>
                            copy(
                              dietPlanText({
                                clientName: plan.clientName,
                                targetCalories: plan.targetCalories,
                                meals: plan.meals,
                              }),
                              plan.id,
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 px-5 py-2.5 text-[11px] font-black text-gold-300 transition hover:bg-gold-500 hover:text-coal-950"
                        >
                          {copiedId === plan.id ? <Check size={13} /> : <ClipboardCopy size={13} />}
                          {copiedId === plan.id ? "تم النسخ!" : "نسخ"}
                        </button>
                        <button
                          onClick={() => deleteDiet(plan.id)}
                          className="mr-auto inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-[11px] font-black text-bone/45 transition hover:border-red-400/50 hover:text-red-300"
                        >
                          <Trash2 size={13} />
                          حذف
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* برامج تدريبية */}
      <section>
        <h2 className="flex items-center gap-2 text-base font-black">
          <Dumbbell size={17} className="text-gold-400" />
          البرامج التدريبية
          <span className="text-xs font-bold text-bone/40">({workouts.length})</span>
        </h2>

        {workouts.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Dumbbell}
              text="لا توجد برامج تدريبية محفوظة — أنشئ برنامجاً من داخل النظام الغذائي أو من زر «إنشاء برنامج تدريبي»."
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {workouts.map((plan) => {
              const exercises = plan.days.reduce((n, d) => n + d.entries.length, 0);
              const sets = countWorkoutSets(plan.days);
              const open = openWorkout === plan.id;
              return (
                <div
                  key={plan.id}
                  className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-coal-900/60 sm:rounded-[1.5rem]"
                >
                  <button
                    onClick={() => setOpenWorkout(open ? null : plan.id)}
                    className="flex w-full flex-wrap items-center gap-2.5 p-4 text-start transition hover:bg-white/[0.02] sm:gap-3 sm:p-5"
                  >
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-bone/40 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                    <span className="w-full min-w-0 flex-1 sm:w-auto sm:min-w-32">
                      <span className="block text-sm font-black">{plan.clientName}</span>
                      <span className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-bone/40">
                        <CalendarDays size={11} />
                        {fmtDate(plan.createdAt)} • {plan.days.length} يوم • {exercises} تمرين •{" "}
                        {sets} مجموعة
                      </span>
                    </span>
                    {plan.dietPlanId && <CoachBadge tone="green">مرتبط بنظام غذائي</CoachBadge>}
                  </button>

                  {open && (
                    <div className="space-y-3 border-t border-white/[0.07] p-5">
                      {plan.days.map((day, di) => (
                        <div key={di} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                          <h4 className="text-sm font-extrabold text-gold-300">{day.title}</h4>
                          {day.entries.length > 0 && (
                            <ul className="mt-2.5 space-y-1.5">
                              {day.entries.map((entry, ei) => (
                                <li
                                  key={ei}
                                  className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-bone/60"
                                >
                                  <span className="font-bold text-bone/80">
                                    {ei + 1}. {entry.name}
                                    <span className="mr-2 text-[9px] font-black text-gold-400/60">
                                      {entry.muscleGroup}
                                    </span>
                                  </span>
                                  <span className="font-black text-gold-300/80">
                                    {entry.sets} × {entry.reps}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                      {plan.notes && (
                        <p className="rounded-xl bg-white/[0.03] px-4 py-3 text-[11px] leading-6 text-bone/55">
                          ملاحظات: {plan.notes}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            copy(
                              workoutPlanText({ clientName: plan.clientName, days: plan.days }),
                              plan.id + 100000,
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 px-5 py-2.5 text-[11px] font-black text-gold-300 transition hover:bg-gold-500 hover:text-coal-950"
                        >
                          {copiedId === plan.id + 100000 ? (
                            <Check size={13} />
                          ) : (
                            <ClipboardCopy size={13} />
                          )}
                          {copiedId === plan.id + 100000 ? "تم النسخ!" : "نسخ"}
                        </button>
                        <button
                          onClick={() => deleteWorkout(plan.id)}
                          className="mr-auto inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-[11px] font-black text-bone/45 transition hover:border-red-400/50 hover:text-red-300"
                        >
                          <Trash2 size={13} />
                          حذف
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-center">
      <div className="text-[10px] font-bold text-bone/45">{label}</div>
      <div className="mt-0.5 text-xs font-black text-bone">{value}</div>
    </div>
  );
}
