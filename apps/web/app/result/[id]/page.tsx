import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isSampleKey, SAMPLE_KEYS } from "@/lib/samples";
import { ResultView } from "./ResultView";

export const metadata: Metadata = { title: "Assessment result | eLoop" };

export function generateStaticParams() {
  return SAMPLE_KEYS.map((id) => ({ id }));
}

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSampleKey(id)) notFound();
  return <ResultView sampleKey={id} />;
}
