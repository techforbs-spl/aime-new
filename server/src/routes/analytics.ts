import { Router } from "express"; 
import { loadPartnerConfig } from "../services/partnerConfigLoader"; 

const router = Router(); 
router.get("/:partner/modes", (req, res) => { 
  try { 
    const { partner } = req.params; 
    const config = loadPartnerConfig(partner); 
    res.json(config.modes); 
  } catch (error: unknown) {
  const err = error as Error;
  console.error(err.message);
  res.status(500).json({ error: err.message });
}
}); 

router.get("/:partner/defaults", (req, res) => {
  try {
    const { partner } = req.params; 
    const config = loadPartnerConfig(partner); 
    res.json(config.defaults);
  } catch (error: unknown) {
  const err = error as Error;
  console.error(err.message);
  res.status(500).json({ error: err.message });
}
}); 

export default router;
