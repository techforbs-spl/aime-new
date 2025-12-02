import { Router, Request, Response } from 'express';
import {
  getPartnerConfig,
  PartnerId,
  PartnerConfig
} from '../services/partnerConfigLoader';

const router = Router();

/**
 * Match a persona based on:
 * - partner personaRouting.priorityPersonas
 * - partner personaRouting.rules
 * - defaultPersonaId fallback
 */
router.get('/match', (req: Request, res: Response) => {
  try {
    const partnerId = (req.query.partnerId as PartnerId) || 'allmax';

    const config: PartnerConfig = getPartnerConfig(partnerId);

    const {
      defaultPersonaId,
      priorityPersonas,
      rules
    } = config.personaRouting;

    // Extract matching context from query
    const audience = req.query.audience as string | undefined;
    const platform = req.query.platform as string | undefined;
    const contentType = req.query.contentType as string | undefined;
    const reach = req.query.reach ? Number(req.query.reach) : undefined;

    // 1. Check rule-based match
    for (const rule of rules) {
      const match = rule.match;

      let ok = true;

      if (match.audience && audience && !match.audience.includes(audience)) {
        ok = false;
      }

      if (match.platform && platform && !match.platform.includes(platform)) {
        ok = false;
      }

      if (match.contentType && contentType && !match.contentType.includes(contentType)) {
        ok = false;
      }

      if (match.minReach && reach !== undefined && reach < match.minReach) {
        ok = false;
      }

      if (ok) {
        return res.json({
          personaId: rule.personaId,
          matchedBy: rule.id,
          fallback: false
        });
      }
    }

    // 2. Priority persona fallback
    if (priorityPersonas && priorityPersonas.length > 0) {
      return res.json({
        personaId: priorityPersonas[0],
        matchedBy: 'priorityPersona',
        fallback: true
      });
    }

    // 3. Default fallback
    return res.json({
      personaId: defaultPersonaId,
      matchedBy: 'defaultPersona',
      fallback: true
    });

  } catch (err: any) {
    return res.status(500).json({
      error: 'Persona match failed',
      detail: err?.message
    });
  }
});

export default router;
