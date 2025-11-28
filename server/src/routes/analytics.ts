import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getPartnerConfig, PartnerConfig, PartnerConfigSchema } from '../services/partnerConfigLoader';

type AnalyticsConfig = z.infer<typeof PartnerConfigSchema>['analytics'];

const analyticsRouter = Router();

type TrendPoint = {
  timestamp: string;
  value: number;
};

// Helper: parse "7d", "30d", "90d"
function parseRange(range?: string): number {
  switch (range) {
    case '7d':
      return 7;
    case '90d':
      return 90;
    case '30d':
    default:
      return 30;
  }
}

// Build a synthetic trend based on PartnerConfig.analytics
function buildTrend(
  metric: 'signals' | 'comments' | 'latency' | 'errorRate',
  config: PartnerConfig,
  days: number
): TrendPoint[] {
  const analytics = config.analytics as AnalyticsConfig;
  const now = new Date();

  const base =
    metric === 'signals'
      ? analytics.baselineSignals
      : metric === 'comments'
      ? analytics.baselineComments
      : metric === 'latency'
      ? analytics.baselineLatencyMs
      : analytics.baselineErrorRate * 100;

  const trend: TrendPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);

    const growth = Math.pow(analytics.dailyGrowthRate, -i);
    const noise =
      (Math.random() - 0.5) *
      analytics.noiseMultiplier *
      (metric === 'errorRate' ? 1 : base * 0.05);

    let value = base * growth + noise;

    if (metric === 'errorRate') {
      value = Math.max(0, Math.min(100, value));
    } else {
      value = Math.max(0, value);
    }

    trend.push({
      timestamp: date.toISOString(),
      value: Number(value.toFixed(2)),
    });
  }

  return trend;
}

// Utility: Resolve partner or return null
function resolvePartner(req: Request, res: Response): PartnerConfig | null {
  const partnerId = (req.query.partner as string) || '';

  if (!partnerId) {
    res.status(400).json({ error: 'Missing partner query param' });
    return null;
  }

  const config = getPartnerConfig(partnerId);

  if (!config) {
    res.status(404).json({ error: `Unknown partner: ${partnerId}` });
    return null;
  }

  return config;
}

// ----------------------- ROUTES -----------------------

analyticsRouter.get('/signal-volume', (req, res) => {
  const config = resolvePartner(req, res);
  if (!config) return;

  const days = parseRange(req.query.range as string);
  const trend = buildTrend('signals', config, days);

  return res.json({
    partner: config.id,
    metric: 'signal-volume',
    rangeDays: days,
    points: trend,
  });
});

analyticsRouter.get('/comment-volume', (req, res) => {
  const config = resolvePartner(req, res);
  if (!config) return;

  const days = parseRange(req.query.range as string);
  const trend = buildTrend('comments', config, days);

  return res.json({
    partner: config.id,
    metric: 'comment-volume',
    rangeDays: days,
    points: trend,
  });
});

analyticsRouter.get('/latency', (req, res) => {
  const config = resolvePartner(req, res);
  if (!config) return;

  const days = parseRange(req.query.range as string);
  const trend = buildTrend('latency', config, days);

  return res.json({
    partner: config.id,
    metric: 'latency',
    unit: 'ms',
    rangeDays: days,
    points: trend,
  });
});

analyticsRouter.get('/error-rate', (req, res) => {
  const config = resolvePartner(req, res);
  if (!config) return;

  const days = parseRange(req.query.range as string);
  const trend = buildTrend('errorRate', config, days);

  return res.json({
    partner: config.id,
    metric: 'error-rate',
    unit: 'percent',
    rangeDays: days,
    points: trend,
  });
});

// CSV Export
analyticsRouter.get('/export/csv', (req, res) => {
  const config = resolvePartner(req, res);
  if (!config) return;

  const days = parseRange(req.query.range as string);
  const trend = buildTrend('signals', config, days);

  const rows = ['timestamp,value', ...trend.map((p) => `${p.timestamp},${p.value}`)];

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="analytics_${config.id}_${days}d.csv"`
  );

  return res.send(rows.join('\n'));
});

export default analyticsRouter;
