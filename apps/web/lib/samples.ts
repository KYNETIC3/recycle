export type SampleKey = "iphone" | "motherboard" | "battery";

export interface Sample {
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
}

/* Material, mass and impact figures are placeholders until real data exists. */
export const SAMPLES: Record<SampleKey, Sample> = {
  iphone: {
    key: "iphone",
    name: "iPhone 13 Pro",
    device: "iPhone 13 Pro (A2636)",
    condition: "Display shattered",
    score: 68,
    reason: "The display is broken, but the logic board still works.",
    findings: [
      { name: "Display", value: "Shattered" },
      { name: "Logic board", value: "Functional" },
      { name: "Battery health", value: "82%" },
    ],
    parts: ["A15 Bionic Logic Board", "12MP Camera System", "MagSafe Coil", "Taptic Engine", "Speakers"],
    mass: "204 g",
    massKg: 0.204,
    co2Kg: 55,
    materials: [
      { name: "Steel and aluminium", share: 38, fate: "Recover" },
      { name: "Glass", share: 24, fate: "Recover" },
      { name: "Battery cells", share: 20, fate: "Treat" },
      { name: "Circuit board", share: 11, fate: "Recover" },
      { name: "Copper", share: 5, fate: "Recover" },
      { name: "Rare and precious metals", share: 2, fate: "Recover" },
    ],
    impact: [
      { label: "Kept out of landfill", value: "204 g" },
      { label: "CO2e avoided", value: "55 kg" },
      { label: "Device life added", value: "2 yrs" },
    ],
  },
  motherboard: {
    key: "motherboard",
    name: "ASUS PRIME Z370-A",
    device: "ASUS PRIME Z370-A (LGA1151)",
    condition: "2 bad DDR4 slots",
    score: 55,
    reason: "It still boots, and many of its parts have life left.",
    findings: [
      { name: "POST", value: "Successful" },
      { name: "DDR4 slots", value: "2 bad" },
      { name: "PCIe x16", value: "Functional" },
    ],
    parts: ["Intel Z370 Chipset", "PCIe 3.0 x16 Slot", "M.2 NVMe Slot", "Audio CODEC", "LAN Controller", "USB 3.1 Controller"],
    mass: "1.1 kg",
    massKg: 1.1,
    co2Kg: 28,
    materials: [
      { name: "Board laminate", share: 46, fate: "Treat" },
      { name: "Steel", share: 22, fate: "Recover" },
      { name: "Copper", share: 16, fate: "Recover" },
      { name: "Aluminium", share: 10, fate: "Recover" },
      { name: "Plastics", share: 5, fate: "Treat" },
      { name: "Precious metals", share: 1, fate: "Recover" },
    ],
    impact: [
      { label: "Kept out of landfill", value: "1.1 kg" },
      { label: "CO2e avoided", value: "28 kg" },
      { label: "Parts back in use", value: "6" },
    ],
  },
  battery: {
    key: "battery",
    name: 'MacBook Pro 16" Battery',
    device: 'MacBook Pro 16" (2021) Battery',
    condition: "68% capacity",
    score: 42,
    reason: "This battery is worn, so its materials are best recovered safely.",
    findings: [
      { name: "Max capacity", value: "68%" },
      { name: "Charge cycles", value: "847" },
      { name: "Status", value: "Service recommended" },
    ],
    parts: ["Battery Cells (recyclable)", "BMS Board", "Temperature Sensors", "Connector Flex"],
    mass: "420 g",
    massKg: 0.42,
    co2Kg: 6,
    materials: [
      { name: "Lithium, cobalt and nickel", share: 34, fate: "Recover" },
      { name: "Graphite", share: 20, fate: "Recover" },
      { name: "Aluminium", share: 14, fate: "Recover" },
      { name: "Copper", share: 12, fate: "Recover" },
      { name: "Electrolyte", share: 12, fate: "Treat" },
      { name: "Casing", share: 8, fate: "Treat" },
    ],
    impact: [
      { label: "Kept out of landfill", value: "420 g" },
      { label: "CO2e avoided", value: "6 kg" },
      { label: "Materials recovered", value: "80%" },
    ],
  },
};

export const SAMPLE_KEYS = Object.keys(SAMPLES) as SampleKey[];

export function isSampleKey(value: string): value is SampleKey {
  return value in SAMPLES;
}
