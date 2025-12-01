import { Router } from 'express';
import { 
  PERSONA_DEFINITIONS, 
  getPersonaConfig, 
  type PersonaKey 
} from './persona';

const router = Router();

// GET /api/personas
router.get('/', (req, res) => {
  try {
    res.json({ ok: true, data: Object.values(PERSONA_DEFINITIONS) });
  } catch (err) {
    console.error('Error getting personas:', err);
    res.status(500).json({ ok: false, error: 'Failed to get personas' });
  }
});

// GET /api/personas/:personaKey
router.get('/:personaKey', (req, res) => {
  try {
    const { personaKey } = req.params;
    const persona = getPersonaConfig(personaKey as PersonaKey);
    
    if (!persona) {
      return res.status(404).json({ 
        ok: false, 
        error: `Persona '${personaKey}' not found` 
      });
    }
    
    res.json({ ok: true, data: persona });
  } catch (err) {
    console.error('Error getting persona:', err);
    res.status(500).json({ ok: false, error: 'Failed to get persona' });
  }
});

export default router;
