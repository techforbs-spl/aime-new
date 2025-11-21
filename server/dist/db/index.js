import { join } from 'path';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
const DB_DIR = join(process.cwd(), 'data');
const DB_FILE = join(DB_DIR, 'campaigns.json');
// Initialize database file if it doesn't exist
function initDb() {
    if (!existsSync(DB_DIR)) {
        mkdirSync(DB_DIR, { recursive: true });
    }
    if (!existsSync(DB_FILE)) {
        writeFileSync(DB_FILE, JSON.stringify({ campaigns: [], activations: [] }, null, 2), 'utf8');
    }
}
// Read database
function readDb() {
    try {
        const data = readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    }
    catch (error) {
        console.error('Error reading database:', error);
        throw new Error('Failed to read database');
    }
}
// Write to database
function writeDb(data) {
    try {
        writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    }
    catch (error) {
        console.error('Error writing to database:', error);
        throw new Error('Failed to update database');
    }
}
export const db = {
    // Initialize database
    init: initDb,
    // Add a new campaign activation
    async activateCampaign(partner, campaignId, handles) {
        const db = readDb();
        const activation = {
            partner,
            campaignId,
            handles: handles.map(h => ({
                creator_handle: h.creator_handle,
                campaign_id: h.campaign_id,
                assigned_cluster: h.assigned_cluster,
                comment_profile: h.comment_profile,
                status: h.status || 'active'
            })),
            activatedAt: new Date().toISOString(),
            status: 'active'
        };
        // Remove any existing activations for this partner/campaign
        db.activations = db.activations.filter((a) => !(a.partner === partner && a.campaignId === campaignId));
        db.activations.push(activation);
        writeDb(db);
        return activation;
    },
    // Get all activations for a partner
    async getActivations(partner) {
        const db = readDb();
        return db.activations.filter((a) => a.partner === partner);
    },
    // Get a specific activation
    async getActivation(partner, campaignId) {
        const db = readDb();
        return db.activations.find((a) => a.partner === partner && a.campaignId === campaignId) || null;
    },
    // Update activation status
    async updateActivationStatus(partner, campaignId, status) {
        const db = readDb();
        const activation = db.activations.find((a) => a.partner === partner && a.campaignId === campaignId);
        if (activation) {
            activation.status = status;
            writeDb(db);
            return activation;
        }
        return null;
    }
};
// Initialize database on module load
initDb();
