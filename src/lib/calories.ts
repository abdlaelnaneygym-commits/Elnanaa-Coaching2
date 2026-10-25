/**
 * محرك حساب السعرات الحرارية — منصة Elnanaa Coaching
 * --------------------------------------------------------
 * البالغون (>= 18): معادلة Mifflin-St Jeor
 * الأطفال والمراهقون (< 18): معادلات Schofield المعتمدة عالمياً
 * الأطفال المحتاجون للتخسيس: لا تُنشأ خطة تلقائية — إحالة لأخصائي تغذية أطفال.
 */

export type Gender = "male" | "female";
export type Goal = "lose" | "maintain" | "gain";
export type EquationKey = "mifflin" | "katch";
export type ActivityKey =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "athlete";

export interface CalcInput {
  age: number;
  gender: Gender;
  weight: number; // كجم
  height: number; // سم
  activityLevel: ActivityKey;
  goal: Goal;
  /** معادلة الاختيار للبالغين: mifflin (افتراضي) أو katch */
  equation?: EquationKey;
  /** نسبة الدهون % — إلزامية عند اختيار Katch-McArdle */
  bodyFat?: number | null;
}

export interface CalcResult {
  bmr: number;
  tdee: number;
  bmi: number;
  isChild: boolean;
  equation: "mifflin" | "schofield" | "katch";
  /** null عندما تُحال الحالة لأخصائي تغذية أطفال */
  targetCalories: number | null;
  needsSpecialist: boolean;
  /** الكتلة الخالية من الدهون (عند Katch-McArdle) */
  leanMass?: number;
  /** مقدار العجز/الفائض الحراري مقارنة بـ TDEE (سالب = عجز) */
  delta?: number | null;
  /** معامل النشاط المُستخدم */
  activityFactor: number;
}

export const ACTIVITY_FACTORS: Record<ActivityKey, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityKey, string> = {
  sedentary: "خامل — بدون تمارين تقريباً",
  light: "نشاط خفيف — تمارين 1-3 أيام أسبوعياً",
  moderate: "نشاط متوسط — تمارين 3-5 أيام أسبوعياً",
  active: "نشاط عالي — تمارين 6-7 أيام أسبوعياً",
  athlete: "رياضي محترف — مجهود بدني يومي شاق",
};

export const GOAL_LABELS: Record<Goal, string> = {
  lose: "تخسيس وحرق دهون",
  maintain: "الحفاظ على الوزن الحالي",
  gain: "تضخيم وبناء عضلات",
};

/** معادلات Schofield للأطفال والمراهقين (الطول بالمتر) */
function schofieldBMR(
  age: number,
  gender: Gender,
  weightKg: number,
  heightM: number,
): number {
  if (gender === "male") {
    return age < 10
      ? 19.6 * weightKg + 130.3 * heightM + 414.9
      : 16.25 * weightKg + 137.2 * heightM + 515.5;
  }
  return age < 10
    ? 16.97 * weightKg + 161.8 * heightM + 371.2
    : 8.365 * weightKg + 465 * heightM + 200;
}

