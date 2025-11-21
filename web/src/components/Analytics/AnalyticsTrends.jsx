import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  getCommentTrend,
  getErrorRateTrend,
  getLatencyTrend,
  getSignalTrend,
} from '../../services/api/analyticsService'

const RANGE_OPTIONS = [
  { label: '24h', value: '24h', points: 24, bucketHours: 1 },
  { label: '7d', value: '7d', points: 28, bucketHours: 6 },
  { label: '30d', value: '30d', points: 30, bucketHours: 24 },
]

const PARTNER_OPTIONS = ['Allmax', 'Adeeva', 'GIMA']
const DEFAULT_REFRESH_MS = 60_000

function seededNoise(seed, idx) {
  const base = seed
    .split('')
    .reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0)
  const x = Math.sin(base * (idx + 1) * 9301) * 10000
  return x - Math.floor(x) - 0.5
}

function generateDemoTrend(range, base, variance, seed, decimals = 0) {
  const config = RANGE_OPTIONS.find((opt) => opt.value === range) ?? RANGE_OPTIONS[1]
  const now = Date.now()
  const dataPoints = config.points
  const bucketMs = config.bucketHours * 3600 * 1000

  return Array.from({ length: dataPoints }, (_, idx) => {
    const timestamp = new Date(now - bucketMs * (dataPoints - idx - 1)).toISOString()
    const oscillation = Math.sin(idx / Math.max(1, dataPoints / 8)) * variance * 0.6
    const noise = seededNoise(`${seed}-${range}`, idx) * variance
    const rawValue = base + oscillation + noise
    const numeric = Math.max(0, rawValue)
    const factor = 10 ** decimals
    const rounded = decimals ? Math.round(numeric * factor) / factor : Math.round(numeric)
    return { timestamp, value: rounded }
  })
}

function buildDemoSnapshot(range, partner) {
  const multiplier = partner === 'Allmax' ? 1 : partner === 'Adeeva' ? 0.7 : 0.85
  return {
    signal: generateDemoTrend(range, 4200 * multiplier, 900 * multiplier, `${partner}-signal`),
    comment: generateDemoTrend(range, 1600 * multiplier, 300 * multiplier, `${partner}-comment`),
    latency: generateDemoTrend(range, 220 * (2 - multiplier), 120, `${partner}-latency`),
    error: generateDemoTrend(range, 1.5 * (2 - multiplier), 0.9, `${partner}-error`, 2).map((point) => ({
      ...point,
      value: Number(point.value.toFixed(2)),
    })),
  }
}

function ChartCard({
  title,
  description,
  data,
  color = '#111827',
  valueSuffix = '',
  yUnit,
  highlightThreshold,
  loading,
  errorMessage,
  range,
}) {
  const formatter = useMemo(() => {
    return range === '24h'
      ? new Intl.DateTimeFormat(undefined, { hour: 'numeric' })
      : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
  }, [range])

  return (
    <article className="rounded-3xl border bg-white p-5 shadow-sm">
      <header className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </header>
      {errorMessage && (
        <p className="mb-2 text-xs font-semibold text-amber-600">{errorMessage}</p>
      )}
      <div className="h-64">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">Loading trends…</div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">No datapoints</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => formatter.format(new Date(value))}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                minTickGap={24}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(value) => `${value}${valueSuffix}`}
                width={64}
                domain={['auto', 'auto']}
                unit={yUnit}
              />
              <Tooltip
                cursor={{ stroke: '#d1d5db' }}
                contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value) => [`${value}${valueSuffix}`, title]}
              />
              {highlightThreshold != null && (
                <ReferenceLine
                  y={highlightThreshold}
                  stroke="#f97316"
                  strokeDasharray="6 6"
                  label={{
                    value: `Threshold ${highlightThreshold}${valueSuffix}`,
                    fill: '#f97316',
                    fontSize: 12,
                    position: 'insideTopRight',
                  }}
                />
              )}
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  )
}

