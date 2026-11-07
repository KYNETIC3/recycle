import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isSampleKey, SAMPLE_KEYS } from "@/lib/samples";
import { ResultView } from "./ResultView";

export const metadata: Metadata = { title: "Assessment result | eLoop" };

export function generateStaticParams() {
  return SAMPLE_KEYS.map((id) => ({ id }));
}

async function Result({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Accept both sample keys (iphone, motherboard, battery) and API keys (api-iphone, etc.)
  const isApiKey = id.startsWith("api-");
  const sampleKey = isApiKey ? id.slice(4) : id;

  if (!isSampleKey(sampleKey) && !isApiKey) notFound();
  return <ResultView sampleKey={id} />;
}

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense>
      <Result params={params} />
    </Suspense>
  );
}