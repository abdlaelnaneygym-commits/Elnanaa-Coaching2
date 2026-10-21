# 🥇 Elnanaa Coaching — منصة الكابتن عبد الله النعناع

منصة تدريب شخصي أونلاين كاملة ومتكاملة: موقع تسويقي فاخر + لوحة تحكم للمدرب بها حاسبة سعرات، مكتبة أغذية وتمارين، وبناء أنظمة غذائية وبرامج تدريبية.

---

## ✨ المميزات

### الموقع العام (الزوار والعملاء)
- **هيرو سينمائي** بطول الشاشة بصورة الكابتن مع تدرّج تعتيم ذكي (يمكن للمدرب تغيير الصورة من اللوحة)
- **قسم التحوّلات** بمقارنة قبل/بعد تفاعلية بالسحب + **نافذة منبثقة** بالتفاصيل (وزن، دهون، عضلات، قصة النجاح) وتكبير الصور
- **باقات المتابعة**: شهرية 499 ج.م / 3 شهور 1,350 ج.م / 6 شهور 2,600 ج.م
- **نموذج تسجيل كامل**: بيانات + تقرير InBody + 3 صور للجسم + دفع InstaPay / Fawry
- حاسبة السعرات **مخفية تماماً عن العملاء** — للمدرب فقط

### لوحة تحكم المدرب (`/coach`)
- **حاسبة السعرات** بمعادلة Mifflin-St Jeor للبالغين و Schofield للأطفال (< 18)
- حماية الأطفال: أي طفل يحتاج تخسيس → **منع الخطة التلقائية** وإحالة لأخصائي تغذية أطفال
- **مكتبة 113 طعام** بسعرات وماكروز لكل 100جم (قابلة للإضافة والتعديل)
- **مكتبة 77 تمرين** مصنّفة حسب العضلات (صدر، ظهر، أرجل، كتف، باي، تراي، بطن، كارديو)
- **بنّاء النظام الغذائي**: اختيار أطعمة + كميات بالجرام + **شريط تقدم حي** للسعرات والماكروز
- **بنّاء البرنامج التدريبي**: أيام + تمارين + مجموعات وتكرارات
- **إدارة التحوّلات** و**إدارة صورة الواجهة** (LocalStorage)

---

## 🛠 التقنيات

| الطبقة | التقنية |
|---|---|
| الإطار | Next.js 16 (App Router) + React 19 + TypeScript |
| التنسيق | Tailwind CSS v4 + Framer Motion + Lucide Icons |
| قاعدة البيانات | PostgreSQL + Drizzle ORM |
| الخط | Cairo (عربي RTL) |

---

## 📁 هيكل المشروع

```
├── public/images/          صور الكابتن والتحوّلات
├── src/
│   ├── app/
│   │   ├── page.tsx        الصفحة الرئيسية
│   │   ├── coach/page.tsx  لوحة تحكم المدرب
│   │   ├── layout.tsx      RTL + الخط + الميتاداتا
│   │   └── api/            كل مسارات الـ API
│   ├── components/         مكوّنات الموقع العامة
│   │   └── coach/          مكوّنات لوحة المدرب
│   ├── db/                 اتصال قاعدة البيانات + المخطط
│   └── lib/                منطق السعرات، الخطط، المكتبات، الرفع
├── .env.example            مثال لمتغيرات البيئة
├── drizzle.config.json     إعدادات Drizzle
└── package.json
```

---

## 🚀 التشغيل محلياً

```bash
# 1) تنزيل الاعتماديات
npm install

# 2) إنشاء ملف البيئة
cp .env.example .env
# ثم عدّل DATABASE_URL ورمز المدرب COACH_PIN

# 3) إنشاء جداول قاعدة البيانات
npx drizzle-kit push

# 4) التشغيل
npm run dev
# افتح http://localhost:3000
```

> مكتبات الأغذية والتمارين والتحوّلات التجريبية **تُزرع تلقائياً** عند أول طلب — لا تحتاج أي خطوة إضافية.

---

## 🔑 متغيرات البيئة

| المتغير | الوصف | إلزامي؟ |
|---|---|---|
| `DATABASE_URL` | رابط اتصال PostgreSQL | ✅ نعم |
| `COACH_PIN` | رمز دخول لوحة المدرب (الافتراضي: `2025`) | ⚠️ يُنصح بتغييره |

