import fs from "fs";
import path from "path";
import { z } from "zod";

const CONFIG_DIR = path.join(process.cwd(), "partner-config");

//
// 1. Define the schema for partner configs
//
export const PartnerConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  mode: z.enum(["professional", "high-volume", "hybrid"]).default("hybrid"),

  routing: z.object({
    enabled: z.boolean().default(true),
    signalWeight: z.number().default(1),
    commentWeight: z.number().default(1),
    personaMap: z.record(z.string(), z.string()).optional(), // personaId -> tier
  }),

  analytics: z.object({
    baselineSignals: z.number().default(0),
    baselineComments: z.number().default(0),
    noiseMultiplier: z.number().default(1.0),
    dailyGrowthRate: z.number().default(1.01),
  }),

  personas: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      tier: z.string().optional(),
      active: z.boolean().default(true),
      notes: z.string().optional(),
    })
  ).optional(),

  creators: z.array(
    z.object({
      id: z.string(),
      handle: z.string(),
      platform: z.string().default("instagram"),
      followers: z.number().default(0),
      active: z.boolean().default(true),
    })
  ).optional(),
});

export type PartnerConfig = z.infer<typeof PartnerConfigSchema>;


//
// 2. Internal memory cache
//
let partnerConfigs: Record<string, PartnerConfig> = {};


//
// 3. Load all configs from /partner-config/*.json
//
export function loadPartnerConfigs(): void {
  partnerConfigs = {}; // reset

  if (!fs.existsSync(CONFIG_DIR)) {
    console.warn(`[PartnerConfigLoader] No config directory found at ${CONFIG_DIR}`);
    return;
  }

  const files = fs.readdirSync(CONFIG_DIR).filter(f => f.endsWith(".json"));

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(CONFIG_DIR, file), "utf-8");
      const json = JSON.parse(raw);

      const parsed = PartnerConfigSchema.parse(json);

      partnerConfigs[parsed.id] = parsed;

      console.log(`[PartnerConfigLoader] Loaded config for partner: ${parsed.id}`);
    } catch (err) {
      console.error(`[PartnerConfigLoader] Failed to load ${file}:`, err);
    }
  }
}

//
// 4. Public API
//

// Get config by ID
export function getPartnerConfig(id: string): PartnerConfig | null {
  return partnerConfigs[id] ?? null;
}

// Get all configs
export function getAllPartnerConfigs(): PartnerConfig[] {
  return Object.values(partnerConfigs);
}

// Force reload from disk
export function refreshConfigs(): void {
  loadPartnerConfigs();
}

//
// 5. Initialize on first import
//
loadPartnerConfigs();
