import { useSyncExternalStore } from "react";
import { isSampleKey, SAMPLES, type SampleKey } from "./samples";

export interface SavedAssessment {
  sample: SampleKey;
  savedAt: string;
}

const STORAGE_KEY = "eloop.history";
const CHANGE_EVENT = "eloop:history";
const EMPTY: SavedAssessment[] = [];

let cachedRaw: string | null = null;
let cached = EMPTY;

function parse(raw: string | null): SavedAssessment[] {
  if (!raw) return EMPTY;
  try {
    const list: unknown = JSON.parse(raw);
    if (!Array.isArray(list)) return EMPTY;
    return list.filter((item) => isSampleKey(item?.sample) && typeof item?.savedAt === "string");
  } catch {
    return EMPTY;
  }
}

function read(): SavedAssessment[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cached = parse(raw);
    }
    return cached;
  } catch {
    return EMPTY;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function useHistory() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/* Returns false when this browser refuses storage. */
export function saveAssessment(sample: SampleKey): boolean {
  const saved = read();
  if (saved.some((item) => item.sample === sample)) return true;
  try {
    const next = [{ sample, savedAt: new Date().toISOString() }, ...saved];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
    return true;
  } catch {
    return false;
  }
}

function formatKg(kg: number) {
  return `${Number(kg.toFixed(2))} kg`;
}

export function historyTotals(saved: SavedAssessment[]) {
  const massKg = saved.reduce((sum, item) => sum + SAMPLES[item.sample].massKg, 0);
  const co2Kg = saved.reduce((sum, item) => sum + SAMPLES[item.sample].co2Kg, 0);
  return [
    { label: "Devices assessed", value: String(saved.length) },
    { label: "Kept out of landfill", value: formatKg(massKg) },
    { label: "CO2e avoided", value: formatKg(co2Kg) },
  ];
}
