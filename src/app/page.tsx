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
  const transformationRows = await getTransformations();

  return (
    <>
      <Header />
      <main>
        <Hero />
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
