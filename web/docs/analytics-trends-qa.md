# Analytics Trends QA & API Checks

## Setup

- Install chart dependency: `cd web && npm install recharts`
- Ensure `VITE_API_BASE` is configured (defaults to same origin)

## Example cURL Commands

```bash
curl -X GET "$VITE_API_BASE/api/analytics/signal-volume?range=7d&partner=Allmax"
```

```bash
curl -X GET "$VITE_API_BASE/api/analytics/comment-volume?range=7d&partner=Adeeva"
```

```bash
curl -X GET "$VITE_API_BASE/api/analytics/latency?range=24h&partner=GIMA"
```

```bash
curl -X GET "$VITE_API_BASE/api/analytics/error-rate?range=30d&partner=Allmax"
```

### Sample Response

```json
{
  "trend": [
    { "timestamp": "2025-11-18T08:00:00Z", "value": 4120 },
    { "timestamp": "2025-11-18T14:00:00Z", "value": 3984 },
    { "timestamp": "2025-11-18T20:00:00Z", "value": 4330 }
  ]
}
```

If an endpoint returns `404`, the UI automatically switches to demo trend data so charts still render.

## QA Checklist

- Charts render all four panels without console errors
- Partner dropdown (Allmax/Adeeva/GIMA) updates the plotted data
- Time-range buttons (24h/7d/30d) request and display the correct window
- Latency chart shows the orange 1000 ms threshold line
- Simulated API failure (network offline or 500) surfaces “Unable to load trend data” state


