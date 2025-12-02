import { Router, Request, Response } from 'express';
import {
  getPartnerConfig,
  PartnerId,
  PartnerConfig
} from '../services/partnerConfigLoader';

const router = Router();

/**
 * Creator recommendation system:
 * Uses personaRouting rules + high-volume considerations
 * Benefit: GIMA V4 high-volume profile fully supported
 */
router.post('/recommend', (req: Request, res: Response) => {
  try {
    const partnerId = (req.body.partnerId as PartnerId) || 'allmax';
    const signal = req.body.signal || {};

    const config: PartnerConfig = getPartnerConfig(partnerId);

    const { personaRouting, trafficProfile } = config;

    const { audience, platform, contentType, reach } = signal;

    // 1. High-volume override (GIMA / Allmax)
    if (trafficProfile.tier === 'high_volume' && reach && reach > 10000) {
      const hvPersona = personaRouting.priorityPersonas[0];
      return res.json({
        personaId: hvPersona,
        reason: 'High-volume priority override'
      });
    }

    // 2. Standard persona routing
    for (const rule of personaRouting.rules) {
      let ok = true;

      if (rule.match.audience && audience && !rule.match.audience.includes(audience)) ok = false;
      if (rule.match.platform && platform && !rule.match.platform.includes(platform)) ok = false;
      if (rule.match.contentType && contentType && !rule.match.contentType.includes(contentType)) ok = false;
      if (rule.match.minReach && reach && reach < rule.match.minReach) ok = false;

      if (ok) {
        return res.json({
          personaId: rule.personaId,
          reason: rule.id
        });
      }
    }

    // 3. Fallback
    const fallback = personaRouting.defaultPersonaId;

    return res.json({
      personaId: fallback,
      reason: 'Default fallback'
    });

  } catch (err: any) {
    return res.status(500).json({
      error: 'Creator recommendation failed',
      detail: err?.message
    });
  }
});

export default router;
