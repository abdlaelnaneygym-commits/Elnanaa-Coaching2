"use client";

import type { FoodRow } from "@/db/schema";
import { FOOD_CATEGORIES } from "@/lib/plans";
import {
  Beef,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CoachBadge, EmptyState, LoadingGrid, Modal } from "./ui";

const EMPTY_FORM = {
  name: "",
  category: "بروتين" as string,
  kcal: "",
  protein: "",
  carbs: "",
  fats: "",
};

export default function FoodsLibrary({ headers }: { headers: Record<string, string> }) {
  const [foods, setFoods] = useState<FoodRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FoodRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/foods", { headers, cache: "no-store" });
      const json = await res.json();
      if (json.ok) setFoods(json.data ?? []);
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
    return foods.filter((f) => {
      if (category !== "الكل" && f.category !== category) return false;
      if (q && !f.name.includes(q)) return false;
      return true;
    });
  }, [foods, query, category]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  }

  function openEdit(food: FoodRow) {
    setEditing(food);
    setForm({
      name: food.name,
      category: food.category,
      kcal: String(food.kcal),
      protein: String(food.protein),
      carbs: String(food.carbs),
      fats: String(food.fats),
    });
    setError("");
    setModalOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const payload = {
      name: form.name,
      category: form.category,
      kcal: Number(form.kcal),
      protein: Number(form.protein || 0),
      carbs: Number(form.carbs || 0),
      fats: Number(form.fats || 0),
    };
    try {
      const res = await fetch(editing ? `/api/foods/${editing.id}` : "/api/foods", {
        method: editing ? "PATCH" : "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "تعذّر الحفظ");
        return;
      }
      setModalOpen(false);
      await load();
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  async function remove(food: FoodRow) {
    if (!confirm(`حذف "${food.name}" من المكتبة نهائياً؟`)) return;
    setFoods((prev) => prev.filter((f) => f.id !== food.id));
    await fetch(`/api/foods/${food.id}`, { method: "DELETE", headers });
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/10 bg-coal-900/70 p-4 sm:gap-4 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-500/15 text-gold-300">
            <Beef size={20} />
          </span>
          <div>
            <h2 className="text-sm font-black sm:text-base">مكتبة الأغذية</h2>
            <p className="mt-0.5 text-[11px] text-bone/45">
              {foods.length} طعام • القيم لكل 100 جرام • {foods.filter((f) => f.isCustom).length} مضاف
              بواسطتك
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="btn-shine inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-gold-300 to-gold-600 px-6 py-3 text-xs font-black text-coal-950 transition-transform duration-300 hover:scale-[1.03]"
        >
          <Plus size={15} />
          إضافة طعام
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
          {["الكل", ...FOOD_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3.5 py-2 text-[11px] font-black transition ${
                category === cat
                  ? "bg-gold-500 text-coal-950"
                  : "border border-white/10 text-bone/55 hover:border-gold-500/40 hover:text-gold-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingGrid count={6} height="h-28" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Beef} text="لا توجد أطعمة مطابقة للبحث — جرّب كلمة أخرى أو أضف طعاماً جديداً." />
      ) : (
        <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
          <div className="hidden grid-cols-[1fr_110px_90px_90px_90px_90px] gap-2 border-b border-white/10 bg-white/[0.04] px-5 py-3 text-[10px] font-black text-bone/45 lg:grid">
            <span>اسم الطعام</span>
            <span className="text-center">التصنيف</span>
            <span className="text-center">سعر/100جم</span>
            <span className="text-center">بروتين</span>
            <span className="text-center">كارب</span>
            <span className="text-center">دهون</span>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {filtered.map((food) => (
              <div
                key={food.id}
                className="grid grid-cols-2 items-center gap-x-2 gap-y-1.5 px-4 py-3 transition hover:bg-white/[0.02] sm:px-5 lg:grid-cols-[1fr_110px_90px_90px_90px_90px]"
              >
                <span className="col-span-2 flex flex-wrap items-center gap-2 text-sm font-extrabold sm:col-span-1">
                  {food.name}
                  {food.isCustom && <CoachBadge tone="green">مخصص</CoachBadge>}
                </span>
                <span className="order-first text-center text-[10px] font-bold text-bone/45 sm:order-none sm:text-[11px]">
                  {food.category}
                </span>
                <span className="text-center text-sm font-black text-gold-300">{food.kcal}</span>
                <span className="text-center text-xs font-bold text-bone/60">{food.protein}</span>
                <span className="text-center text-xs font-bold text-bone/60">{food.carbs}</span>
                <span className="flex items-center justify-center gap-1.5">
                  <span className="text-xs font-bold text-bone/60">{food.fats}</span>
                  <button
                    onClick={() => openEdit(food)}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-bone/40 transition hover:border-gold-500/50 hover:text-gold-300"
                    aria-label="تعديل"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => remove(food)}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-bone/40 transition hover:border-red-400/50 hover:text-red-300"
                    aria-label="حذف"
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "تعديل طعام" : "إضافة طعام جديد"}
        subtitle="أدخل القيم الغذائية لكل 100 جرام"
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-bone/60">اسم الطعام *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="field"
              placeholder="مثال: صدر دجاج مشوي"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-bone/60">التصنيف *</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="field"
            >
              {FOOD_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["kcal", "السعرات / 100جم *"],
                ["protein", "بروتين (جم)"],
                ["carbs", "كربوهيدرات (جم)"],
                ["fats", "دهون (جم)"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1.5 block text-[11px] font-bold text-bone/60">{label}</label>
                <input
                  required={key === "kcal"}
                  type="number"
                  step="0.1"
                  min={0}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="field"
                  placeholder="0"
                />
              </div>
            ))}
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
              {editing ? "حفظ التعديلات" : "إضافة للمكتبة"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
