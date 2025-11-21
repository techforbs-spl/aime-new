const API_BASE = import.meta.env?.VITE_API_BASE ?? ''

const defaultHeaders = {
  Accept: 'application/json',
}

function buildUrl(path, params = {}) {
  const base = API_BASE || window.location.origin
  const url = new URL(path, base)
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') return
    url.searchParams.set(key, value)
  })
  return url
}

function coerceTimestamp(point, idx) {
  return (
    point?.timestamp ??
    point?.ts ??
    point?.time ??
    point?.bucket ??
    point?.date ??
    new Date(Date.now() - (idx + 1) * 3600 * 1000).toISOString()
  )
}

function coerceValue(point) {
  if (point == null) return 0
  if (typeof point === 'number') return point
  if (typeof point.value === 'number') return point.value
  const candidate =
    point.metric ??
    point.count ??
    point.total ??
    point.latency ??
    point.errorRate ??
    point.volume ??
    point.percentage ??
    0
  const numeric = Number(candidate)
  return Number.isNaN(numeric) ? 0 : numeric
}

function normalizeTrend(payload = []) {
  let trend = []
  if (Array.isArray(payload)) {
    trend = payload
  } else if (Array.isArray(payload.trend)) {
    trend = payload.trend
  } else if (Array.isArray(payload.data)) {
    trend = payload.data
  }

  return trend.map((point, idx) => ({
    timestamp: coerceTimestamp(point, idx),
    value: coerceValue(point),
  }))
}

async function fetchTrend(endpoint, range = '7d', partner) {
  const url = buildUrl(endpoint, { range, partner })
  const res = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
    headers: defaultHeaders,
  })

  if (res.status === 404) {
    const err = new Error('Trend endpoint not found')
    err.status = 404
    throw err
  }
  if (!res.ok) {
    throw new Error(`Trend request failed: ${res.status} ${res.statusText}`)
  }

  const text = await res.text()
  if (!text) return []

  try {
    const payload = JSON.parse(text)
    return normalizeTrend(payload)
  } catch (err) {
    console.warn('[analyticsService] unable to parse JSON payload', err)
    return []
  }
}

export function getSignalTrend(range, partner) {
  return fetchTrend('/api/analytics/signal-volume', range, partner)
}

export function getCommentTrend(range, partner) {
  return fetchTrend('/api/analytics/comment-volume', range, partner)
}

export function getLatencyTrend(range, partner) {
  return fetchTrend('/api/analytics/latency', range, partner)
}

export function getErrorRateTrend(range, partner) {
  return fetchTrend('/api/analytics/error-rate', range, partner)
}


