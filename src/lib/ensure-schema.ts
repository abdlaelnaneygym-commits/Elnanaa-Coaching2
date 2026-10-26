import { db } from "@/db";
import { sql } from "drizzle-orm";

/**
 * ⚙️ مزامنة Schema ذاتية الشفاء — تُنفَّذ تلقائياً قبل أول قراءة للمكتبات.
 * كل التعليمات إضافية 100٪ (CREATE … IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
 * فلا تحذف أي جدول أو عمود أو سجل — ولا تتأثر بها نسخًا قديمة تحتوي أعمدة أقدم.
 * هذا يضمن أن أي نشر جديد على Vercel مع أي قاعدة Neon يمتلك كل الأعمدة فوراً.
 */

const DDL = `
-- الجداول الأساسية
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS calculations (
  id serial PRIMARY KEY,
  name text NOT NULL,
  age integer NOT NULL,
  gender text NOT NULL,
  weight double precision NOT NULL,
  height double precision NOT NULL,
  activity_level text NOT NULL,
  goal text NOT NULL,
  is_child boolean NOT NULL DEFAULT false,
  equation text NOT NULL,
  bmr double precision NOT NULL,
  tdee double precision NOT NULL,
  bmi double precision NOT NULL,
  target_calories double precision,
  needs_specialist boolean NOT NULL DEFAULT false,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS subscriptions (
  id serial PRIMARY KEY,
  name text NOT NULL,
  age integer NOT NULL,
  gender text NOT NULL,
  weight double precision NOT NULL,
  height double precision NOT NULL,
  phone text NOT NULL,
  goal text NOT NULL,
  package_id text NOT NULL,
  payment_method text NOT NULL,
  payment_reference text,
  inbody_file text,
  front_photo text,
  side_photo text,
  back_photo text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS foods (
  id serial PRIMARY KEY,
  name text NOT NULL,
  name_en text,
  category text NOT NULL,
  kcal double precision NOT NULL,
  protein double precision NOT NULL,
  carbs double precision NOT NULL,
  fats double precision NOT NULL,
  fiber double precision NOT NULL DEFAULT 0,
  state text,
  notes text,
  is_custom boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS exercises (
  id serial PRIMARY KEY,
  name text NOT NULL,
  muscle_group text NOT NULL,
  is_custom boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS transformations (
  id serial PRIMARY KEY,
  client_name text NOT NULL,
  duration text NOT NULL,
  before_image text NOT NULL,
  after_image text NOT NULL,
  weight_before text,
  weight_after text,
  body_fat_before text,
  body_fat_after text,
  muscle_before text,
  muscle_after text,
  story text,
  story_author text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS diet_plans (
  id serial PRIMARY KEY,
  client_name text NOT NULL,
  calculation_id integer,
  target_calories double precision NOT NULL,
  target_protein double precision NOT NULL,
  target_carbs double precision NOT NULL,
  target_fats double precision NOT NULL,
  meals jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS workout_plans (
  id serial PRIMARY KEY,
  diet_plan_id integer,
  client_name text NOT NULL,
  days jsonb NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS recipes (
  id serial PRIMARY KEY,
  name text NOT NULL,
  name_en text,
  category text NOT NULL,
  ingredients jsonb NOT NULL,
  steps text,
  calories double precision NOT NULL,
  protein double precision NOT NULL,
  carbs double precision NOT NULL,
  fats double precision NOT NULL,
  fiber double precision NOT NULL DEFAULT 0,
  image text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- أعمدة لاحقة قد تكون ناقصة في قواعد قديمة (إضافة فقط)
ALTER TABLE foods ADD COLUMN IF NOT EXISTS name_en text;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS fiber double precision NOT NULL DEFAULT 0;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS kcal double precision;
ALTER TABLE transformations ADD COLUMN IF NOT EXISTS weight_before text;
ALTER TABLE transformations ADD COLUMN IF NOT EXISTS weight_after text;
ALTER TABLE transformations ADD COLUMN IF NOT EXISTS body_fat_before text;
ALTER TABLE transformations ADD COLUMN IF NOT EXISTS body_fat_after text;
ALTER TABLE transformations ADD COLUMN IF NOT EXISTS muscle_before text;
ALTER TABLE transformations ADD COLUMN IF NOT EXISTS muscle_after text;
ALTER TABLE transformations ADD COLUMN IF NOT EXISTS story_author text;
ALTER TABLE transformations ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE transformations ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;
ALTER TABLE diet_plans ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';
ALTER TABLE diet_plans ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE diet_plans ADD COLUMN IF NOT EXISTS calculation_id integer;
ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS diet_plan_id integer;
ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS resolved boolean NOT NULL DEFAULT false;
`;

let promise: Promise<void> | null = null;

/** يشغّل المزامنة مرة واحدة في عمر العملية — idempotent وآمن تماماً */
export function ensureSchema(): Promise<void> {
  if (!promise) {
    promise = db
      .execute(sql.raw(DDL))
      .then(() => undefined)
      .catch((error) => {
        promise = null;
        throw error;
      });
  }
  return promise;
}