/** Mifflin-St Jeor للبالغين */
function mifflinBMR(
  age: number,
  gender: Gender,
  weightKg: number,
  heightCm: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

/** Katch-McArdle — يحتاج نسبة الدهون لحساب الكتلة الخالية من الدهون */
function katchBMR(weightKg: number, bodyFatPct: number): { bmr: number; leanMass: number } {
  const leanMass = weightKg * (1 - bodyFatPct / 100);
  return { bmr: 370 + 21.6 * leanMass, leanMass };
}

export const EQUATION_LABELS: Record<CalcResult["equation"], string> = {
  mifflin: "Mifflin-St Jeor",
  katch: "Katch-McArdle",
  schofield: "Schofield (معادلات الأطفال المعتمدة)",
};

export function assessCalories(input: CalcInput): CalcResult {
  const { age, gender, weight, height, activityLevel, goal } = input;
  const isChild = age < 18;
  const factor = ACTIVITY_FACTORS[activityLevel];

  // الأطفال والمراهقون: معادلات الأطفال دائماً (لا تُستخدم Katch أو Mifflin معهم)
  let equation: CalcResult["equation"];
  let rawBmr: number;
  let leanMass: number | undefined;

  if (isChild) {
    equation = "schofield";
    rawBmr = schofieldBMR(age, gender, weight, height / 100);
  } else if (input.equation === "katch" && typeof input.bodyFat === "number" && Number.isFinite(input.bodyFat)) {
    equation = "katch";
    const k = katchBMR(weight, input.bodyFat);
    rawBmr = k.bmr;
    leanMass = Math.round(k.leanMass * 10) / 10;
  } else {
    equation = "mifflin";
    rawBmr = mifflinBMR(age, gender, weight, height);
  }

  const bmr = Math.round(rawBmr);
  const tdee = Math.round(rawBmr * factor);
  const bmi = Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10;

  // القاعدة الذهبية: طفل يحتاج تخسيس => منع الخطة التلقائية نهائياً
  const needsSpecialist = isChild && goal === "lose";
  if (needsSpecialist) {
    return {
      bmr,
      tdee,
      bmi,
      isChild,
      equation,
      targetCalories: null,
      needsSpecialist,
      delta: null,
      activityFactor: factor,
      leanMass,
    };
  }

  let target: number;
  if (goal === "lose") {
    // عجز آمن 500 سعر مع حد أدنى صحي
    const floor = gender === "female" ? 1200 : 1400;
    target = Math.max(tdee - 500, floor);
  } else if (goal === "gain") {
    target = tdee + (isChild ? 250 : 300);
  } else {
    target = tdee;
  }

  const rounded = Math.round(target);
  return {
    bmr,
    tdee,
    bmi,
    isChild,
    equation,
    targetCalories: rounded,
    needsSpecialist,
    delta: rounded - tdee,
    activityFactor: factor,
    leanMass,
  };
}

/** تقسيم الماكروز لبناء النظام الغذائي في لوحة المدرب */
export interface MacroSplit {
  protein: number;
  carbs: number;
  fats: number;
}

export function macroSplit(
  targetCalories: number,
  weightKg: number,
  goal: Goal,
  isChild: boolean,
): MacroSplit {
  // بروتين أكثر تحفظاً للأطفال
  const proteinPerKg = isChild ? 1.6 : goal === "lose" ? 2.2 : goal === "gain" ? 2.0 : 1.8;
  const protein = Math.round(weightKg * proteinPerKg);
  const fats = Math.round((targetCalories * 0.27) / 9);
  const carbs = Math.max(
    0,
    Math.round((targetCalories - protein * 4 - fats * 9) / 4),
  );
  return { protein, carbs, fats };
}

export const PACKAGE_OPTIONS = [
  { id: "starter", title: "باقة المتابعة الشهرية", duration: "شهر واحد", price: 499 },
  { id: "transform", title: "باقة المتابعة 3 شهور", duration: "3 شهور", price: 1350 },
  { id: "elite", title: "باقة المتابعة 6 شهور", duration: "6 شهور", price: 2600 },
] as const;

export function validateCalcPayload(body: unknown):
  | { ok: true; data: CalcInput & { name: string } }
  | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "بيانات غير صالحة" };
  }
  const b = body as Record<string, unknown>;
  const name = String(b.name ?? "").trim();
  const age = Number(b.age);
  const weight = Number(b.weight);
  const height = Number(b.height);
  const gender = b.gender === "female" ? "female" : "male";
  const activityLevel = String(b.activityLevel) as ActivityKey;
  const goal = String(b.goal) as Goal;
  const equation = b.equation === "katch" ? "katch" : "mifflin";
  const bodyFat =
    b.bodyFat === undefined || b.bodyFat === null || b.bodyFat === ""
      ? null
      : Number(b.bodyFat);

  if (name.length < 2 || name.length > 100)
    return { ok: false, error: "برجاء إدخال اسم صحيح" };
  if (!Number.isFinite(age) || age < 5 || age > 100)
    return { ok: false, error: "السن يجب أن يكون بين 5 و 100 سنة" };
  if (!Number.isFinite(weight) || weight < 20 || weight > 300)
    return { ok: false, error: "برجاء إدخال وزن صحيح بالكيلوجرام" };
  if (!Number.isFinite(height) || height < 90 || height > 230)
    return { ok: false, error: "برجاء إدخال طول صحيح بالسنتيمتر" };
  if (!Object.keys(ACTIVITY_FACTORS).includes(activityLevel))
    return { ok: false, error: "برجاء اختيار مستوى النشاط" };
  if (!["lose", "maintain", "gain"].includes(goal))
    return { ok: false, error: "برجاء اختيار الهدف" };

  // Katch-McArdle — لا تُستخدم بدون نسبة دهون (للبالغين)
  if (equation === "katch" && age >= 18) {
    if (bodyFat === null || !Number.isFinite(bodyFat)) {
      return {
        ok: false,
        error: "معادلة Katch-McArdle تتطلب إدخال نسبة الدهون في الجسم",
      };
    }
    if (bodyFat < 0 || bodyFat > 100) {
      return {
        ok: false,
        error: "نسبة الدهون يجب أن تكون بين 0% و 100%",
      };
    }
  }

  return {
    ok: true,
    data: {
      name,
      age: Math.round(age),
      weight,
      height,
      gender,
      activityLevel,
      goal,
      equation,
      bodyFat,
    },
  };
}
