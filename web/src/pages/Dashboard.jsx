import React, { useEffect, useMemo, useState } from 'react'
import AnalyticsTrends from '../components/Analytics/AnalyticsTrends.jsx'

const PARTNERS = ['Allmax', 'Adeeva', 'GIMA']
const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080'

const makeId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

function normalizeMetric(payload, fallback = 0) {
  if (payload == null) return fallback
  if (typeof payload === 'number') return payload
  if (typeof payload === 'object') {
    return (
      payload.value ??
      payload.count ??
      payload.total ??
      payload.metric ??
      fallback
    )
  }
  return fallback
}

function buildLogs(signalFeed = [], commentFeed = [], fallback = []) {
  const entries = []
  if (Array.isArray(signalFeed)) {
    entries.push(
      ...signalFeed.map((entry) => ({
        id: entry.id ?? entry.signalId ?? makeId(),
        ts: entry.ts ?? entry.timestamp ?? entry.createdAt ?? new Date().toISOString(),
        level: entry.level ?? 'info',
        message:
          entry.message ??
          (entry.user ? `Signal ingested for ${entry.user}` : entry.campaign ? `Signal routed to ${entry.campaign}` : 'Signal event'),
      })),
    )
  }
  if (Array.isArray(commentFeed)) {
    entries.push(
      ...commentFeed.map((entry) => ({
        id: `comment-${entry.id ?? makeId()}`,
        ts: entry.ts ?? entry.generatedAt ?? entry.createdAt ?? new Date().toISOString(),
        level: entry.status === 'approved' ? 'success' : entry.status === 'queued' ? 'info' : 'warn',
        message:
          entry.message ??
          (entry.preview ? `Comment generated: ${entry.preview}` : entry.persona ? `Comment update: ${entry.persona}` : 'Comment Engine event'),
      })),
    )
  }
  if (!entries.length) return fallback
  return entries.sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 8)
}

async function fetchJSON(path, params = {}, signal) {
  const url = new URL(path, API_BASE)
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) url.searchParams.set(key, value)
  })
  const res = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
    signal,
  })
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`)
  }
  const text = await res.text()
  if (!text) return null
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return JSON.parse(text)
  }
  return text
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

function exportFromSnapshot(section, partner, snapshotSection) {
  const data = Array.isArray(snapshotSection) ? snapshotSection : []
  if (!data.length) return
  const headers = Array.from(
    data.reduce((set, entry) => {
      Object.keys(entry).forEach((key) => set.add(key))
      return set
    }, new Set()),
  )
  const rows = data.map((entry) =>
    headers
      .map((key) => {
        const value = entry[key]
        return typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value ?? '')
      })
      .join(','),
  )
  const csv = [headers.join(','), ...rows].join('\n')
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${partner.toLowerCase()}-${section}-${new Date().toISOString()}.csv`)
}

