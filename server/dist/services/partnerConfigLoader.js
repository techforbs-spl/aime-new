import path from 'path';
import fs from 'fs';
const CONFIG_DIR = path.join(__dirname, '..', 'config', 'partnerConfigs');
function readJsonConfig(fileName) {
    const fullPath = path.join(CONFIG_DIR, fileName);
    const raw = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(raw);
}
export function loadPartnerConfigBySlug(slug) {
    switch (slug) {
        case 'allmax':
            return readJsonConfig('allmax_partner_config_v1.json');
        case 'adeeva':
            return readJsonConfig('adeeva_partner_config_v1.json');
        case 'gima':
            // canonical merged config for Sprint-2
            return readJsonConfig('gima_partner_config_v4.json');
        default:
            throw new Error(`Unknown partner slug: ${slug}`);
    }
}
export function listPartnerConfigs() {
    return ['allmax', 'adeeva', 'gima'].map(loadPartnerConfigBySlug);
}
