import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Elnanaa Coaching — كابتن عبد الله النعناع",
    template: "%s | Elnanaa Coaching",
  },
  description:
    "منصة التدريب الشخصي الرسمية للكابتن عبد الله النعناع — باقات متابعة شهرية، أنظمة تدريب وتغذية مخصصة، ومتابعة يومية أونلاين.",
  keywords: [
    "Elnanaa Coaching",
    "عبد الله النعناع",
    "تدريب شخصي",
    "كابتن",
    "أونلاين كوتشنج",
    "باقات متابعة",
  ],
};

export const viewport: Viewport = {
  themeColor: "#070708",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="bg-coal-950 text-bone antialiased">
        <div className="noise-layer" aria-hidden />
        {children}
      </body>
    </html>
  );
}
