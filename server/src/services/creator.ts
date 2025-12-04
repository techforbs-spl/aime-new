import { loadPartnerConfig } from "./partnerConfigLoader"; 

export interface CreatorProfile { 
  id: string; 
  partner: string; 
  tier: string; 
} 

export const generateCreators = (partner: string): CreatorProfile[] => { 
  const config = loadPartnerConfig(partner); 
  const count = config.defaults.creatorCount; 
  return Array.from({ length: count }).map((_, i) => ({ id: `creator_${i + 1}`, partner, tier: config.defaults.mode })); 
};
