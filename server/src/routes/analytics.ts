import { Router, Request, Response } from 'express'
import { getPartnerConfig, PartnerConfig } from '../services/partnerConfigLoader'

// Types for trend points
type TrendPoint = {
  timestamp: string; // ISO string
  value: number;
};

interface DailyTrendData {
  date: string;
  signals: number;
  comments: number;
  clicks: number;
  personas: {
    rn_clinical: number;
    md_functional: number;
    chiro_sports: number;
    physio_rehab: number;
  };
}

const analyticsRouter = Router()

// Helper: parse range param ("7d" | "30d" | "90d")
function parseRange(range?: string): number {
  switch (range) {
    case "7d":
      return 7;
    case "90d":
      return 90;
    case "30d":
    default:
      return 30;
  }
}

// Helper: build a simple time series using PartnerConfig.analytics
function buildTrend(
  metric: "signals" | "comments" | "latency" | "errorRate",
  config: PartnerConfig,
  days: number
): TrendPoint[] {
  const { analytics } = config;
  const now = new Date();

  const base =
    metric === "signals"
      ? analytics.baselineSignals
      : metric === "comments"
      ? analytics.baselineComments
      : metric === "latency"
      ? analytics.baselineLatencyMs
      : analytics.baselineErrorRate * 100; // percentage

  const trend: TrendPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);

    const growthFactor = Math.pow(analytics.dailyGrowthRate, -i);
    const noise =
      (Math.random() - 0.5) *
      analytics.noiseMultiplier *
      (metric === "errorRate" ? 1 : base * 0.05);

    let value = base * growthFactor + noise;

    if (metric === "errorRate") {
      // clamp between 0 and 100%
      value = Math.max(0, Math.min(100, value));
    } else {
      value = Math.max(0, value);
    }

    trend.push({
      timestamp: d.toISOString(),
      value: Number(value.toFixed(2)),
    });
  }

  return trend;
}

// Helper: get partner config or error
function resolvePartner(req: Request, res: Response): PartnerConfig | null {
  const partnerId = (req.query.partner as string) || "";
  if (!partnerId) {
    res.status(400).json({ error: "Missing partner query param" });
    return null;
  }

  const config = getPartnerConfig(partnerId);
  if (!config) {
    res.status(400).json({ error: `Unknown partner: ${partnerId}` });
    return null;
  }

  return config;
}

// GET /api/analytics/signal-volume
analyticsRouter.get('/signal-volume', (req, res) => {
  const config = resolvePartner(req, res);
  if (!config) return;

  const days = parseRange(req.query.range as string | undefined);
  const trend = buildTrend("signals", config, days);

  res.json({
    partner: config.id,
    metric: "signal-volume",
    rangeDays: days,
    points: trend,
  });
});

// GET /api/analytics/comment-volume
analyticsRouter.get('/comment-volume', (req, res) => {
  const config = resolvePartner(req, res);
  if (!config) return;

  const days = parseRange(req.query.range as string | undefined);
  const trend = buildTrend("comments", config, days);

  res.json({
    partner: config.id,
    metric: "comment-volume",
    rangeDays: days,
    points: trend,
  });
});

// GET /api/analytics/latency
analyticsRouter.get('/latency', (req, res) => {
  const config = resolvePartner(req, res);
  if (!config) return;

  const days = parseRange(req.query.range as string | undefined);
  const trend = buildTrend("latency", config, days);

  res.json({
    partner: config.id,
    metric: "latency",
    unit: "ms",
    rangeDays: days,
    points: trend,
  });
});

// GET /api/analytics/error-rate
analyticsRouter.get('/error-rate', (req, res) => {
  const config = resolvePartner(req, res);
  if (!config) return;

  const days = parseRange(req.query.range as string | undefined);
  const trend = buildTrend("errorRate", config, days);

  res.json({
    partner: config.id,
    metric: "error-rate",
    unit: "percent",
    rangeDays: days,
    points: trend,
  });
});

// GET /api/analytics/campaign-performance
analyticsRouter.get('/campaign-performance', (req, res) => {
  const config = resolvePartner(req, res);
  if (!config) return;

  // Simple synthetic view built off analytics baseline
  const { analytics } = config;

  res.json({
    partner: config.id,
    summary: {
      activeCampaigns: 5, // can be tied to config later
      avgCTR: 3.1,
      avgCPA: 1.8,
    },
    signalsPerDay: analytics.baselineSignals,
    commentsPerDay: analytics.baselineComments,
  });
});

// GET /api/analytics/export/csv
analyticsRouter.get('/export/csv', (req, res) => {
  const config = resolvePartner(req, res);
  if (!config) return;

  const days = parseRange(req.query.range as string | undefined);
  const trend = buildTrend("signals", config, days);

  const rows = ["timestamp,value", ...trend.map((p) => `${p.timestamp},${p.value}`)];

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="analytics_${config.id}_${days}d.csv"` 
  );
  res.send(rows.join("\n"));
});

// Get trend data for a specific partner
function getTrendData(partner: string) {
  const config = getPartnerConfig(partner);
  if (!config) {
    return null;
  }

  const now = new Date();
  const dailyData = [];
  
  // Generate 7 days of data using the partner's analytics config
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Calculate growth factor for this day
    const growthFactor = Math.pow(config.analytics.dailyGrowthRate, -i);
    const noise = (Math.random() - 0.5) * config.analytics.noiseMultiplier;
    
    // Generate values based on baseline and growth
    const signals = Math.floor(
      config.analytics.baselineSignals * growthFactor * (1 + noise)
    );
    
    const comments = Math.floor(
      config.analytics.baselineComments * growthFactor * (1 + noise * 0.5)
    );
    
    const clicks = Math.floor(signals * (0.1 + Math.random() * 0.1));
    
    // If personas are defined in config, use them, otherwise use defaults
    const personas = config.personas?.reduce((acc, persona) => {
      if (persona.active) {
        const base = persona.tier === 'premium' ? 5 : 2;
        acc[persona.id] = Math.floor(base * (1 + Math.random() * 2));
      }
      return acc;
    }, {} as Record<string, number>) || {
      rn_clinical: Math.floor(1 + Math.random() * 5),
      md_functional: Math.floor(1 + Math.random() * 3),
      chiro_sports: Math.floor(1 + Math.random() * 4),
      physio_rehab: Math.floor(1 + Math.random() * 3)
    };
    
    dailyData.push({
      date: dateStr,
      signals,
      comments,
      clicks,
      personas
    });
  }
  
  // Calculate weekly summary
  const weeklySummary = dailyData.reduce((acc, day) => ({
    signals: acc.signals + day.signals,
    comments: acc.comments + day.comments,
    clicks: acc.clicks + day.clicks
  }), { signals: 0, comments: 0, clicks: 0 });
  
  return { 
    daily: dailyData, 
    weekly_summary: weeklySummary,
    partner: config.id
  };
}

// Trend endpoint using partner config
analyticsRouter.get('/trend', (req, res) => {
  try {
    const partner = req.query.partner as string | undefined || 'default';
    const data = getTrendData(partner);
    
    if (!data) {
      return res.status(404).json({
        success: false,
        error: `No configuration found for partner: ${partner}`
      });
    }
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in /analytics/trend:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trend data'
    })
  }
})

export default analyticsRouter;




