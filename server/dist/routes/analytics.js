import { Router } from 'express';
import { getSnapshot } from '../data/snapshots.js';
const analyticsRouter = Router();
function metricResponse(snapshot, key) {
    return {
        partner: snapshot.partner,
        value: snapshot.metrics[key],
        updatedAt: new Date().toISOString(),
    };
}
analyticsRouter.get('/signal-volume', (req, res) => {
    const snapshot = getSnapshot(req.query.partner);
    res.json(metricResponse(snapshot, 'signals'));
});
analyticsRouter.get('/comment-volume', (req, res) => {
    const snapshot = getSnapshot(req.query.partner);
    res.json(metricResponse(snapshot, 'comments'));
});
analyticsRouter.get('/latency', (req, res) => {
    const snapshot = getSnapshot(req.query.partner);
    res.json(metricResponse(snapshot, 'latencyMs'));
});
analyticsRouter.get('/error-rate', (req, res) => {
    const snapshot = getSnapshot(req.query.partner);
    res.json(metricResponse(snapshot, 'errorRate'));
});
analyticsRouter.get('/campaign-performance', (req, res) => {
    const snapshot = getSnapshot(req.query.partner);
    res.json(snapshot.campaigns);
});
analyticsRouter.get('/export/csv', (req, res) => {
    const snapshot = getSnapshot(req.query.partner);
    const entity = (req.query.entity ?? 'signals').toLowerCase();
    const map = {
        signals: snapshot.signals,
        'comment-engine': snapshot.comments,
        personas: snapshot.personas,
        creators: snapshot.creators,
        campaigns: snapshot.campaigns,
        logs: snapshot.logs,
    };
    const data = map[entity] ?? snapshot.signals;
    if (!Array.isArray(data) || data.length === 0) {
        return res.status(204).end();
    }
    const headers = Array.from(data.reduce((set, entry) => {
        Object.keys(entry).forEach((key) => set.add(key));
        return set;
    }, new Set()));
    const rows = data.map((entry) => headers
        .map((key) => {
        const value = entry[key];
        return typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value ?? '');
    })
        .join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${snapshot.partner.toLowerCase()}-${entity}.csv"`);
    res.send(csv);
});
export default analyticsRouter;
