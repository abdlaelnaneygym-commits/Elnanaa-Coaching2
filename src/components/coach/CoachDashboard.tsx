"use client";

import { COACH_PIN_KEY } from "@/lib/image";
import {
  ArrowRight,
  BarChart3,
  Calculator,
  Dumbbell,
  ImagePlus,
  BookOpen,
  ImageIcon,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { LogoMark } from "../Header";
import ClientRequests from "./ClientRequests";
import CoachCalculator, { type CalcPrefill, type DietContext } from "./CoachCalculator";
import DietBuilder from "./DietBuilder";
import ExercisesLibrary from "./ExercisesLibrary";
import SettingsPanel from "./SettingsPanel";
import FoodsLibrary from "./FoodsLibrary";
import HeroManager from "./HeroManager";
import PlansView from "./PlansView";
import RecipesManager from "./RecipesManager";
import TransformationsManager from "./TransformationsManager";
import WorkoutBuilder from "./WorkoutBuilder";

type Section =
  | "calculator"
  | "requests"
  | "plans"
  | "foods"
  | "exercises"
  | "transformations"
  | "recipes"
  | "settings"
  | "hero";

interface WorkoutContext {
  clientName: string;
  dietPlanId: number | null;
}

const NAV: { id: Section; label: string; icon: typeof BarChart3 }[] = [
  { id: "calculator", label: "حاسبة السعرات", icon: Calculator },
  { id: "plans", label: "الخطط المحفوظة", icon: LayoutDashboard },
  { id: "requests", label: "طلبات العملاء", icon: Users },
  { id: "foods", label: "مكتبة الأغذية", icon: UtensilsCrossed },
  { id: "exercises", label: "مكتبة التمارين", icon: Dumbbell },
  { id: "transformations", label: "التحوّلات", icon: ImagePlus },
  { id: "recipes", label: "كتاب الوصفات", icon: BookOpen },
  { id: "settings", label: "كلمة السر", icon: KeyRound },
  { id: "hero", label: "صورة الواجهة", icon: ImageIcon },
];

/** اشتراك فارغ — sessionStorage مصدر خارجي ثابت نقرأه بدون تكرار */
const subscribeToNothing = () => () => {};

function readStoredPin(): string | null {
  try {
    return sessionStorage.getItem(COACH_PIN_KEY);
  } catch {
    return null;
  }
}

export default function CoachDashboard() {
  // قراءة الرمز من sessionStorage بدون setState داخل effect
  const pin = useSyncExternalStore(subscribeToNothing, readStoredPin, () => null);
  const [, refresh] = useState(0);
  const [activePin, setActivePin] = useState<string | null>(null);

  function writePin(value: string | null) {
    try {
      if (value) sessionStorage.setItem(COACH_PIN_KEY, value);
      else sessionStorage.removeItem(COACH_PIN_KEY);
    } catch {
      /* تجاهل */
    }
    refresh((v) => v + 1);
  }

  if (!pin) {
    return <PinGate onSuccess={(p) => { writePin(p); setActivePin(p); }} />;
  }
  return (
    <DashboardShell
      pin={activePin ?? pin}
      onPinChanged={(newPin) => { writePin(newPin); setActivePin(newPin); }}
      onLogout={() => { writePin(null); setActivePin(null); }}
    />
  );
}

/* ======================== شاشة الدخول ======================== */
function PinGate({ onSuccess }: { onSuccess: (pin: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/coach/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: value }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "رمز الدخول غير صحيح");
        return;
      }
      onSuccess(value);
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-svh place-items-center bg-coal-950 px-5">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-gold-500/10 blur-[110px]" />
      <form
        onSubmit={submit}
        className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-coal-900/80 p-9 text-center backdrop-blur-xl"
      >
        <div className="mx-auto w-fit">
          <LogoMark size={56} />
        </div>
        <h1 className="mt-6 text-2xl font-black">لوحة تحكم المدرب</h1>
        <p className="mt-2 text-xs leading-6 text-bone/50">
          منطقة خاصة بالكابتن عبد الله النعناع — الحاسبة والمكتبات وبناء الخطط
        </p>
        <input
          type="password"
          inputMode="numeric"
          dir="ltr"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="field mt-7 text-center text-lg tracking-[0.5em]"
          placeholder="••••"
          autoFocus
        />
        {error && (
          <div className="mt-3 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading || value.length === 0}
          className="btn-shine mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold-300 to-gold-600 py-3.5 text-sm font-black text-coal-950 transition-transform duration-300 hover:scale-[1.02] disabled:opacity-50"
        >
          {loading ? <Loader2 size={17} className="animate-spin" /> : <ShieldCheck size={17} />}
          دخول اللوحة
        </button>
        <p className="mt-5 text-[10px] leading-5 text-bone/35">
          يمكنك تغيير كلمة السر في أي وقت من قسم «كلمة السر» داخل اللوحة
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-bone/50 transition hover:text-gold-300"
        >
          <ArrowRight size={14} />
          العودة للموقع
        </Link>
      </form>
    </div>
  );
}

/* ======================== هيكل اللوحة ======================== */
function DashboardShell({
  pin,
  onLogout,
  onPinChanged,
}: {
  pin: string;
  onLogout: () => void;
  onPinChanged: (newPin: string) => void;
}) {
  const [section, setSection] = useState<Section>("calculator");
  const [dietCtx, setDietCtx] = useState<DietContext | null>(null);
  const [workoutCtx, setWorkoutCtx] = useState<WorkoutContext | null>(null);
  const [prefill, setPrefill] = useState<CalcPrefill | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const headers = useMemo(() => ({ "x-coach-pin": pin }), [pin]);

  function goCalculatorWith(prefillData: CalcPrefill) {
    setPrefill(prefillData);
    setDietCtx(null);
    setWorkoutCtx(null);
    setSection("calculator");
  }

  function startDiet(ctx: DietContext) {
    setDietCtx(ctx);
    setWorkoutCtx(null);
  }

  function startWorkout(dietPlanId: number, clientName: string) {
    setWorkoutCtx({ clientName, dietPlanId });
    setDietCtx(null);
  }

  // شاشات البناء تملأ المحتوى بالكامل
  if (dietCtx) {
    return (
      <DashboardFrame
        headers={headers}
        onLogout={onLogout}
        onNavigate={(s) => {
          setDietCtx(null);
          setWorkoutCtx(null);
          setSection(s);
        }}
        activeLabel="بناء النظام الغذائي"
        refreshKey={refreshKey}
        onRefresh={() => setRefreshKey((k) => k + 1)}
        hideNav
      >
        <DietBuilder
          key={`diet-${refreshKey}`}
          headers={headers}
          context={dietCtx}
          onExit={() => setDietCtx(null)}
          onPlanSaved={(id, name) => startWorkout(id, name)}
        />
      </DashboardFrame>
    );
  }

  if (workoutCtx) {
    return (
      <DashboardFrame
        headers={headers}
        onLogout={onLogout}
        onNavigate={(s) => {
          setDietCtx(null);
          setWorkoutCtx(null);
          setSection(s);
        }}
        activeLabel="بناء البرنامج التدريبي"
        refreshKey={refreshKey}
        onRefresh={() => setRefreshKey((k) => k + 1)}
        hideNav
      >
        <WorkoutBuilder
          key={`workout-${refreshKey}`}
          headers={headers}
          clientName={workoutCtx.clientName}
          dietPlanId={workoutCtx.dietPlanId}
          onExit={() => setWorkoutCtx(null)}
        />
      </DashboardFrame>
    );
  }

  return (
    <DashboardFrame
      headers={headers}
      onLogout={onLogout}
      onNavigate={setSection}
      activeLabel={NAV.find((n) => n.id === section)?.label ?? ""}
      refreshKey={refreshKey}
      onRefresh={() => setRefreshKey((k) => k + 1)}
    >
      {section === "calculator" && (
        <CoachCalculator headers={headers} prefill={prefill} onBuildDiet={startDiet} />
      )}
      {section === "requests" && (
        <ClientRequests headers={headers} onPrefill={goCalculatorWith} />
      )}
      {section === "plans" && (
        <PlansView headers={headers} onCreateWorkout={startWorkout} />
      )}
      {section === "foods" && <FoodsLibrary headers={headers} />}
      {section === "exercises" && <ExercisesLibrary headers={headers} />}
      {section === "transformations" && <TransformationsManager headers={headers} />}
      {section === "recipes" && <RecipesManager headers={headers} />}
      {section === "settings" && (
        <SettingsPanel
          headers={headers}
          onPinChanged={onPinChanged}
        />
      )}
      {section === "hero" && <HeroManager headers={headers} />}
    </DashboardFrame>
  );
}

/* ======================== الإطار العام ======================== */
function DashboardFrame({
  headers,
  onLogout,
  onNavigate,
  activeLabel,
  children,
  refreshKey,
  onRefresh,
  hideNav,
}: {
  headers: Record<string, string>;
  onLogout: () => void;
  onNavigate: (s: Section) => void;
  activeLabel: string;
  children: React.ReactNode;
  refreshKey: number;
  onRefresh: () => void;
  hideNav?: boolean;
}) {
  return (
    <div className="min-h-svh bg-coal-950 lg:flex lg:flex-row-reverse">
      {/* الشريط الجانبي */}
      <aside className="sticky top-0 z-40 border-b border-white/10 bg-coal-950/90 backdrop-blur-xl lg:h-svh lg:w-72 lg:shrink-0 lg:border-b-0 lg:border-l">
        <div className="flex items-center gap-2.5 px-4 py-3.5 sm:px-5 lg:gap-3 lg:py-6">
          <LogoMark size={40} />
          <div className="leading-tight">
            <div className="text-[11px] font-black leading-5 sm:text-[13px]">لوحة الكابتن عبد الله</div>
            <div className="mt-1 text-[9px] font-bold tracking-[0.3em] text-gold-400">
              ELNANAA COACHING
            </div>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto overscroll-x-contain px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-3 lg:pb-4">
          {NAV.map((item) => {
            const active = !hideNav && activeLabel === item.label;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex shrink-0 items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-[11px] font-black whitespace-nowrap transition-all duration-300 sm:gap-3 sm:px-4 sm:py-3 sm:text-xs lg:w-full ${
                  active
                    ? "bg-gold-500 text-coal-950 shadow-[0_10px_25px_-10px_rgba(217,164,65,0.8)]"
                    : "text-bone/55 hover:bg-white/5 hover:text-gold-300"
                }`}
              >
                <item.icon size={16} className="shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="hidden gap-2 px-3 lg:mt-auto lg:flex lg:flex-col lg:pb-5">
          <button
            onClick={onRefresh}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-black text-bone/55 transition hover:bg-white/5 hover:text-gold-300"
          >
            <RefreshCw size={15} />
            تحديث البيانات
          </button>
          <Link
            href="/"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-black text-bone/55 transition hover:bg-white/5 hover:text-gold-300"
          >
            <ArrowRight size={15} />
            الموقع الرئيسي
          </Link>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-black text-bone/55 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={15} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* المحتوى */}
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
            <h1 className="text-lg font-black">{activeLabel}</h1>
            <div className="flex gap-2">
              <button
                onClick={onRefresh}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-bone/60"
                aria-label="تحديث"
              >
                <RefreshCw size={15} />
              </button>
              <button
                onClick={onLogout}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-bone/60"
                aria-label="خروج"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
          <div key={refreshKey}>{children}</div>
        </div>
      </main>
    </div>
  );
}