const fallbackData = {
  Allmax: {
    metrics: { signals: 4821, comments: 1719, latencyMs: 182, errorRate: 0.8, activeCampaigns: 7, activePersonas: 14 },
    signals: [
      { id: 'sig-9821', user: '@liftlife', campaign: 'Black Friday Boost', partner: 'Allmax', ts: '2025-11-14T09:41:00Z', route: 'Conversion' },
      { id: 'sig-9818', user: '@coachjo', campaign: 'Macro Mentor', partner: 'Allmax', ts: '2025-11-14T09:20:00Z', route: 'Community' },
    ],
    comments: [
      { id: 'c-1001', persona: 'Allmax Coach', preview: 'Dialing in macros for winter cut…', status: 'approved', ts: '2025-11-14T09:40:00Z' },
      { id: 'c-1002', persona: 'Allmax Creator', preview: 'Stack tip: pump + hydration…', status: 'queued', ts: '2025-11-14T09:25:00Z' },
    ],
    personas: [
      { id: 'p001', name: 'Allmax Coach', tier: 'Ambassador', status: 'active' },
      { id: 'p002', name: 'Allmax Creator', tier: 'Creator', status: 'active' },
    ],
    creators: [
      { id: 'cr001', name: 'Maxopolis Motivator', platform: 'IG', status: 'live' },
      { id: 'cr002', name: 'Hypertrophy Hank', platform: 'TikTok', status: 'draft' },
    ],
    campaigns: [
      { id: 'camp-77', name: 'Black Friday Boost', ctr: 4.9, cvr: 2.1, spend: 18200 },
      { id: 'camp-72', name: 'Macro Mentor', ctr: 3.4, cvr: 1.5, spend: 9200 },
    ],
    logs: [
      { id: 'log-1', ts: '2025-11-14T09:45:00Z', message: 'Signal ingested for @liftlife', level: 'info' },
      { id: 'log-2', ts: '2025-11-14T09:32:00Z', message: 'Comment Engine deploy completed', level: 'success' },
    ],
  },
  Adeeva: {
    metrics: { signals: 1287, comments: 602, latencyMs: 244, errorRate: 1.6, activeCampaigns: 4, activePersonas: 9 },
    signals: [
      { id: 'sig-771', user: '@cliniciank', campaign: 'Gut Reset', partner: 'Adeeva', ts: '2025-11-14T08:14:00Z', route: 'Education' },
      { id: 'sig-766', user: '@biomebetty', campaign: 'Immune Health', partner: 'Adeeva', ts: '2025-11-14T07:56:00Z', route: 'Care' },
    ],
    comments: [
      { id: 'c-501', persona: 'Adeeva Clinician', preview: 'New journal data on…', status: 'review', ts: '2025-11-14T08:10:00Z' },
      { id: 'c-505', persona: 'Adeeva Coach', preview: 'Supplement pairing tip…', status: 'approved', ts: '2025-11-14T07:50:00Z' },
    ],
    personas: [
      { id: 'p101', name: 'Adeeva Clinician', tier: 'Pro', status: 'active' },
      { id: 'p102', name: 'Adeeva Care Team', tier: 'AI-Agent', status: 'draft' },
    ],
    creators: [
      { id: 'cr101', name: 'Dr. Rivera', platform: 'YouTube', status: 'live' },
      { id: 'cr102', name: 'Wellness Woven', platform: 'IG', status: 'paused' },
    ],
    campaigns: [
      { id: 'camp-31', name: 'Gut Reset', ctr: 3.1, cvr: 1.9, spend: 6400 },
      { id: 'camp-29', name: 'Immune Health', ctr: 2.4, cvr: 1.1, spend: 4100 },
    ],
    logs: [
      { id: 'log-10', ts: '2025-11-14T09:01:00Z', message: 'Persona sync staged for Adeeva Clinician', level: 'info' },
      { id: 'log-11', ts: '2025-11-14T08:42:00Z', message: 'Latency alert resolved (edge cluster 2)', level: 'success' },
    ],
  },
  GIMA: {
    metrics: { signals: 2140, comments: 885, latencyMs: 205, errorRate: 1.1, activeCampaigns: 5, activePersonas: 11 },
    signals: [
      { id: 'sig-501', user: '@learninglane', campaign: 'Exam Sprint', partner: 'GIMA', ts: '2025-11-14T05:33:00Z', route: 'Education' },
      { id: 'sig-498', user: '@mentormaya', campaign: 'STEM Pathways', partner: 'GIMA', ts: '2025-11-14T05:20:00Z', route: 'Guidance' },
    ],
    comments: [
      { id: 'c-301', persona: 'GIMA Tutor', preview: 'New study flow for finals…', status: 'approved', ts: '2025-11-14T05:25:00Z' },
      { id: 'c-302', persona: 'GIMA Mentor', preview: 'Scholarship reminder…', status: 'queued', ts: '2025-11-14T05:18:00Z' },
    ],
    personas: [
      { id: 'p201', name: 'GIMA Tutor', tier: 'AI-Agent', status: 'active' },
      { id: 'p202', name: 'GIMA Mentor', tier: 'Ambassador', status: 'inactive' },
    ],
    creators: [
      { id: 'cr201', name: 'STEM Squad', platform: 'YouTube', status: 'live' },
      { id: 'cr202', name: 'Campus Pulse', platform: 'IG', status: 'live' },
    ],
    campaigns: [
      { id: 'camp-51', name: 'Exam Sprint', ctr: 5.2, cvr: 2.7, spend: 15000 },
      { id: 'camp-49', name: 'STEM Pathways', ctr: 4.1, cvr: 2.0, spend: 10800 },
    ],
    logs: [
      { id: 'log-21', ts: '2025-11-14T06:10:00Z', message: 'Edge deploy completed for Comment Engine v2', level: 'success' },
      { id: 'log-22', ts: '2025-11-14T05:58:00Z', message: 'Signal replay request queued', level: 'warn' },
    ],
  },
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'signals', label: 'Signals' },
  { id: 'comments', label: 'Comment Engine' },
  { id: 'personas', label: 'Personas & Creators' },
  { id: 'campaigns', label: 'Campaign Performance' },
  { id: 'logs', label: 'Logs / Export' },
]

