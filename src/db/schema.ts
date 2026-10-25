import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { Meal, WorkoutDay } from "@/lib/plans";

/** إعدادات عامة (مثل كلمة سر لوحة المدرب) — قابلة للتغيير من اللوحة */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** طلبات حساب السعرات — تُسجّل من حاسبة المدرب */
export const calculations = pgTable("calculations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  weight: real("weight").notNull(),
  height: real("height").notNull(),
  activityLevel: text("activity_level").notNull(),
  goal: text("goal").notNull(),
  isChild: boolean("is_child").notNull().default(false),
  equation: text("equation").notNull(),
  bmr: real("bmr").notNull(),
  tdee: real("tdee").notNull(),
  bmi: real("bmi").notNull(),
  targetCalories: real("target_calories"),
  needsSpecialist: boolean("needs_specialist").notNull().default(false),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** طلبات الاشتراك + الملفات المرفوعة */
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  weight: real("weight").notNull(),
  height: real("height").notNull(),
  phone: text("phone").notNull(),
  goal: text("goal").notNull(),
  packageId: text("package_id").notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentReference: text("payment_reference"),
  inbodyFile: text("inbody_file"),
  frontPhoto: text("front_photo"),
  sidePhoto: text("side_photo"),
  backPhoto: text("back_photo"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** مكتبة الأغذية — سعرات وماكروز لكل 100 جرام */
export const foods = pgTable("foods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  category: text("category").notNull(),
  kcal: real("kcal").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fats: real("fats").notNull(),
  fiber: real("fiber").notNull().default(0),
  state: text("state"), // raw | cooked | drained |
  notes: text("notes"),
  isCustom: boolean("is_custom").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** كتاب الوصفات الدايت — وجبات كاملة بمكوناتها وقيمها الغذائية */
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  category: text("category").notNull(), // إفطار | غداء | عشاء | سناك | حلويات دايت
  ingredients: jsonb("ingredients")
    .$type<Array<{ name: string; grams: number; note?: string }>>()
    .notNull(),
  steps: text("steps"),
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fats: real("fats").notNull(),
  fiber: real("fiber").notNull().default(0),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** مكتبة التمارين — مصنّفة حسب مجموعات العضلات */
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  isCustom: boolean("is_custom").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** تحوّلات العملاء (قبل/بعد) — تُعرض في الصفحة الرئيسية */
export const transformations = pgTable("transformations", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  duration: text("duration").notNull(),
  beforeImage: text("before_image").notNull(),
  afterImage: text("after_image").notNull(),
  weightBefore: text("weight_before"),
  weightAfter: text("weight_after"),
  bodyFatBefore: text("body_fat_before"),
  bodyFatAfter: text("body_fat_after"),
  muscleBefore: text("muscle_before"),
  muscleAfter: text("muscle_after"),
  story: text("story"),
  storyAuthor: text("story_author"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** أنظمة غذائية مبنية من مكتبة الأغذية */
export const dietPlans = pgTable("diet_plans", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  calculationId: integer("calculation_id"),
  targetCalories: real("target_calories").notNull(),
  targetProtein: real("target_protein").notNull(),
  targetCarbs: real("target_carbs").notNull(),
  targetFats: real("target_fats").notNull(),
  meals: jsonb("meals").$type<Meal[]>().notNull(),
  status: text("status").notNull().default("draft"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** برامج تدريبية مبنية من مكتبة التمارين */
export const workoutPlans = pgTable("workout_plans", {
  id: serial("id").primaryKey(),
  dietPlanId: integer("diet_plan_id"),
  clientName: text("client_name").notNull(),
  days: jsonb("days").$type<WorkoutDay[]>().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type SettingRow = typeof settings.$inferSelect;
export type RecipeRow = typeof recipes.$inferSelect;
export type CalculationRow = typeof calculations.$inferSelect;
export type SubscriptionRow = typeof subscriptions.$inferSelect;
export type FoodRow = typeof foods.$inferSelect;
export type ExerciseRow = typeof exercises.$inferSelect;
export type TransformationRow = typeof transformations.$inferSelect;
export type DietPlanRow = typeof dietPlans.$inferSelect;
export type WorkoutPlanRow = typeof workoutPlans.$inferSelect;
