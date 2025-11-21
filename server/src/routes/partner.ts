// server/src/routes/partner.ts
import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

/**
 * POST /api/partner/config/import
 * Accepts partner config JSON in the body and saves it to server/partner-config/<partner_id>.json
 */
router.post('/config/import', async (req, res) => {
  try {
    const config = req.body;
    if (!config || !config.partner_id) {
      return res.status(400).json({ ok: false, error: 'missing partner_id in payload' });
    }

    // ensure directory exists
    const outDir = path.resolve(process.cwd(), 'partner-config');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const outPath = path.join(outDir, `${config.partner_id}.json`);
    fs.writeFileSync(outPath, JSON.stringify(config, null, 2), 'utf8');

    return res.status(200).json({ ok: true, message: 'partner config imported', partner_id: config.partner_id });
  } catch (err) {
    console.error('IMPORT ERROR', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

export default router;
