import { Router } from 'express';
import { getSnapshot } from '../data/snapshots.js';
const personaRouter = Router();
personaRouter.get('/list', (req, res) => {
    const snapshot = getSnapshot(req.query.partner);
    res.json(snapshot.personas);
});
export default personaRouter;
