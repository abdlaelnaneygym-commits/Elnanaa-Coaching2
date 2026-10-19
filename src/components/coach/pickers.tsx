"use client";

import type { ExerciseRow, FoodRow } from "@/db/schema";
import { FOOD_CATEGORIES, MUSCLE_GROUPS } from "@/lib/plans";
import { Beef, Dumbbell, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "./ui";

/** منتقي الأطعمة من المكتبة */
export function FoodPicker({
  open,
  onClose,
  foods,
  onPick,
  mealName,
}: {
  open: boolean;
  onClose: () => void;
  foods: FoodRow[];
  onPick: (food: FoodRow) => void;
  mealName?: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("الكل");

  const filtered = useMemo(() => {
    const q = query.trim();
    return foods.filter((f) => {
      if (category !== "الكل" && f.category !== category) return false;
      if (q && !f.name.includes(q)) return false;
      return true;
    });
  }, [foods, query, category]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="اختر طعاماً من المكتبة"
      subtitle={mealName ? `إضافة إلى: ${mealName}` : "مكتبة الأغذية — القيم لكل 100 جرام"}
    >
      <div className="relative">
        <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-bone/35" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="field pr-11 text-sm sm:text-base"
          placeholder="ابحث عن طعام… مثال: صدر دجاج"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["الكل", ...FOOD_CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-full px-3.5 py-1.5 text-[11px] font-black transition ${
              category === cat
                ? "bg-gold-500 text-coal-950"
                : "border border-white/10 text-bone/55 hover:border-gold-500/40 hover:text-gold-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-4 max-h-[52vh] space-y-2 overflow-y-auto overscroll-contain pl-1 sm:mt-5 sm:max-h-[46vh]">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-xs font-bold text-bone/40">
            لا توجد نتائج مطابقة — جرّب كلمة أخرى
          </p>
        ) : (
          filtered.map((food) => (
            <button
              key={food.id}
              onClick={() => {
                onPick(food);
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-start transition-all duration-200 hover:border-gold-500/50 hover:bg-gold-500/[0.07] sm:gap-4 sm:px-4 sm:py-3"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-300">
                <Beef size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold">{food.name}</span>
                <span className="mt-0.5 block text-[10px] font-bold text-bone/40">
                  {food.category}
                </span>
              </span>
              <span className="shrink-0 text-end">
                <span className="block text-base font-black text-gold-300">{food.kcal}</span>
                <span className="block text-[9px] font-bold text-bone/35">سعر/100جم</span>
              </span>
              <span className="hidden shrink-0 gap-2 text-[9px] font-black text-bone/45 sm:flex">
                <span className="rounded-md bg-white/5 px-2 py-1">ب {food.protein}</span>
                <span className="rounded-md bg-white/5 px-2 py-1">ك {food.carbs}</span>
                <span className="rounded-md bg-white/5 px-2 py-1">د {food.fats}</span>
              </span>
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}

/** منتقي التمارين من المكتبة */
export function ExercisePicker({
  open,
  onClose,
  exercises,
  onPick,
  dayTitle,
}: {
  open: boolean;
  onClose: () => void;
  exercises: ExerciseRow[];
  onPick: (exercise: ExerciseRow) => void;
  dayTitle?: string;
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string>("الكل");

  const filtered = useMemo(() => {
    const q = query.trim();
    return exercises.filter((e) => {
      if (group !== "الكل" && e.muscleGroup !== group) return false;
      if (q && !e.name.includes(q)) return false;
      return true;
    });
  }, [exercises, query, group]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="اختر تمريناً من المكتبة"
      subtitle={dayTitle ? `إضافة إلى: ${dayTitle}` : "مكتبة التمارين مصنّفة حسب العضلات"}
    >
      <div className="relative">
        <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-bone/35" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="field pr-11 text-sm sm:text-base"
          placeholder="ابحث عن تمرين… مثال: بنش برس"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["الكل", ...MUSCLE_GROUPS].map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={`rounded-full px-3.5 py-1.5 text-[11px] font-black transition ${
              group === g
                ? "bg-gold-500 text-coal-950"
                : "border border-white/10 text-bone/55 hover:border-gold-500/40 hover:text-gold-300"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="mt-4 grid max-h-[52vh] grid-cols-1 gap-2 overflow-y-auto overscroll-contain pl-1 sm:mt-5 sm:max-h-[46vh] sm:grid-cols-2">
        {filtered.length === 0 ? (
          <p className="col-span-full py-10 text-center text-xs font-bold text-bone/40">
            لا توجد نتائج مطابقة — جرّب كلمة أخرى
          </p>
        ) : (
          filtered.map((exercise) => (
            <button
              key={exercise.id}
              onClick={() => {
                onPick(exercise);
                onClose();
              }}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-start transition-all duration-200 hover:border-gold-500/50 hover:bg-gold-500/[0.07] sm:px-4 sm:py-3"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-300">
                <Dumbbell size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-extrabold">{exercise.name}</span>
                <span className="mt-0.5 block text-[10px] font-bold text-gold-400/70">
                  {exercise.muscleGroup}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}
