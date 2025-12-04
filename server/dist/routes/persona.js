import { Router } from 'express';
const router = Router();
const personas = [
    {
        id: 'gima-educator',
        label: 'GIMA Educator',
        description: 'Health professional–facing, evidence-based educational tone.',
        partnerSlug: 'gima'
    },
    {
        id: 'adeeva-clinical-support',
        label: 'Adeeva Clinical Support',
        description: 'Clinically oriented, supplement-aware support persona.',
        partnerSlug: 'adeeva'
    }
];
router.get('/', (_req, res) => {
    res.json(personas);
});
router.get('/:id', (req, res) => {
    const persona = personas.find(p => p.id === req.params.id);
    if (!persona) {
        return res.status(404).json({ error: 'Persona not found' });
    }
    return res.json(persona);
});
export default router;
