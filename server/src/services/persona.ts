import { loadPartnerConfig } from "./partnerConfigLoader";

export interface PersonaProfile { 
  id: string; 
  attributes: Record<string, any>;
}

export const generatePersonas = (partner: string): PersonaProfile[] => { 
  const config = loadPartnerConfig(partner); 
  const count = config.defaults.personaCount; 
  return Array.from({ length: count }).map((_, i) => ({ 
    id: `persona_${i + 1}`, 
    attributes: { 
      expertise: "healthcare", 
      tier: config.defaults.mode, 
      partner 
    } 
  })); 
};
