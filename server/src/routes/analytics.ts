import { Router } from 'express'
import { getSnapshot, DashboardSnapshot } from '../data/snapshots.js'
import { subDays, formatISO, startOfDay, endOfDay, subWeeks, eachDayOfInterval, isWithinInterval } from 'date-fns'

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

// Generate synthetic daily data for testing
function generateSyntheticTrendData(partner: string) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - 30) // Last 30 days
  
  const days = []
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const daySeed = parseInt(dateStr.replace(/-/g, ''), 10)
    
    // Generate semi-random but deterministic values based on date and partner
    const signals = Math.round(30 + Math.sin(daySeed) * 20 + (partner === 'allmax' ? 50 : 20))
    const comments = Math.round(signals * (0.15 + Math.sin(daySeed * 2) * 0.05))
    const clicks = Math.round(comments * (0.7 + Math.sin(daySeed * 3) * 0.2))
    
    // Persona distribution
    const personas = {
      rn_clinical: Math.max(1, Math.round(Math.sin(daySeed * 0.5) * 2 + 4)),
      md_functional: Math.max(0, Math.round(Math.sin(daySeed * 0.7) * 1 + 1)),
      chiro_sports: Math.max(0, Math.round(Math.sin(daySeed * 0.6) * 2 + 2)),
      physio_rehab: Math.max(0, Math.round(Math.sin(daySeed * 0.8) * 1 + 1))
    }

    days.push({
      date: dateStr,
      signals,
      comments,
      clicks,
      personas
    })
  }
  
  return days
}

// Calculate weekly summary from daily data
function calculateWeeklySummary(dailyData: any[]) {
  const last7Days = dailyData.slice(-7)
  return {
    signals: last7Days.reduce((sum: number, day: any) => sum + day.signals, 0),
    comments: last7Days.reduce((sum: number, day: any) => sum + day.comments, 0),
    clicks: last7Days.reduce((sum: number, day: any) => sum + day.clicks, 0)
  }
}

analyticsRouter.get('/trend', (req, res) => {
  try {
    const snapshot = getSnapshot(req.query.partner as string | undefined)
    const partner = (req.query.partner as string) || 'default'
    
    // In a real implementation, you would query your database here
    // For now, we'll use synthetic data
    const dailyData = generateSyntheticTrendData(partner)
    const weeklySummary = calculateWeeklySummary(dailyData)
    
    res.json({
      success: true,
      data: {
        daily: dailyData,
        weekly_summary: weeklySummary
      }
    })
  } catch (error) {
    console.error('Error in /analytics/trend:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trend data'
    })
  }
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




