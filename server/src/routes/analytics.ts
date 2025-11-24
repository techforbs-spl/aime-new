import { Router } from 'express'
import { getSnapshot, DashboardSnapshot } from '../data/snapshots.js'

const analyticsRouter = Router()

const RANGE_CONFIG: Record<string, { points: number; bucketHours: number }> = {
  '24h': { points: 24, bucketHours: 1 },
  '7d': { points: 28, bucketHours: 6 },
  '30d': { points: 30, bucketHours: 24 },
}

function pickRange(rangeParam?: string) {
  if (rangeParam && RANGE_CONFIG[rangeParam]) return rangeParam
  return '7d'
}

function seedNoise(seed: number, idx: number) {
  const value = Math.sin(seed * (idx + 1) * 9301) * 10000
  return value - Math.floor(value) - 0.5
}

function buildTrendResponse(
  snapshot: DashboardSnapshot & { partner: string },
  metric: keyof DashboardSnapshot['metrics'],
  rangeParam?: string,
) {
  const range = pickRange(rangeParam)
  const config = RANGE_CONFIG[range]
  const base = snapshot.metrics[metric]
  const variance = typeof base === 'number' ? Math.max(base * 0.18, 1) : 1
  const now = Date.now()
  const bucketMs = config.bucketHours * 3600 * 1000

  const trend = Array.from({ length: config.points }, (_, idx) => {
    const timestamp = new Date(now - bucketMs * (config.points - idx - 1)).toISOString()
    const oscillation = Math.sin(idx / Math.max(1, config.points / 8)) * variance * 0.6
    const noise = seedNoise(base, idx) * variance
    const rawValue = (typeof base === 'number' ? base : 0) + oscillation + noise
    const value = Number(Math.max(0, rawValue).toFixed(metric === 'errorRate' ? 2 : 0))
    return { timestamp, value }
  })

  return {
    partner: snapshot.partner,
    range,
    trend,
    metric,
    updatedAt: new Date().toISOString(),
  }
}

analyticsRouter.get('/signal-volume', (req, res) => {
  const snapshot = getSnapshot(req.query.partner as string | undefined)
  res.json(buildTrendResponse(snapshot, 'signals', req.query.range as string | undefined))
})

analyticsRouter.get('/comment-volume', (req, res) => {
  const snapshot = getSnapshot(req.query.partner as string | undefined)
  res.json(buildTrendResponse(snapshot, 'comments', req.query.range as string | undefined))
})

analyticsRouter.get('/latency', (req, res) => {
  const snapshot = getSnapshot(req.query.partner as string | undefined)
  res.json(buildTrendResponse(snapshot, 'latencyMs', req.query.range as string | undefined))
})

analyticsRouter.get('/error-rate', (req, res) => {
  const snapshot = getSnapshot(req.query.partner as string | undefined)
  res.json(buildTrendResponse(snapshot, 'errorRate', req.query.range as string | undefined))
})

analyticsRouter.get('/campaign-performance', (req, res) => {
  const snapshot = getSnapshot(req.query.partner as string | undefined)
  res.json(snapshot.campaigns)
})

analyticsRouter.get('/export/csv', (req, res) => {
  const snapshot = getSnapshot(req.query.partner as string | undefined)
  const entity = ((req.query.entity as string | undefined) ?? 'signals').toLowerCase()

  const map: Record<string, any[]> = {
    signals: snapshot.signals,
    'comment-engine': snapshot.comments,
    personas: snapshot.personas,
    creators: snapshot.creators,
    campaigns: snapshot.campaigns,
    logs: snapshot.logs,
  }

  const data = map[entity] ?? snapshot.signals
  if (!Array.isArray(data) || data.length === 0) {
    return res.status(204).end()
  }

  const headers = Array.from(
    data.reduce((set: Set<string>, entry) => {
      Object.keys(entry).forEach((key) => set.add(key))
      return set
    }, new Set<string>()),
  )

  const rows = data.map((entry) =>
    headers
      .map((key) => {
        const value = entry[key as keyof typeof entry]
        return typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value ?? '')
      })
      .join(','),
  )

  const csv = [headers.join(','), ...rows].join('\n')
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="${snapshot.partner.toLowerCase()}-${entity}.csv"`)
  res.send(csv)
})

export default analyticsRouter