export default function Dashboard() {
  const [partner, setPartner] = useState('Allmax')
  const [snapshot, setSnapshot] = useState(fallbackData[partner])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError('')
      try {
        const query = { partner }
        const [
          signalVolume,
          commentVolume,
          latencyMetric,
          errorMetric,
          campaignPerformance,
          signalLogs,
          commentEngineLogs,
          personaList,
          creatorList,
        ] = await Promise.all([
          fetchJSON('/api/analytics/signal-volume', query, controller.signal),
          fetchJSON('/api/analytics/comment-volume', query, controller.signal),
          fetchJSON('/api/analytics/latency', query, controller.signal),
          fetchJSON('/api/analytics/error-rate', query, controller.signal),
          fetchJSON('/api/analytics/campaign-performance', query, controller.signal),
          fetchJSON('/api/logs/signals', query, controller.signal),
          fetchJSON('/api/logs/comment-engine', query, controller.signal),
          fetchJSON('/api/persona/list', query, controller.signal),
          fetchJSON('/api/creator/list', query, controller.signal),
        ])

        const fallback = fallbackData[partner]
        const personasSafe = Array.isArray(personaList) && personaList.length ? personaList : fallback.personas
        const creatorsSafe = Array.isArray(creatorList) && creatorList.length ? creatorList : fallback.creators
        const campaignsSafe = Array.isArray(campaignPerformance) && campaignPerformance.length ? campaignPerformance : fallback.campaigns
        const signalsSafe = Array.isArray(signalLogs) && signalLogs.length ? signalLogs : fallback.signals
        const commentsSafe = Array.isArray(commentEngineLogs) && commentEngineLogs.length ? commentEngineLogs : fallback.comments

        setSnapshot({
          metrics: {
            signals: normalizeMetric(signalVolume, fallback.metrics.signals),
            comments: normalizeMetric(commentVolume, fallback.metrics.comments),
            latencyMs: normalizeMetric(latencyMetric, fallback.metrics.latencyMs),
            errorRate: normalizeMetric(errorMetric, fallback.metrics.errorRate),
            activeCampaigns: campaignsSafe.length ?? fallback.metrics.activeCampaigns,
            activePersonas: personasSafe.filter((p) => p.status === 'active').length ?? fallback.metrics.activePersonas,
          },
          signals: signalsSafe,
          comments: commentsSafe,
          personas: personasSafe,
          creators: creatorsSafe,
          campaigns: campaignsSafe,
          logs: buildLogs(signalsSafe, commentsSafe, fallback.logs),
        })
      } catch (err) {
        console.warn('[dashboard] falling back to local data', err)
        setSnapshot(fallbackData[partner])
        setError('Live API unreachable – showing cached snapshot.')
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [partner])

  const statusSummary = useMemo(() => {
    const { metrics } = snapshot
    return [
      { label: 'Signals (24h)', value: metrics.signals.toLocaleString(), helper: 'ingested events' },
      { label: 'Comments Generated', value: metrics.comments.toLocaleString(), helper: 'Comment Engine output' },
      { label: 'Median Latency', value: `${metrics.latencyMs} ms`, helper: 'end-to-end' },
      { label: 'Error Rate', value: `${metrics.errorRate}%`, helper: 'last hour' },
      { label: 'Active Campaigns', value: metrics.activeCampaigns, helper: 'running' },
      { label: 'Active Personas', value: metrics.activePersonas, helper: 'ready to route' },
    ]
  }, [snapshot])

  async function exportCSV(section) {
    const entityMap = {
      signals: 'signals',
      comments: 'comment-engine',
      personas: 'personas',
      creators: 'creators',
      campaigns: 'campaigns',
      logs: 'logs',
    }
    const entity = entityMap[section] ?? section
    try {
      const params = new URLSearchParams({ partner, entity })
      const res = await fetch(`${API_BASE}/api/analytics/export/csv?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const blob = await res.blob()
      downloadBlob(blob, `${partner.toLowerCase()}-${entity}-${new Date().toISOString()}.csv`)
    } catch (err) {
      console.warn('[dashboard] export fallback', err)
      exportFromSnapshot(section, partner, snapshot[section])
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500">{loading ? 'Syncing…' : 'Staging Snapshot'}</p>
          <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
          <p className="text-gray-500">Telemetry, signals, campaigns and persona inventory per partner.</p>
          {error && <p className="mt-2 text-sm text-amber-600">{error}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {PARTNERS.map((p) => (
            <button
              key={p}
              onClick={() => setPartner(p)}
              className={`px-4 py-2 rounded-xl border text-sm font-medium ${partner === p ? 'bg-black text-white border-black' : 'bg-white text-gray-700 hover:border-gray-400'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      <nav className="flex flex-wrap gap-3 rounded-2xl border bg-white p-3 sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        {navItems.map((item) => (
          <a key={item.id} href={`#${item.id}`} className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-100">
            {item.label}
          </a>
        ))}
      </nav>

      <section id="dashboard" className="space-y-4">
        <div className="grid grid-rows-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {statusSummary.map((stat) => (
            <article key={stat.label} className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.helper}</p>
            </article>
          ))}
        </div>
        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <AnalyticsTrends />
        </div>
      </section>

      <section id="signals" className="rounded-3xl border bg-white p-5 space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Signals</h2>
            <p className="text-sm text-gray-500">Realtime routing feed</p>
          </div>
          <button className="text-sm text-gray-500 hover:text-black" onClick={() => exportCSV('signals')}>Export CSV</button>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b">
                <th className="py-2 pr-4">Signal</th>
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Campaign</th>
                <th className="py-2 pr-4">Partner</th>
                <th className="py-2 pr-4">Route</th>
                <th className="py-2 pr-4">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.signals.map((sig) => (
                <tr key={sig.id} className="border-b last:border-b-0">
                  <td className="py-3 pr-4 font-mono text-xs">{sig.id}</td>
                  <td className="py-3 pr-4">{sig.user}</td>
                  <td className="py-3 pr-4">{sig.campaign}</td>
                  <td className="py-3 pr-4">{sig.partner}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium">{sig.route}</span>
                  </td>
                  <td className="py-3 pr-4 text-xs text-gray-500">{new Date(sig.ts).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="comments" className="rounded-3xl border bg-white p-5 space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Comment Engine</h2>
            <p className="text-sm text-gray-500">Generated comments and routing status</p>
          </div>
          <button className="text-sm text-gray-500 hover:text-black" onClick={() => exportCSV('comments')}>Export CSV</button>
        </header>
        <div className="divide-y">
          {snapshot.comments.map((comment) => (
            <article key={comment.id} className="py-4 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold">{comment.persona}</p>
                <p className="text-sm text-gray-600">{comment.preview}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 font-mono">{comment.id}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  comment.status === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : comment.status === 'queued'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                }`}>
                  {comment.status}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="personas" className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border bg-white p-5">
          <header className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Personas</h2>
            <button className="text-sm text-gray-500 hover:text-black" onClick={() => exportCSV('personas')}>Export CSV</button>
          </header>
          <ul className="divide-y">
            {snapshot.personas.map((persona) => (
              <li key={persona.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{persona.name}</p>
                  <p className="text-sm text-gray-500">{persona.tier}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  persona.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {persona.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border bg-white p-5">
          <header className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Creators</h2>
            <button className="text-sm text-gray-500 hover:text-black" onClick={() => exportCSV('creators')}>Export CSV</button>
          </header>
          <ul className="divide-y">
            {snapshot.creators.map((creator) => (
              <li key={creator.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{creator.name}</p>
                  <p className="text-sm text-gray-500">{creator.platform}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  creator.status === 'live' ? 'bg-green-100 text-green-700' : creator.status === 'paused' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {creator.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="campaigns" className="rounded-3xl border bg-white p-5 space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Campaign Performance</h2>
            <p className="text-sm text-gray-500">CTR, conversion and spend</p>
          </div>
          <button className="text-sm text-gray-500 hover:text-black" onClick={() => exportCSV('campaigns')}>Export CSV</button>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b">
                <th className="py-2 pr-4">Campaign</th>
                <th className="py-2 pr-4">CTR</th>
                <th className="py-2 pr-4">CVR</th>
                <th className="py-2 pr-4">Spend</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b last:border-b-0">
                  <td className="py-3 pr-4">
                    <p className="font-semibold">{campaign.name}</p>
                    <p className="text-xs text-gray-500">{campaign.id}</p>
                  </td>
                  <td className="py-3 pr-4">{campaign.ctr}%</td>
                  <td className="py-3 pr-4">{campaign.cvr}%</td>
                  <td className="py-3 pr-4">${campaign.spend.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="logs" className="rounded-3xl border bg-white p-5 space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Logs / Export</h2>
            <p className="text-sm text-gray-500">Recent events and exports</p>
          </div>
          <div className="flex gap-2">
            <button className="text-sm text-gray-500 hover:text-black" onClick={() => exportCSV('logs')}>Export Logs</button>
            <button className="text-sm text-gray-500 hover:text-black" onClick={() => exportCSV('signals')}>Export Signals</button>
          </div>
        </header>
        <div className="space-y-3">
          {snapshot.logs.map((log) => (
            <article key={log.id} className="flex items-start gap-3 rounded-2xl border p-4 bg-gray-50">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                log.level === 'success' ? 'bg-green-200 text-green-900' : log.level === 'warn' ? 'bg-yellow-200 text-yellow-900' : 'bg-gray-200 text-gray-800'
              }`}>
                {log.level}
              </span>
              <div>
                <p className="text-sm font-mono text-gray-500">{new Date(log.ts).toLocaleString()}</p>
                <p className="text-sm">{log.message}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
