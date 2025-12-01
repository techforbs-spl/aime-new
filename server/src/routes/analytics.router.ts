import { Router } from 'express';
import { 
  summarizeEvents, 
  getGimaLeanProgramSummary, 
  type AnalyticsEvent 
} from './analytics';

const router = Router();

// GET /api/analytics/summary
router.get('/summary', (req, res) => {
  try {
    // In a real app, you would get events from a database
    const events: AnalyticsEvent[] = [];
    const summary = summarizeEvents(events);
    res.json({ ok: true, data: summary });
  } catch (err) {
    console.error('Error getting analytics summary:', err);
    res.status(500).json({ ok: false, error: 'Failed to get analytics summary' });
  }
});

// GET /api/analytics/gima-lean-program
router.get('/gima-lean-program', (req, res) => {
  try {
    // In a real app, you would get events from a database
    const events: AnalyticsEvent[] = [];
    const summary = getGimaLeanProgramSummary(events);
    res.json({ ok: true, data: summary });
  } catch (err) {
    console.error('Error getting GIMA lean program summary:', err);
    res.status(500).json({ ok: false, error: 'Failed to get GIMA lean program summary' });
  }
});

export default router;
