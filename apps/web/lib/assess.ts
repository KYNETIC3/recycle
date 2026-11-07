import { SAMPLE_KEYS, type SampleKey } from "./samples";

export type Route = "Repair" | "Reuse" | "Recycle";

export const ASSESSMENT_STEPS = ["Identify device", "Inspect damage", "Test repair route", "Estimate materials"];

const STEP_MS = 900;

/* Placeholder cut-offs until the real model sets them. */
export function routeForScore(score: number): Route {
  if (score >= 60) return "Repair";
  if (score >= 45) return "Reuse";
  return "Recycle";
}

type AssessmentInput = { sample: SampleKey } | { photo: File };

/* API response shape matching backend DiagnoseResponse */
export interface DiagnoseResponse {
  key: SampleKey;
  name: string;
  device: string;
  condition: string;
  score: number;
  reason: string;
  findings: { name: string; value: string }[];
  parts: string[];
  mass: string;
  massKg: number;
  co2Kg: number;
  materials: { name: string; share: number; fate: "Recover" | "Treat" }[];
  impact: { label: string; value: string }[];
  route: Route;
  sample_data: boolean;
}

/* Get API base URL from environment, default to local development */
function getApiBase(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  }
  return "http://localhost:8000";
}

/* Call the real diagnosis API */
async function callDiagnoseApi(input: AssessmentInput, signal: AbortSignal): Promise<DiagnoseResponse> {
  const formData = new FormData();
  const baseUrl = getApiBase();

  if ("sample" in input) {
    formData.append("sample_key", input.sample);
  } else {
    formData.append("photo", input.photo);
  }

  const response = await fetch(`${baseUrl}/api/diagnose`, {
    method: "POST",
    body: formData,
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Diagnosis failed" }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

/* Simulated until the diagnosis API exists: this is the one call to replace. */
export async function assessDevice(
  input: AssessmentInput,
  onStep: (step: number) => void,
  signal: AbortSignal,
): Promise<SampleKey> {
  // Show progress steps
  for (let step = 0; step < ASSESSMENT_STEPS.length; step++) {
    onStep(step);
    await new Promise((resolve) => setTimeout(resolve, STEP_MS));
    signal.throwIfAborted();
  }

  // Call real API
  const result = await callDiagnoseApi(input, signal);

  // For sample inputs, return the sample key directly
  if ("sample" in input) {
    return input.sample;
  }

  // For photo inputs, we need to map the API response to a sample key
  // Since the API returns full data, we'll store it in sessionStorage for the result page
  if (typeof window !== "undefined") {
    sessionStorage.setItem("eloop.lastDiagnosis", JSON.stringify(result));
  }

  // Return a synthetic key that the result page can recognize
  return `api-${result.key}` as SampleKey;
}

/* Fetch full diagnosis result by key (for result page) */
export async function getDiagnosis(key: string): Promise<DiagnoseResponse | null> {
  try {
    // First check sessionStorage for photo-based results
    if (typeof window !== "undefined" && key.startsWith("api-")) {
      const stored = sessionStorage.getItem("eloop.lastDiagnosis");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.key === key.replace("api-", "")) {
          return parsed;
        }
      }
    }

    // Otherwise fetch from API (for sample keys)
    const baseUrl = getApiBase();
    const response = await fetch(`${baseUrl}/api/samples/${key}`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}