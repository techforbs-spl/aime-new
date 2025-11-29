import path from "path";
import fs from "fs";

// -----------------------------
// TYPES
// -----------------------------

export interface PersonaConfig {
  id: string;
  name: string;
  tier?: "standard" | "premium";
  active?: boolean;
}

export interface CreatorConfig {
  id: string;
  name: string;
  specialty?: string;
  active?: boolean;
}

export interface AnalyticsConfig {
  baselineSignals: number;
  baselineComments: number;
  baselineLatencyMs: number;
  baselineErrorRate: number;
  dailyGrowthRate: number;
  noiseMultiplier: number;
}

export interface PartnerConfig {
  id: string;
  name: string;
  personas?: PersonaConfig[];
  creators?: CreatorConfig[];
  analytics: AnalyticsConfig;
}

// -----------------------------
// INTERNAL CACHE
// -----------------------------

let partnerConfigs: Record<string, PartnerConfig> = {};

// -----------------------------
// LOAD JSON FILES
// -----------------------------

export function loadPartnerConfigs() {
  try {
    const filePath = path.join(__dirname, "../config/partners.json");

    if (!fs.existsSync(filePath)) {
      console.warn("⚠️ partners.json not found — using empty config.");
      partnerConfigs = {};
      return;
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const list: PartnerConfig[] = JSON.parse(raw);

    partnerConfigs = {};
    list.forEach((pc) => {
      partnerConfigs[pc.id] = pc;
    });

    console.log("✅ Partner configs loaded:", Object.keys(partnerConfigs));
  } catch (err) {
    console.error("❌ Failed to load partner configs:", err);
    partnerConfigs = {};
  }
}

// -----------------------------
// GET CONFIG BY PARTNER ID
// -----------------------------

export function getPartnerConfig(id: string): PartnerConfig | null {
  if (!id) return null;

  // Normalize ID (case-insensitive)
  const key = id.trim().toLowerCase();

  const config = partnerConfigs[key];
  return config || null;
}

// -----------------------------
// OPTIONAL: HOT RELOAD (DEV ONLY)
// -----------------------------

export function reloadPartnerConfigs() {
  console.log("♻️ Reloading partner configs...");
  loadPartnerConfigs();
}

// Initial load
loadPartnerConfigs();
