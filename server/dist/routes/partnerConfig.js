import { Router } from 'express';
import fs from 'fs';
import path from 'path';
export const partnerConfigRouter = Router();
partnerConfigRouter.post('/config/import', (req, res) => {
    try {
        const config = req.body;
        if (!config?.partner) {
            return res.status(400).json({ ok: false, error: 'Missing partner field' });
        }
        // Ensure partner-config folder exists
        const dir = path.resolve('partner-config');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        // Save files
        const outPath = path.join(dir, `${config.partner.toLowerCase()}.json`);
        fs.writeFileSync(outPath, JSON.stringify(config, null, 2));
        res.json({ ok: true, partner: config.partner, message: 'Partner config imported successfully' });
    }
    catch (err) {
        console.error('Error importing partner config:', err);
        res.status(500).json({ ok: false, error: err.message });
    }
});
