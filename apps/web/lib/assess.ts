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

/* Simulated until the diagnosis API exists: this is the one call to replace. */
export async function assessDevice(
  input: AssessmentInput,
  onStep: (step: number) => void,
  signal: AbortSignal,
): Promise<SampleKey> {
  for (let step = 0; step < ASSESSMENT_STEPS.length; step++) {
    onStep(step);
    await new Promise((resolve) => setTimeout(resolve, STEP_MS));
    signal.throwIfAborted();
  }
  return "sample" in input ? input.sample : SAMPLE_KEYS[input.photo.size % SAMPLE_KEYS.length];
}
