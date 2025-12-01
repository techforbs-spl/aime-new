import path from "path";
import fs from "fs";
import { z } from "zod";

// --- Types & Schemas ---

export type PartnerMode = {
  type: string;
  profile?: string;
  volume?: string;
  description?: string;
};

export interface PartnerConfig {
  partner_name: string;
  display_name: string;
  partner_id: string;
  version?: number;
  label?: string;
  status: "active" | "inactive";
  mode?: PartnerMode;
  personas: {
    primary: string;
    secondary?: string[];
  };
  signal_library: {
    hashtags: string[];
    keywords: string[];
    engagement_patterns?: string[];
  };
  trigger_library: Record<string, any>;
  comment_engine: Record<string, any>;
  routing: Record<string, any>;
  reporting?: Record<string, any>;
  governance?: Record<string, any>;
}

// Optional: strict validation for GIMA V4
const GimaV4Schema = z.object({
  partner_name: z.literal("GIMA"),
  display_name: z.string(),
  partner_id: z.literal("gima"),
  version: z.number().min(4),
  status: z.enum(["active", "inactive"]),
  mode: z.object({
    type: z.string(),
    profile: z.string().optional(),
    volume: z.string().optional(),
    description: z.string().optional()
  }).optional()
  // You can extend with more fields if needed
}).passthrough();

// --- Internal Registry ---

const partnerRegistry: Map<string, PartnerConfig> = new Map();

function loadJsonConfig(configPath: string): any {
  const fullPath = path.resolve(configPath);
  const raw = fs.readFileSync(fullPath, "utf-8");
  return JSON.parse(raw);
}

// --- Loader for GIMA V4 ---

export function loadGimaPartnerConfigV4(): PartnerConfig {
  const configPath = "configs/partners/gima/gima_partner_config_v4.json";
  const json = loadJsonConfig(configPath);

  // Validate basic shape for safety
  const parsed = GimaV4Schema.parse(json);

  const config: PartnerConfig = {
    ...json,
    partner_name: parsed.partner_name,
    partner_id: parsed.partner_id,
    version: parsed.version ?? 4,
    status: parsed.status
  };

  partnerRegistry.set(config.partner_id, config);

  return config;
}

// --- Generic Registry API ---

export function loadAllPartnerConfigs(): void {
  partnerRegistry.clear();

  // Load other partners here as needed
  // e.g. loadAllmaxConfig(), loadAdeevaConfig(), etc.

  // GIMA is now canonical on V4:
  loadGimaPartnerConfigV4();
}

export function getPartnerConfig(partnerId: string): PartnerConfig | undefined {
  return partnerRegistry.get(partnerId);
}

export function getAllPartnerConfigs(): PartnerConfig[] {
  return Array.from(partnerRegistry.values());
}
