// server/src/routes/handles.ts
import { Router } from 'express';
import fs from 'fs';
import path from 'path';
const router = Router();
// POST /api/partner/handles/import
router.post('/import', (req, res) => {
    try {
        const payload = req.body;
        if (!payload)
            return res.status(400).json({ ok: false, error: 'missing payload' });
        // accepts either { handles: [...] } or an array directly
        const handles = Array.isArray(payload) ? payload : (payload.handles || payload);
        if (!Array.isArray(handles) || handles.length === 0)
            return res.status(400).json({ ok: false, error: 'no handles provided' });
        // ensure data directory exists
        const outDir = path.resolve(process.cwd(), 'data');
        if (!fs.existsSync(outDir))
            fs.mkdirSync(outDir, { recursive: true });
        const outPath = path.join(outDir, 'handles.json');
        fs.writeFileSync(outPath, JSON.stringify(handles, null, 2), 'utf8');
        // Optionally expose a quick in-memory map for runtime use.
        global.LOADED_HANDLES = handles;
        return res.status(200).json({ ok: true, message: 'handles imported', count: handles.length, path: outPath });
    }
    catch (err) {
        console.error('handles import error', err);
        return res.status(500).json({ ok: false, error: String(err) });
    }
});
export default router;
