import CoachDashboard from "@/components/coach/CoachDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "لوحة تحكم المدرب",
  robots: { index: false },
};

export default function CoachPage() {
  return <CoachDashboard />;
}
