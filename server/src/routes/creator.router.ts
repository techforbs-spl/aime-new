import { Router } from 'express';
import { 
  getCreatorById, 
  listCreators, 
  upsertCreator, 
  assignCreatorToGima,
  type CreatorProfile
} from './creator';

const router = Router();

// GET /api/creators
router.get('/', (req, res) => {
  try {
    const creators = listCreators();
    res.json({ ok: true, data: creators });
  } catch (err) {
    console.error('Error listing creators:', err);
    res.status(500).json({ ok: false, error: 'Failed to list creators' });
  }
});

// GET /api/creators/:id
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const creator = getCreatorById(id);
    
    if (!creator) {
      return res.status(404).json({ 
        ok: false, 
        error: `Creator with ID '${id}' not found` 
      });
    }
    
    res.json({ ok: true, data: creator });
  } catch (err) {
    console.error('Error getting creator:', err);
    res.status(500).json({ ok: false, error: 'Failed to get creator' });
  }
});

// POST /api/creators
router.post('/', (req, res) => {
  try {
    const creatorData: CreatorProfile = req.body;
    upsertCreator(creatorData);
    res.status(201).json({ ok: true, data: creatorData });
  } catch (err) {
    console.error('Error creating/updating creator:', err);
    res.status(500).json({ ok: false, error: 'Failed to create/update creator' });
  }
});

// POST /api/creators/assign-gima
router.post('/assign-gima', (req, res) => {
  try {
    const { creatorId, handle, platform, defaultPersona } = req.body;
    
    if (!creatorId || !handle || !platform) {
      return res.status(400).json({ 
        ok: false, 
        error: 'creatorId, handle, and platform are required' 
      });
    }
    
    const creator = assignCreatorToGima(
      creatorId, 
      handle, 
      platform, 
      defaultPersona
    );
    
    res.status(201).json({ ok: true, data: creator });
  } catch (err) {
    console.error('Error assigning creator to GIMA:', err);
    res.status(500).json({ ok: false, error: 'Failed to assign creator to GIMA' });
  }
});

export default router;
