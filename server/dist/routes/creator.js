import { Router } from 'express';
import { getSnapshot } from '../data/snapshots.js';
const creatorRouter = Router();
creatorRouter.get('/list', (req, res) => {
    const snapshot = getSnapshot(req.query.partner);
    res.json(snapshot.creators);
});
export default creatorRouter;