مثال `.env`:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
COACH_PIN=رقم-سري-قوي
```

---

## ☁️ التدشين على Vercel (خطوات سريعة)

### 1️⃣ أنشئ قاعدة بيانات PostgreSQL مجانية
اختر واحدة من:
- **Neon** (neon.tech) — الأسهل
- **Supabase** (supabase.com)
- **Vercel Postgres** من داخل لوحة Vercel

انسخ **Connection String** (يبدأ بـ `postgresql://` أو `postgres://`).

### 2️⃣ ارفع الكود إلى GitHub
```bash
git init
git add .
git commit -m "Elnanaa Coaching - initial release"
git branch -M main
git remote add origin https://github.com/USERNAME/elnanaa-coaching.git
git push -u origin main
```

### 3️⃣ اربط المشروع بـ Vercel
1. ادخل [vercel.com](https://vercel.com) وسجّل بحساب GitHub
2. اضغط **Add New → Project**
3. اختر مستودع `elnanaa-coaching`
4. Vercel سيكتشف Next.js تلقائياً — **لا تغيّر أي إعداد Build**
5. في قسم **Environment Variables** أضف:
   - `DATABASE_URL` = رابط قاعدة البيانات
   - `COACH_PIN` = الرمز السري الجديد
6. اضغط **Deploy** ✅

### 4️⃣ أنشئ الجداول في قاعدة بيانات الإنتاج (Neon)
المشروع يستخدم **Drizzle ORM** (وليس Prisma) — طبّق الجداول بأمر واحد
يقرأ الرابط من متغير البيئة `DATABASE_URL`:

من جهازك، نفّذ هذا الأمر مع رابط Neon الخاص بك:

```bash
DATABASE_URL="postgresql://USER:PASS@HOST/neondb?sslmode=require" npx drizzle-kit push
```

أو ضع نفس الرابط في ملف `.env` ثم نفّذ:

```bash
npx drizzle-kit push
```

حيث يقرأ `drizzle.config.ts` قيمته من `process.env.DATABASE_URL` تلقائياً.

> 📍 **أين أجد الرابط؟** لوحة Neon ← مشروعك ← Connection Details ← انسخ
> الـ Connection String. (أو من Vercel ← مشروعك ← Settings ← Environment
> Variables ← قيمة `DATABASE_URL`).

سيُنشئ هذا الأمر جداول: `settings`، `calculations`، `subscriptions`،
`foods`، `exercises`، `transformations`، `diet_plans`، `workout_plans`.

### 5️⃣ افتح موقعك لايف 🎉
```
https://elnanaa-coaching.vercel.app        ← الموقع
https://elnanaa-coaching.vercel.app/coach  ← لوحة المدرب
```

---

## 💾 ملاحظة مهمة عن الملفات المرفوعة

الصور (تقارير InBody، صور الجسم، صور التحوّلات) **تُضغط في المتصفح وتُحفظ كـ Data URL داخل قاعدة البيانات**. هذا يعني:

- ✅ تعمل على **أي استضافة** بما فيها Vercel (serverless) بدون تخزين ملفات
- ✅ لا تحتاج خدمات خارجية (S3 / Cloudinary) ولا اعتماديات إضافية
- ✅ تنتقل مع قاعدة البيانات عند النسخ الاحتياطي

عند كبر حجم العملاء (آلاف الصور) يُنصح بالترقية لتخزين خارجي مثل Vercel Blob أو Cloudinary.

---

## 🔒 الأمان

- كل مسارات `/api/coach/*` و `/api/foods*` و `/api/exercises*` و `/api/diet-plans*` و `/api/workout-plans*` محمية برمز المدرب عبر ترويسة `x-coach-pin`
- النتائج الرقمية للحاسبة **لا تُرجع للعملاء** إطلاقاً
- صور العملاء خاصة ولا تُعرض إلا داخل لوحة المدرب

---

## 🧪 أوامر مفيدة

```bash
npm run dev          # التطوير
npm run build        # بناء الإنتاج
npm run start        # تشغيل نسخة الإنتاج
npm run typecheck    # فحص TypeScript
npm run lint         # فحص ESLint
npx drizzle-kit push # تحديث جداول قاعدة البيانات
```
