// server/src/routes/partnerHandles.ts
import { Router } from 'express';
import fs from 'fs';
import path from 'path';
const router = Router();
router.post('/import', (req, res) => {
    try {
        const payload = req.body;
        if (!Array.isArray(payload)) {
            return res.status(400).json({ ok: false, error: 'expecting an array of handles' });
        }
        const outDir = path.resolve(process.cwd(), 'partner-handles');
        if (!fs.existsSync(outDir))
            fs.mkdirSync(outDir, { recursive: true });
        // save file named by timestamp for simplicity
        const filename = `adeeva_handles_${Date.now()}.json`;
        const outPath = path.join(outDir, filename);
        fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
        return res.status(200).json({ ok: true, message: 'handles saved', path: `partner-handles/${filename}` });
    }
    catch (err) {
        console.error('HANDLE IMPORT ERROR', err);
        return res.status(500).json({ ok: false, error: String(err) });
    }
});
export default router;
