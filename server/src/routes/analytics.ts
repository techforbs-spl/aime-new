import { Router } from "express"; 
import { loadPartnerConfig } from "../services/partnerConfigLoader"; 

const router = Router(); 
router.get("/:partner/modes", (req, res) => { 
  try { 
    const { partner } = req.params; 
    const config = loadPartnerConfig(partner); 
    res.json(config.modes); 
  } catch (error) { 
    res.status(400).json({ error: error.message }); 
  } 
}); 

router.get("/:partner/defaults", (req, res) => {
  try {
    const { partner } = req.params; 
    const config = loadPartnerConfig(partner); 
    res.json(config.defaults);
  } catch (error) { 
    res.status(400).json({ error: error.message }); 
  }
}); 

export default router;
