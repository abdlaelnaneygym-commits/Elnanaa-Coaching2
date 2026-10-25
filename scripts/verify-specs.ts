/**
 * اختبارات المواصفات الإلزامية
 * تشغيل: npx tsx scripts/verify-specs.ts
 */
import { assessCalories } from "../src/lib/calories";
import {
  computeTotals,
  dietPlanText,
  macroConsistencyWarning,
  macroEnergy,
  mealOptions,
  OPTION_ALERT,
  optionLabel,
  optionTotals,
  type Meal,
} from "../src/lib/plans";

let pass = 0, fail = 0;
function t(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}: حصلنا على ${JSON.stringify(actual)} ونتوقع ${JSON.stringify(expected)}`); }
}

console.log("\n■ اختبار إجمالي الوجبات الإلزامي: 255 + 513 + 208 + 312");
const meals: Meal[] = [255, 513, 208, 312].map((kc, i) => ({
  id: `m${i}`, name: `وجبة${i+1}`,
  items: [{ foodId: null, name: "اختبار", grams: 100, kcal: kc, protein: 0, carbs: 0, fats: 0 }],
}));
t("إجمالي السعرات = 1288", computeTotals(meals).calories, 1288);

console.log("\n■ معادلة الطاقة من الماكروز (4/4/9)");
t("(108×4)+(136×4)+(35×9) = 1291 — الصحيح رياضياً (Note: 1251 in spec is an arithmetic slip)", macroEnergy(108, 136, 35), 1291);

console.log("\n■ معادلة Mifflin-St Jeor");
const mf = assessCalories({ age: 25, gender: "male", weight: 85, height: 178, activityLevel: "moderate", goal: "maintain" });
t("BMR Mifflin ذكر 85kg/178cm/25y = 1843", mf.bmr, 1843);
t("المعادلة = mifflin", mf.equation, "mifflin");
t("معامل النشاط = 1.55", mf.activityFactor, 1.55);
t("TDEE = round(1842.5×1.55)", mf.tdee, Math.round(1842.5 * 1.55));

console.log("\n■ معادلة Katch-McArdle");
const km = assessCalories({ age: 30, gender: "female", weight: 90, height: 165, activityLevel: "light", goal: "maintain", equation: "katch", bodyFat: 20 });
t("LBM = 90×(1−20/100) = 72", km.leanMass, 72);
t("BMR Katch = 370+21.6×72 = 1925", km.bmr, 1925);
t("المعادلة = katch", km.equation, "katch");

console.log("\n■ Katch بدون نسبة دهون → تسقط إلى mifflin (محمي)");
const kmNone = assessCalories({ age: 30, gender: "male", weight: 90, height: 175, activityLevel: "moderate", goal: "maintain", equation: "katch", bodyFat: null });
t("لا تُستخدم Katch بدون bf", kmNone.equation, "mifflin");

console.log("\n■ أطفال: Schofield دائماً حتى مع اختيار katch");
const child = assessCalories({ age: 12, gender: "male", weight: 45, height: 150, activityLevel: "light", goal: "maintain", equation: "katch", bodyFat: 20 });
t("طفل → schofield", child.equation, "schofield");

console.log("\n■ خسارة الوزن: دلتا التوازن = −500");
const dl = assessCalories({ age: 25, gender: "male", weight: 85, height: 178, activityLevel: "moderate", goal: "lose" });
t("العجز = −500", dl.delta, -500);

console.log("\n■ الخيارات البديلة (بدائل متبادلة — لا تُجمع)");
const mealWithOptions: Meal = {
  id: "b", name: "الإفطار",
  items: [],
  options: [
    { id: "o1", name: "الخيار الأول", items: [{ foodId: null, name: "عيش بلدي", grams: 50, kcal: 250, protein: 8, carbs: 50, fats: 1.3 }] },
    { id: "o2", name: "الخيار الثاني", items: [{ foodId: null, name: "شوفان", grams: 60, kcal: 389, protein: 17, carbs: 66, fats: 7 }] },
    { id: "o3", name: "الخيار الثالث", items: [{ foodId: null, name: "جبنة قريش", grams: 100, kcal: 98, protein: 11, carbs: 3.4, fats: 4.3 }] },
  ],
};
const opts = mealOptions(mealWithOptions);
t("3 خيارات", opts.length, 3);
t("تسمية الخيار الثاني", optionLabel(1), "الخيار الثاني");
t("إجماليات الخيار الأول: 50جم عيش = 125 سعر/ب4/ك25", optionTotals(opts[0]), { calories: 125, protein: 4, carbs: 25, fats: 1 });
t("الإجمالي اليومي يستخدم الخيار الأول فقط (125 وليس جميعها)", computeTotals([mealWithOptions]).calories, 125);
const txt = dietPlanText({ clientName: "اختبار", targetCalories: 1800, meals: [mealWithOptions] });
t("نص الخطة يحمل التنبيه", txt.includes(OPTION_ALERT), true);
const single = dietPlanText({ clientName: "x", targetCalories: 2000, meals });
t("وجبة بلا بدائل لا تظهر التنبيه", single.includes(OPTION_ALERT), false);

console.log("\n■ تحذير عدم اتساق الماكروز");
const badMeals: Meal[] = [{ id: "x", name: "x", items: [{ foodId: null, name: "خلل", grams: 100, kcal: 900, protein: 100, carbs: 50, fats: 10 }] }];
t("يُظهر تحذيراً عند اختلاف كبير", macroConsistencyWarning(computeTotals(badMeals)) !== null, true);
t("لا تحذير عند التقارب", macroConsistencyWarning({ calories: 1251, protein: 108, carbs: 136, fats: 35 }) === null, true);

console.log(`\n════════ النتيجة: ${pass} ناجح / ${fail} فاشل ════════`);
process.exit(fail > 0 ? 1 : 0);
