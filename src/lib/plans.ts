/** أنواع ومساعدات بناء الخطط الغذائية والتدريبية */

export interface DietItem {
  foodId: number | null;
  name: string;
  grams: number;
  /** القيم لكل 100 جرام */
  kcal: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface Meal {
  id: string;
  name: string;
  items: DietItem[];
}

export interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface WorkoutEntry {
  exerciseId: number | null;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string;
}

export interface WorkoutDay {
  id: string;
  title: string;
  entries: WorkoutEntry[];
}

export const MUSCLE_GROUPS = [
  "صدر",
  "ظهر",
  "أرجل",
  "كتف",
  "باي",
  "تراي",
  "بطن",
  "كارديو",
] as const;

export const FOOD_CATEGORIES = [
  "بروتين",
  "كربوهيدرات",
  "دهون ومكسرات",
  "خضار",
  "فواكه",
  "ألبان",
  "أخرى",
] as const;

export const DEFAULT_MEAL_NAMES = [
  "الإفطار",
  "سناك صباحي",
  "الغداء",
  "سناك قبل التمرين",
  "العشاء",
];

export const DEFAULT_DAY_TITLES = [
  "اليوم الأول — صدر + تراي",
  "اليوم الثاني — ظهر + باي",
  "اليوم الثالث — أرجل + بطن",
  "اليوم الرابع — كتف + كارديو",
];

export const REP_PRESETS = ["8-12", "10-12", "12-15", "15-20", "6-8", "حتى الفشل", "60 ثانية"];

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function itemTotals(item: DietItem): Totals {
  const f = item.grams / 100;
  return {
    calories: item.kcal * f,
    protein: item.protein * f,
    carbs: item.carbs * f,
    fats: item.fats * f,
  };
}

export function computeTotals(meals: Meal[]): Totals {
  const totals: Totals = { calories: 0, protein: 0, carbs: 0, fats: 0 };
  for (const meal of meals) {
    for (const item of meal.items) {
      const t = itemTotals(item);
      totals.calories += t.calories;
      totals.protein += t.protein;
      totals.carbs += t.carbs;
      totals.fats += t.fats;
    }
  }
  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fats: Math.round(totals.fats),
  };
}

export function mealTotals(meal: Meal): Totals {
  return computeTotals([meal]);
}

export function countWorkoutSets(days: WorkoutDay[]): number {
  return days.reduce((sum, d) => sum + d.entries.reduce((s, e) => s + (e.sets || 0), 0), 0);
}

/**
 * يحوّل القيمة المخزّنة إلى مسار قابل للعرض:
 * - data:… => صورة/ملف محفوظ داخل قاعدة البيانات (يعمل على أي استضافة)
 * - /…    => ملف ثابت داخل مجلد public
 * - غير ذلك => ملف مرفوع على القرص
 */
export function resolveUpload(name: string | null | undefined): string {
  if (!name) return "";
  if (name.startsWith("data:") || name.startsWith("/")) return name;
  return `/api/uploads/${encodeURIComponent(name)}`;
}

/** نص جاهز للإرسال للعميل — النظام الغذائي */
export function dietPlanText(plan: {
  clientName: string;
  targetCalories: number;
  meals: Meal[];
}): string {
  const totals = computeTotals(plan.meals);
  const lines: string[] = [
    `النظام الغذائي — ${plan.clientName}`,
    `السعرات المستهدفة: ${plan.targetCalories} سعر`,
    `الإجمالي الفعلي: ${totals.calories} سعر (بروتين ${totals.protein} جم / كربوهيدرات ${totals.carbs} جم / دهون ${totals.fats} جم)`,
    "",
  ];
  for (const meal of plan.meals) {
    const mt = mealTotals(meal);
    lines.push(`▸ ${meal.name} — ${mt.calories} سعر`);
    for (const item of meal.items) {
      const it = itemTotals(item);
      lines.push(
        `   • ${item.name}: ${item.grams} جم (${Math.round(it.calories)} سعر / ب ${Math.round(it.protein)} / ك ${Math.round(it.carbs)} / د ${Math.round(it.fats)})`,
      );
    }
    lines.push("");
  }
  lines.push("إعداد: كابتن عبد الله النعناع — Elnanaa Coaching");
  return lines.join("\n");
}

/** نص جاهز للإرسال للعميل — البرنامج التدريبي */
export function workoutPlanText(plan: {
  clientName: string;
  days: WorkoutDay[];
}): string {
  const lines = [`البرنامج التدريبي — ${plan.clientName}`, ""];
  for (const day of plan.days) {
    lines.push(`▸ ${day.title}`);
    day.entries.forEach((entry, i) => {
      lines.push(`   ${i + 1}. ${entry.name} — ${entry.sets} مجموعات × ${entry.reps} تكرار`);
    });
    lines.push("");
  }
  lines.push("إعداد: كابتن عبد الله النعناع — Elnanaa Coaching");
  return lines.join("\n");
}
