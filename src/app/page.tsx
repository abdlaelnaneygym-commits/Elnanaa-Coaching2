import About from "@/components/About";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Packages from "@/components/Packages";
import Registration from "@/components/Registration";
import Transformations from "@/components/Transformations";
import { db } from "@/db";
import type { TransformationRow } from "@/db/schema";
import { transformations } from "@/db/schema";
import { getSetting } from "@/lib/settings";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getTransformations(): Promise<TransformationRow[]> {
  try {
    return await db
      .select()
      .from(transformations)
      .where(eq(transformations.isPublished, true))
      .orderBy(desc(transformations.createdAt))
      .limit(12);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  // صورة الواجهة تُقرأ مباشرة من جدول settings في قاعدة البيانات في كل زيارة —
  // أي تعديل من لوحة المدرب ينعكس فوراً لجميع الزوار (الصفحة force-dynamic).
  const heroImage = await getSetting("hero_image");
  const transformationRows = await getTransformations();

  return (
    <>
      <Header />
      <main>
        <Hero heroImage={heroImage ?? undefined} />
        <Marquee />
        <About />
        <Transformations initial={transformationRows} />
        <Packages />
        <Registration />
      </main>
      <Footer />
    </>
  );
}
