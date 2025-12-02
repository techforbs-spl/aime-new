import { Router, Request, Response } from 'express';
import {
  getAllPartnerConfigs,
  PartnerConfig,
  PartnerId
} from '../services/partnerConfigLoader.js';

const router = Router();

/**
 * Analytics summary across all partners.
 * Fully supports GIMA V4 (high-volume settings).
 */
router.get('/partners/summary', (_req: Request, res: Response) => {
  try {
    const configs: PartnerConfig[] = getAllPartnerConfigs();

    const summary = configs.map(cfg => {
      const { partnerId, name, trafficProfile, commentLimits, featureFlags } = cfg;

      return {
        partnerId,
        name,
        trafficTier: trafficProfile.tier,
        expectedDailySignals: trafficProfile.expectedDailySignals,
        burstFactor: trafficProfile.burstFactor,
        maxDailyComments: commentLimits.maxDailyComments,
        adminOnly: featureFlags.adminOnly,
        enableMembers: featureFlags.enableMembers,
        enablePartners: featureFlags.enablePartners,
        version: cfg.version
      };
    });

    return res.json({
      count: summary.length,
      partners: summary
    });

  } catch (err: any) {
    return res.status(500).json({
      error: 'Analytics summary failed',
      detail: err?.message
    });
  }
});

/**
 * Detailed analytics for a single partner ID
 */
router.get('/partner/:id/detail', (req: Request, res: Response) => {
  try {
    const partnerId = req.params.id as PartnerId;

    const cfg = getAllPartnerConfigs().find((c: PartnerConfig) => c.partnerId === partnerId);

    if (!cfg) {
      return res.status(404).json({ error: `Unknown partner ID: ${partnerId}` });
    }

    return res.json({
      partnerId: cfg.partnerId,
      name: cfg.name,
      funnels: cfg.funnels,
      personaRouting: cfg.personaRouting,
      traffic: cfg.trafficProfile,
      flags: cfg.featureFlags,
      governance: cfg.governance
    });

  } catch (err: any) {
    return res.status(500).json({
      error: 'Analytics detail failed',
      detail: err?.message
    });
  }
});

export default router;
