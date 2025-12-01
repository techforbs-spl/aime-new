import path from 'path';
import fs from 'fs';

// This should match the structure in gima_partner_config_v4.json
export interface PartnerConfig {
  partner_id: string;
  display_name: string;
  version?: number;
  [key: string]: any; // Allow for other properties in the config
}

let partnerConfigs: PartnerConfig[] = [];

// Load all partner configs from the configs/partners directory
export function loadPartnerConfigs(): void {
  try {
    const configDir = path.join(process.cwd(), '..', 'configs', 'partners');
    
    // Read all partner directories
    const partnerDirs = fs.readdirSync(configDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    const configs: PartnerConfig[] = [];

    for (const partnerDir of partnerDirs) {
      const partnerPath = path.join(configDir, partnerDir);
      const files = fs.readdirSync(partnerPath);
      
      // Find the latest version config file (e.g., gima_partner_config_v4.json)
      const configFile = files
        .filter(f => f.endsWith('.json') && f.startsWith(partnerDir))
        .sort()
        .pop();

      if (configFile) {
        const configPath = path.join(partnerPath, configFile);
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        configs.push({
          ...configData,
          partner_id: partnerDir, // Ensure partner_id is set
          _configPath: configPath // Store path for debugging
        } as PartnerConfig);
      }
    }

    partnerConfigs = configs;
  } catch (error) {
    console.error('Error loading partner configs:', error);
    partnerConfigs = [];
  }
}

// Get a specific partner's config by ID
export function getPartnerConfig(partnerId: string): PartnerConfig | undefined {
  return partnerConfigs.find(config => config.partner_id === partnerId);
}

// Get all partner configs
export function getAllPartnerConfigs(): PartnerConfig[] {
  return [...partnerConfigs];
}

// Initialize the configs when this module is loaded
loadPartnerConfigs();