export default function AnalyticsTrends({ autoRefreshMs = DEFAULT_REFRESH_MS }) {
  const [range, setRange] = useState('7d')
  const [partner, setPartner] = useState(PARTNER_OPTIONS[0])
  const [trends, setTrends] = useState(() => buildDemoSnapshot('7d', PARTNER_OPTIONS[0]))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const loadTrends = useCallback(
    async (options = { silent: false }) => {
      const { silent } = options
      if (!silent) setLoading(true)
      setError('')
      try {
        const [signal, comment, latency, errorRate] = await Promise.all([
          getSignalTrend(range, partner),
          getCommentTrend(range, partner),
          getLatencyTrend(range, partner),
          getErrorRateTrend(range, partner),
        ])

        const snapshot = {
          signal: signal.length ? signal : buildDemoSnapshot(range, partner).signal,
          comment: comment.length ? comment : buildDemoSnapshot(range, partner).comment,
          latency: latency.length ? latency : buildDemoSnapshot(range, partner).latency,
          error: errorRate.length ? errorRate : buildDemoSnapshot(range, partner).error,
        }

        if (mountedRef.current) {
          setTrends(snapshot)
          setLastUpdated(new Date())
        }
      } catch (err) {
        console.warn('[AnalyticsTrends] falling back to demo data', err)
        if (mountedRef.current) {
          setError(err?.status === 404 ? 'Showing demo data (API 404)' : 'Unable to load trend data')
          setTrends(buildDemoSnapshot(range, partner))
        }
      } finally {
        if (mountedRef.current && !silent) {
          setLoading(false)
        }
      }
    },
    [range, partner]
  )

  useEffect(() => {
    loadTrends({ silent: false })
  }, [loadTrends])

  useEffect(() => {
    if (!autoRefreshMs) return undefined
    const interval = setInterval(() => {
      loadTrends({ silent: true })
    }, autoRefreshMs)
    return () => clearInterval(interval)
  }, [autoRefreshMs, loadTrends])

  const headerStatus = useMemo(() => {
    if (loading) return 'Refreshing…'
    if (error) return error
    if (lastUpdated) return `Last updated ${lastUpdated.toLocaleTimeString()}`
    return 'Ready'
  }, [loading, error, lastUpdated])

  const statusBadgeClass = error
    ? 'bg-amber-100 text-amber-800'
    : loading
      ? 'bg-blue-100 text-blue-800'
      : 'bg-emerald-100 text-emerald-800'

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border bg-gradient-to-br from-black via-gray-900 to-gray-800 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-white/70">Analytics</p>
            <h1 className="text-3xl font-semibold">Trends Intelligence</h1>
            <p className="text-sm text-white/80">
              Signal, comment, latency and error-rate telemetry per partner with live auto-refresh.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass}`}>{headerStatus}</div>
            <div className="text-xs text-white/70">Auto-refresh every {Math.round(autoRefreshMs / 1000)}s</div>
          </div>
        </div>
      </header>

      <section className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setRange(option.value)}
                className={`rounded-2xl px-4 py-2 text-sm font-medium ${
                  range === option.value
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-gray-600" htmlFor="partner-filter">
              Partner
            </label>
            <select
              id="partner-filter"
              className="rounded-2xl border px-4 py-2 text-sm text-gray-800 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
              value={partner}
              onChange={(event) => setPartner(event.target.value)}
            >
              {PARTNER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="Signal Volume Trend"
          description="Routed ingest requests per bucket."
          data={trends.signal}
          color="#6366f1"
          loading={loading}
          errorMessage={error && !loading ? 'Unable to load trend data' : ''}
          range={range}
        />
        <ChartCard
          title="Comment Volume Trend"
          description="Comment Engine throughput."
          data={trends.comment}
          color="#0ea5e9"
          loading={loading}
          errorMessage={error && !loading ? 'Unable to load trend data' : ''}
          range={range}
        />
        <ChartCard
          title="Latency Trend"
          description="Pipeline p95 latency (ms)."
          data={trends.latency}
          color="#10b981"
          valueSuffix=" ms"
          yUnit=" ms"
          highlightThreshold={1000}
          loading={loading}
          errorMessage={error && !loading ? 'Unable to load trend data' : ''}
          range={range}
        />
        <ChartCard
          title="Error Rate Trend"
          description="Failures as % of routed volume."
          data={trends.error}
          color="#ef4444"
          valueSuffix="%"
          yUnit="%"
          loading={loading}
          errorMessage={error && !loading ? 'Unable to load trend data' : ''}
          range={range}
        />
      </section>
    </div>
  )
}


