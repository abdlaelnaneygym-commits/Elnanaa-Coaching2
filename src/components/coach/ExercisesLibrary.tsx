"use client";

import type { ExerciseRow } from "@/db/schema";
import { MUSCLE_GROUPS } from "@/lib/plans";
import { Dumbbell, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CoachBadge, EmptyState, LoadingGrid, Modal } from "./ui";

const MUSCLE_COLORS: Record<string, string> = {
  صدر: "border-sky-400/30 bg-sky-500/10 text-sky-200",
  ظهر: "border-violet-400/30 bg-violet-500/10 text-violet-200",
  أرجل: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  كتف: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  باي: "border-rose-400/30 bg-rose-500/10 text-rose-200",
  تراي: "border-cyan-400/30 bg-cyan-500/10 text-cyan-200",
  بطن: "border-orange-400/30 bg-orange-500/10 text-orange-200",
  كارديو: "border-lime-400/30 bg-lime-500/10 text-lime-200",
};

export default function ExercisesLibrary({ headers }: { headers: Record<string, string> }) {
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("الكل");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", muscleGroup: "صدر" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/exercises", { headers, cache: "no-store" });
      const json = await res.json();
      if (json.ok) setExercises(json.data ?? []);
    } catch {
      /* تجاهل */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim();
    return exercises.filter((e) => {
      if (group !== "الكل" && e.muscleGroup !== group) return false;
      if (q && !e.name.includes(q)) return false;
      return true;
    });
  }, [exercises, query, group]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "تعذّر الحفظ");
        return;
      }
      setModalOpen(false);
      setForm({ name: "", muscleGroup: form.muscleGroup });
      await load();
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  async function remove(exercise: ExerciseRow) {
    if (!confirm(`حذف "${exercise.name}" من المكتبة نهائياً؟`)) return;
    setExercises((prev) => prev.filter((e) => e.id !== exercise.id));
    await fetch(`/api/exercises/${exercise.id}`, { method: "DELETE", headers });
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/10 bg-coal-900/70 p-4 sm:gap-4 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-500/15 text-gold-300">
            <Dumbbell size={20} />
          </span>
          <div>
            <h2 className="text-sm font-black sm:text-base">مكتبة التمارين</h2>
            <p className="mt-0.5 text-[11px] text-bone/45">
              {exercises.length} تمرين مصنّف حسب {MUSCLE_GROUPS.length} مجموعات عضلية
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setError("");
            setModalOpen(true);
          }}
          className="btn-shine inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-gold-300 to-gold-600 px-6 py-3 text-xs font-black text-coal-950 transition-transform duration-300 hover:scale-[1.03]"
        >
          <Plus size={15} />
          إضافة تمرين
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full min-w-0 flex-1 sm:min-w-56">
          <Search size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-bone/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="field pr-11"
            placeholder="ابحث في المكتبة…"
          />
        </div>
        <div className="-mx-1 flex flex-wrap gap-2 px-1">
          {["الكل", ...MUSCLE_GROUPS].map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`rounded-full px-3.5 py-2 text-[11px] font-black transition ${
                group === g
                  ? "bg-gold-500 text-coal-950"
                  : "border border-white/10 text-bone/55 hover:border-gold-500/40 hover:text-gold-300"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingGrid count={6} height="h-28" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Dumbbell} text="لا توجد تمارين مطابقة — جرّب كلمة أخرى أو أضف تمريناً جديداً." />
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
          {filtered.map((exercise) => (
            <div
              key={exercise.id}
              className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-coal-900/60 px-3 py-3 transition hover:border-gold-500/30 sm:px-4 sm:py-3.5"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-300">
                <Dumbbell size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold">{exercise.name}</span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${
                      MUSCLE_COLORS[exercise.muscleGroup] ??
                      "border-white/20 bg-white/5 text-bone/60"
                    }`}
                  >
                    {exercise.muscleGroup}
                  </span>
                  {exercise.isCustom && <CoachBadge tone="green">مخصص</CoachBadge>}
                </span>
              </span>
              <button
                onClick={() => remove(exercise)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 text-bone/40 opacity-0 transition group-hover:opacity-100 hover:border-red-400/50 hover:text-red-300"
                aria-label="حذف"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="إضافة تمرين جديد"
        subtitle="أضف تمريناً مخصصاً لمكتبتك"
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-bone/60">اسم التمرين *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="field"
              placeholder="مثال: بنش برس بالبار"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-bone/60">
              مجموعة العضلات *
            </label>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm({ ...form, muscleGroup: g })}
                  className={`rounded-full px-3.5 py-2 text-[11px] font-black transition ${
                    form.muscleGroup === g
                      ? "bg-gold-500 text-coal-950"
                      : "border border-white/10 text-bone/55"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-200">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 text-bone/50 transition hover:text-bone"
              aria-label="إلغاء"
            >
              <X size={16} />
            </button>
            <button
              type="submit"
              disabled={busy}
              className="btn-shine flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold-300 to-gold-600 py-3 text-sm font-black text-coal-950 disabled:opacity-60"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : null}
              إضافة للمكتبة
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
