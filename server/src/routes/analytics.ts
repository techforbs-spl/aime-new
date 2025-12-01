import * as express from 'express';
import type { Request, Response } from 'express';
import {
  getAllPartnerConfigs,
  getPartnerConfig,
  type PartnerConfig
} from "../services/partnerConfigLoader.js";

// Basic event type – your implementation may extend this.
export interface AnalyticsEvent {
  partner_id: string; // e.g. "gima", "allmax", "adeeva"
  type: string; // e.g. "click", "view", "comment", "conversion"
  metric?: string; // e.g. "lean_program_clicks", "lean_program_enrollments"
  timestamp: string; // ISO date string
  meta?: Record<string, any>;
}

export interface MetricCount {
  metric: string;
  count: number;
}

export interface PartnerAnalyticsSummary {
  partner_id: string;
  display_name: string;
  version?: number;
  total_events: number;
  metrics: MetricCount[];
}

/**
 * Build a quick lookup for metrics we care about based on partner configs.
 * This allows us to align metrics directly with each partner's config.reporting.metrics array.
 */
function buildConfiguredMetricSet(
  partnerConfigs: PartnerConfig[]
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();

  for (const cfg of partnerConfigs) {
    const partnerId = cfg.partner_id;
    const metricsList =
      (cfg.reporting && (cfg.reporting as any).metrics) || [];

    map.set(partnerId, new Set(metricsList as string[]));
  }

  return map;
}

/**
 * Compute per-partner metric counts from a stream of events.
 *
 * Example use:
 *  const summaries = summarizeEvents(eventsFromDBOrLog);
 */
export function summarizeEvents(
  events: AnalyticsEvent[]
): PartnerAnalyticsSummary[] {
  const configs = getAllPartnerConfigs();
  const configuredMetricSet = buildConfiguredMetricSet(configs);

  const summaryMap = new Map<string, PartnerAnalyticsSummary>();

  for (const event of events) {
    const partnerId = event.partner_id;
    if (!partnerId) continue;

    // Ensure we have a config for this partner.
    const cfg = getPartnerConfig(partnerId);
    if (!cfg) continue;

    // Initialize summary for this partner if needed.
    if (!summaryMap.has(partnerId)) {
      summaryMap.set(partnerId, {
        partner_id: partnerId,
        display_name: cfg.display_name,
        version: (cfg as any).version,
        total_events: 0,
        metrics: []
      });
    }

    const summary = summaryMap.get(partnerId)!;
    summary.total_events += 1;

    const partnerMetricSet = configuredMetricSet.get(partnerId);
    if (!partnerMetricSet) continue;

    // Only count metrics that the config actually cares about.
    const metricKey =
      event.metric && partnerMetricSet.has(event.metric)
        ? event.metric
        : undefined;

    if (!metricKey) continue;

    let metricEntry = summary.metrics.find((m) => m.metric === metricKey);
    if (!metricEntry) {
      metricEntry = { metric: metricKey, count: 0 };
      summary.metrics.push(metricEntry);
    }

    metricEntry.count += 1;
  }

  return Array.from(summaryMap.values());
}

/**
 * Convenience helper for GIMA-specific reporting (e.g. lean program).
 */
export interface GimaLeanProgramSummary {
  partner_id: "gima";
  version?: number;
  lean_program_clicks: number;
  lean_program_enrollments: number;
}

/**
 * Extracts a lean metrics view just for GIMA (using V4 config assumptions).
 */
export function getGimaLeanProgramSummary(
  events: AnalyticsEvent[]
): GimaLeanProgramSummary | null {
  const cfg = getPartnerConfig("gima");
  if (!cfg) return null;

  const summaries = summarizeEvents(
    events.filter((e) => e.partner_id === "gima")
  );
  const gimaSummary = summaries.find((s) => s.partner_id === "gima");
  if (!gimaSummary) {
    return {
      partner_id: "gima",
      version: (cfg as any).version,
      lean_program_clicks: 0,
      lean_program_enrollments: 0
    };
  }

  const clicks =
    gimaSummary.metrics.find((m) => m.metric === "lean_program_clicks")
      ?.count ?? 0;
  const enrollments =
    gimaSummary.metrics.find(
      (m) => m.metric === "lean_program_enrollments"
    )?.count ?? 0;

  return {
    partner_id: "gima",
    version: gimaSummary.version,
    lean_program_clicks: clicks,
    lean_program_enrollments: enrollments
  };
}

// Create an Express router for analytics endpoints
const router = express.Router();

// Example route - adjust according to your needs
router.get('/summary', (req: Request, res: Response) => {
  // This is a placeholder - implement actual logic here
  res.json({ message: 'Analytics summary endpoint' });
});

export default router;
