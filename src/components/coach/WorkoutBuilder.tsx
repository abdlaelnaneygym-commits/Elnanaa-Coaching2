"use client";

import type { ExerciseRow, WorkoutPlanRow } from "@/db/schema";
import {
  countWorkoutSets,
  DEFAULT_DAY_TITLES,
  uid,
  workoutPlanText,
  type WorkoutDay,
} from "@/lib/plans";
import {
  ArrowLeft,
  Check,
  ClipboardCopy,
  Dumbbell,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ExercisePicker } from "./pickers";
import { CoachBadge, Stepper } from "./ui";

export default function WorkoutBuilder({
  headers,
  clientName,
  dietPlanId,
  onExit,
}: {
  headers: Record<string, string>;
  clientName: string;
  dietPlanId: number | null;
  onExit: () => void;
}) {
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<WorkoutDay[]>(() =>
    DEFAULT_DAY_TITLES.map((title) => ({ id: uid(), title, entries: [] })),
  );
  const [notes, setNotes] = useState("");
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedPlan, setSavedPlan] = useState<WorkoutPlanRow | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/exercises", { headers, cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setExercises(json.data ?? []);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [headers]);

  const totalExercises = days.reduce((n, d) => n + d.entries.length, 0);
  const totalSets = useMemo(() => countWorkoutSets(days), [days]);

  function updateDay(id: string, patch: Partial<WorkoutDay>) {
    setDays((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function addEntry(dayId: string, exercise: ExerciseRow) {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? {
              ...d,
              entries: [
                ...d.entries,
                {
                  exerciseId: exercise.id,
                  name: exercise.name,
                  muscleGroup: exercise.muscleGroup,
                  sets: 3,
                  reps: "8-12",
                },
              ],
            }
          : d,
      ),
    );
  }

  function updateEntry(dayId: string, index: number, patch: Partial<WorkoutDay["entries"][number]>) {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? { ...d, entries: d.entries.map((e, i) => (i === index ? { ...e, ...patch } : e)) }
          : d,
      ),
    );
  }

  function removeEntry(dayId: string, index: number) {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId ? { ...d, entries: d.entries.filter((_, i) => i !== index) } : d,
      ),
    );
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/workout-plans", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          dietPlanId,
          days: days.map((d) => ({ title: d.title, entries: d.entries })),
          notes,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "تعذّر حفظ البرنامج");
        return;
      }
      setSavedPlan(json.data);
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  async function copyPlan() {
    try {
      await navigator.clipboard.writeText(workoutPlanText({ clientName, days }));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* تجاهل */
    }
  }

  return (
    <div className="space-y-6">
      <div className="static rounded-[1.5rem] sm:rounded-[1.75rem] lg:sticky lg:top-0 lg:z-20 border border-gold-500/30 bg-coal-900/95 p-6 shadow-[0_25px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl lg:top-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black tracking-wider text-gold-400">
              <Dumbbell size={13} />
              بناء البرنامج التدريبي
              {dietPlanId && <CoachBadge tone="green">مرتبط بنظام غذائي</CoachBadge>}
            </div>
            <h2 className="mt-1.5 text-2xl font-black">{clientName}</h2>
            <p className="mt-1 text-[11px] font-bold text-bone/45">
              {days.length} يوم تدريبي • {totalExercises} تمرين • {totalSets} مجموعة إجمالاً
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
      </div>

      {savedPlan ? (
        <div className="rounded-[1.75rem] border border-emerald-400/40 bg-emerald-500/[0.07] p-8 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
            <Check size={30} />
          </span>
          <h3 className="mt-5 text-xl font-black">تم حفظ البرنامج التدريبي بنجاح</h3>
          <p className="mt-2 text-xs text-bone/55">
            {days.length} يوم • {totalExercises} تمرين • {totalSets} مجموعة — جاهز للإرسال للعميل
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              onClick={copyPlan}
              className="btn-shine inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-gold-300 to-gold-600 px-7 py-3.5 text-sm font-black text-coal-950"
            >
              {copied ? <Check size={15} /> : <ClipboardCopy size={15} />}
              {copied ? "تم النسخ!" : "نسخ البرنامج للعميل"}
            </button>
            <button
              onClick={onExit}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-black text-bone/65 transition hover:text-gold-300"
            >
              رجوع للوحة
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {days.map((day, dayIndex) => {
              const daySets = day.entries.reduce((s, e) => s + e.sets, 0);
              return (
                <div
                  key={day.id}
                  className="rounded-[1.25rem] border border-white/10 bg-coal-900/70 p-4 sm:rounded-[1.5rem] sm:p-5"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-xs font-black text-gold-300">
                      {dayIndex + 1}
                    </span>
                    <input
                      value={day.title}
                      onChange={(e) => updateDay(day.id, { title: e.target.value })}
                      className="min-w-32 flex-1 rounded-xl border border-transparent bg-transparent px-2 py-1 text-base font-black outline-none transition hover:border-white/10 focus:border-gold-500/50 focus:bg-white/[0.04]"
                    />
                    <span className="rounded-full bg-white/5 px-3 py-1.5 text-[10px] font-black text-bone/50">
                      {day.entries.length} تمرين • {daySets} مجموعة
                    </span>
                    <button
                      onClick={() => setPickerFor(day.id)}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gold-500 px-4 py-2 text-[11px] font-black text-coal-950 transition hover:bg-gold-400 disabled:opacity-50"
                    >
                      <Plus size={13} />
                      تمرين
                    </button>
                    {days.length > 1 && (
                      <button
                        onClick={() => setDays((prev) => prev.filter((d) => d.id !== day.id))}
                        className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-bone/40 transition hover:border-red-400/50 hover:text-red-300"
                        aria-label="حذف اليوم"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {day.entries.length === 0 ? (
                    <p className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-[11px] font-bold text-bone/35">
                      لا توجد تمارين — اضغط «تمرين» لاختيار من المكتبة
                    </p>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {day.entries.map((entry, index) => (
                        <div
                          key={`${day.id}-${index}`}
                          className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-3 py-3 sm:gap-3 sm:px-4"
                        >
                          <span className="w-5 shrink-0 text-center text-[11px] font-black text-bone/35">
                            {index + 1}
                          </span>
                          <span className="w-full min-w-0 flex-1 sm:w-auto sm:min-w-32">
                            <span className="block text-sm font-extrabold">{entry.name}</span>
                            <span className="mt-0.5 block text-[10px] font-bold text-gold-400/70">
                              {entry.muscleGroup}
                            </span>
                          </span>
                          <div className="w-24 shrink-0 sm:w-28">
                            <span className="mb-1 block text-center text-[9px] font-bold text-bone/40">
                              المجموعات
                            </span>
                            <Stepper
                              value={entry.sets}
                              onChange={(v) => updateEntry(day.id, index, { sets: v })}
                              step={1}
                              min={1}
                              max={10}
                            />
                          </div>
                          <div className="w-24 shrink-0 sm:w-32">
                            <span className="mb-1 block text-center text-[9px] font-bold text-bone/40">
                              التكرارات
                            </span>
                            <input
                              value={entry.reps}
                              onChange={(e) => updateEntry(day.id, index, { reps: e.target.value })}
                              className="field px-2 py-1.5 text-center text-xs font-black"
                              placeholder="8-12"
                            />
                          </div>
                          <button
                            onClick={() => removeEntry(day.id, index)}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 text-bone/40 transition hover:border-red-400/50 hover:text-red-300"
                            aria-label="حذف"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() =>
              setDays((prev) => [...prev, { id: uid(), title: `اليوم ${prev.length + 1}`, entries: [] }])
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-4 text-xs font-black text-bone/55 transition hover:border-gold-500/50 hover:text-gold-300"
          >
            <Plus size={15} />
            إضافة يوم تدريبي
          </button>

          <div className="rounded-[1.75rem] border border-white/10 bg-coal-900/70 p-6">
            <label className="mb-2 block text-[11px] font-bold text-bone/60">
              ملاحظات البرنامج (اختياري)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="field resize-none"
              placeholder="مثال: راحة 60-90 ثانية بين المجموعات — تسخين 10 دقائق قبل البدء…"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-200">
              {error}
            </div>
          )}

          <button
            onClick={save}
            disabled={saving || totalExercises === 0}
            className="btn-shine flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold-300 to-gold-600 py-4 text-sm font-black text-coal-950 transition-transform duration-300 hover:scale-[1.01] disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            حفظ البرنامج التدريبي
          </button>
          {totalExercises === 0 && (
            <p className="text-center text-[11px] font-bold text-bone/35">
              أضف تمريناً واحداً على الأقل لتتمكن من الحفظ
            </p>
          )}
        </>
      )}

      <ExercisePicker
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        exercises={exercises}
        onPick={(exercise) => {
          if (pickerFor) addEntry(pickerFor, exercise);
        }}
        dayTitle={days.find((d) => d.id === pickerFor)?.title}
      />
    </div>
  );
}
