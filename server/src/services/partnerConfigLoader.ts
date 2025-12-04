import fs from "fs";
import path from "path";

export interface PartnerConfig { 
  partner: string; 
  version: string; 
  modes: any; 
  defaults: any; 
}

export class PartnerConfigLoader {
  private static cache: Record<string, PartnerConfig> = {};
  static loadConfig(partner: string): PartnerConfig {
    if (this.cache[partner]) return this.cache[partner];
    const file = `${partner.toLowerCase()}_partner_config_v4.json`;
    const filePath = path.join(__dirname, "../configs", file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Config not found for partner: ${partner} at ${filePath}`);
    }
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as PartnerConfig;
    this.cache[partner] = data;
    return data;
  }
  static getModes(partner: string) { return this.loadConfig(partner).modes; }
  static getDefaultMode(partner: string) { return this.loadConfig(partner).defaults.mode; }
} 

export const loadPartnerConfig = (partner: string) => { 
  return PartnerConfigLoader.loadConfig(partner); 
};
