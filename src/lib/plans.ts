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

/** خيار بديل داخل الوجبة — كل خيار وجبة كاملة مستقلة */
export interface DietOption {
  id: string;
  name: string;
  items: DietItem[];
}

export interface Meal {
  id: string;
  name: string;
  /** الأصناف — تُستخدم مباشرة في الأنظمة القديمة (توافق تدريجي)،
   *  أو كخيار أول مضغوط عند غياب options */
  items: DietItem[];
  /** الخيارات البديلة للوجبة (اختيارية) */
  options?: DietOption[];
}

/** تنبيه ثابت يظهر أسفل الوجبة متعددة الخيارات */
export const OPTION_ALERT =
  "💡 تنبيه: اختر خياراً واحداً فقط من ضمن الخيارات المتاحة لهذه الوجبة.";

/** التسمية تلقائياً: الخيار الأول، الثاني، الثالث... */
export function optionLabel(index: number): string {
  const ordinals = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس"];
  return ordinals[index] ? `الخيار ${ordinals[index]}` : `الخيار ${index + 1}`;
}

/** الخيارات الفعلية للوجبة — يعيد options إن وجدت، وإلا يغلّف items كخيار واحد (توافق) */
export function mealOptions(meal: Meal): DietOption[] {
  if (meal.options && meal.options.length > 0) return meal.options;
  return [{ id: `${meal.id}-single`, name: "الخيار الأول", items: meal.items ?? [] }];
}

/** إجماليات مصفوفة أصناف — غير مقرّبة داخلياً */
export function itemsTotals(items: DietItem[]): Totals {
  const t = { calories: 0, protein: 0, carbs: 0, fats: 0 };
  for (const item of items) {
    const f = item.grams / 100;
    t.calories += item.kcal * f;
    t.protein += item.protein * f;
    t.carbs += item.carbs * f;
    t.fats += item.fats * f;
  }
  return t;
}

/** إجماليات خيار واحد (مقرّبة للعرض) */
export function optionTotals(option: DietOption): Totals {
  return roundTotals(itemsTotals(option.items));
}

function roundTotals(t: Totals): Totals {
  return {
    calories: Math.round(t.calories),
    protein: Math.round(t.protein),
    carbs: Math.round(t.carbs),
    fats: Math.round(t.fats),
  };
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

/**
 * إجمالي اليوم: الخيارات البديلة اختيارات متبادلة — لا تُجمع معاً.
 * يُستخدم الخيار الأول (في ترتيب الخيارات) كمرجع احتسابي لكل وجبة.
 */
export function computeTotals(meals: Meal[]): Totals {
  const totals: Totals = { calories: 0, protein: 0, carbs: 0, fats: 0 };
  for (const meal of meals) {
    const ref = mealOptions(meal)[0];
    for (const item of ref.items) {
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
  return optionTotals(mealOptions(meal)[0]);
}

/** الطاقة المحسوبة من الماكروز وفق معادلة 4/4/9 */
export function macroEnergy(protein: number, carbs: number, fats: number): number {
  return Math.round(protein * 4 + carbs * 4 + fats * 9);
}

/**
 * تحقّق اتساق: الفرق بين سعرات الأصناف المسجلة والطاقة المحسوبة من الماكروز.
 * يرجع العبارة التحذيرية أو null عند التطابق المعقول (هامش 60 سعرة).
 */
export function macroConsistencyWarning(totals: Totals): string | null {
  const energy = macroEnergy(totals.protein, totals.carbs, totals.fats);
  const diff = Math.round(totals.calories - energy);
  if (Math.abs(diff) <= 60) return null;
  return `⚠️ تنبيه للمراجعة: السعرات المسجلة من الأصناف (${totals.calories}) تختلف عن المحسوبة من الماكروز (${energy}) بمقدار ${Math.abs(diff)} سعر — راجع بيانات الأصناف.`;
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

/** نص جاهز للإرسال للعميل — النظام الغذائي (بدعم الخيارات البديلة) */
export function dietPlanText(plan: {
  clientName: string;
  targetCalories: number;
  meals: Meal[];
}): string {
  const totals = computeTotals(plan.meals);
  const lines: string[] = [
    `النظام الغذائي — ${plan.clientName}`,
    `السعرات المستهدفة: ${plan.targetCalories} سعر`,
    `الإجمالي اليومي (بالخيار الأول من كل وجبة): ${totals.calories} سعر`,
    `بروتين ${totals.protein} جم / كربوهيدرات ${totals.carbs} جم / دهون ${totals.fats} جم`,
    "",
  ];
  for (const meal of plan.meals) {
    const options = mealOptions(meal);
    lines.push(`▸ ${meal.name}`);
    for (let oi = 0; oi < options.length; oi++) {
      const option = options[oi];
      const ot = optionTotals(option);
      const prefix = options.length > 1 ? `   ${option.name} — ${ot.calories} سعر (ب ${ot.protein} / ك ${ot.carbs} / د ${ot.fats}):` : `   ${ot.calories} سعر (ب ${ot.protein} / ك ${ot.carbs} / د ${ot.fats}):`;
      lines.push(prefix);
      for (const item of option.items) {
        const it = itemTotals(item);
        lines.push(
          `      • ${item.name}: ${item.grams} جم — ${Math.round(it.calories)} سعر / ب ${Math.round(it.protein)} / ك ${Math.round(it.carbs)} / د ${Math.round(it.fats)}`,
        );
      }
    }
    if (options.length > 1) {
      lines.push(`   ${OPTION_ALERT}`);
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
