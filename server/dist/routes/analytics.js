import { Router } from 'express';
import { listPartnerConfigs } from '../services/partnerConfigLoader';
const router = Router();
// GET /analytics/health
router.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        mode: 'synthetic',
        sprint: '2'
    });
});
// GET /analytics/trend
router.get('/trend', (_req, res) => {
    try {
        const today = new Date();
        const data = [];
        // simple 7-day mock trend
        for (let i = 6; i >= 0; i -= 1) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const impressions = 1000 + i * 120;
            const clicks = 80 + i * 10;
            data.push({
                date: d.toISOString().split('T')[0],
                impressions,
                clicks,
                ctr: +(clicks / impressions * 100).toFixed(2)
            });
        }
        res.json({
            mode: 'synthetic',
            points: data
        });
    }
    catch (error) {
        const err = error;
        // eslint-disable-next-line no-console
        console.error('Trend analytics error:', err.message);
        res.status(500).json({ error: 'Failed to generate trend analytics' });
    }
});
// GET /analytics/partners
router.get('/partners', (_req, res) => {
    try {
        const configs = listPartnerConfigs();
        res.json(configs);
    }
    catch (error) {
        const err = error;
        // eslint-disable-next-line no-console
        console.error('Partner analytics error:', err.message);
        res.status(500).json({ error: 'Failed to load partner configs' });
    }
});
// GET /analytics/export
router.get('/export', (_req, res) => {
    // Sprint-2: CSV only, PNG/JSON deferred
    const csv = [
        'date,impressions,clicks,ctr',
        '2025-11-01,1000,80,8.0',
        '2025-11-02,1200,96,8.0',
        '2025-11-03,1400,112,8.0'
    ].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="aime_analytics_sample.csv"');
    res.send(csv);
});
export default router;
