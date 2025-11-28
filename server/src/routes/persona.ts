import { Router, Request, Response } from 'express';
import { getPartnerConfig } from '../services/partnerConfigLoader';

const personaRouter = Router();

// GET /api/persona/list?partner=PARTNER_ID
personaRouter.get('/list', (req: Request, res: Response) => {
  const partnerId = (req.query.partner as string) || '';

  if (!partnerId) {
    return res.status(400).json({ error: 'Missing partner query parameter' });
  }

  const config = getPartnerConfig(partnerId);
  if (!config) {
    return res.status(404).json({ error: `Partner not found: ${partnerId}` });
  }

  res.json({
    partner: config.id,
    personas: config.personas || []
  });
});

export default personaRouter;











