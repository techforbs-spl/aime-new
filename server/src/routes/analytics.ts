import { Router } from 'express'
import { getSnapshot, DashboardSnapshot, SignalEntry, CommentEntry } from '../data/snapshots.js'

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

// Generate synthetic trend data for testing
function generateSyntheticTrendData() {
  const now = new Date()
  const dailyData = []
  
  // Generate 7 days of data
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    // Base values with some randomness
    const signals = Math.floor(30 + Math.random() * 30)
    const comments = Math.floor(5 + Math.random() * 15)
    const clicks = Math.floor(3 + Math.random() * 10)
    
    dailyData.push({
      date: dateStr,
      signals,
      comments,
      clicks,
      personas: {
        rn_clinical: Math.floor(1 + Math.random() * 5),
        md_functional: Math.floor(1 + Math.random() * 3),
        chiro_sports: Math.floor(1 + Math.random() * 4),
        physio_rehab: Math.floor(1 + Math.random() * 3)
      }
    })
  }
  
  // Calculate weekly summary
  const weeklySummary = dailyData.reduce((acc, day) => ({
    signals: acc.signals + day.signals,
    comments: acc.comments + day.comments,
    clicks: acc.clicks + day.clicks
  }), { signals: 0, comments: 0, clicks: 0 })
  
  return { daily: dailyData, weekly_summary: weeklySummary }
}

// Get real data from snapshot if available
function getTrendData(partner: string) {
  try {
    const snapshot = getSnapshot(partner)
    const now = new Date()
    const dailyData: DailyTrendData[] = []
    
    // Group signals and comments by date
    const signalsByDate: Record<string, SignalEntry[]> = {}
    const commentsByDate: Record<string, CommentEntry[]> = {}
    
    snapshot.signals.forEach(signal => {
      const date = signal.ts.split('T')[0]
      if (!signalsByDate[date]) signalsByDate[date] = []
      signalsByDate[date].push(signal)
    })
    
    snapshot.comments.forEach(comment => {
      const date = comment.ts.split('T')[0]
      if (!commentsByDate[date]) commentsByDate[date] = []
      commentsByDate[date].push(comment)
    })
    
    // Get unique dates from both signals and comments
    const allDates = new Set([
      ...Object.keys(signalsByDate),
      ...Object.keys(commentsByDate)
    ])
    
    // Convert to array and sort by date
    const sortedDates = Array.from(allDates).sort()
    
    // Create daily data points
    sortedDates.slice(-7).forEach(date => {
      const signals = signalsByDate[date]?.length || 0
      const comments = commentsByDate[date]?.length || 0
      
      // For demo purposes, generate some synthetic clicks
      const clicks = Math.floor(signals * (0.1 + Math.random() * 0.2))
      
      dailyData.push({
        date,
        signals,
        comments,
        clicks,
        personas: {
          rn_clinical: Math.floor(1 + Math.random() * 5),
          md_functional: Math.floor(1 + Math.random() * 3),
          chiro_sports: Math.floor(1 + Math.random() * 4),
          physio_rehab: Math.floor(1 + Math.random() * 3)
        }
      })
    })
    
    // If we have data, return it
    if (dailyData.length > 0) {
      const weeklySummary = dailyData.reduce((acc, day) => ({
        signals: acc.signals + day.signals,
        comments: acc.comments + day.comments,
        clicks: acc.clicks + day.clicks
      }), { signals: 0, comments: 0, clicks: 0 })
      
      return { daily: dailyData, weekly_summary: weeklySummary }
    }
  } catch (error) {
    console.error('Error getting trend data:', error)
  }
  
  // Fall back to synthetic data if no real data or error
  return generateSyntheticTrendData()
}

// New analytics trend endpoint
analyticsRouter.get('/trend', (req, res) => {
  try {
    const partner = req.query.partner as string | undefined
    const data = getTrendData(partner || 'allmax') // Default to 'allmax' if no partner specified
    
    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error in /analytics/trend:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trend data'
    })
  }
})

export default analyticsRouter




