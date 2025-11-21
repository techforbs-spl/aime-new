const BASE_SNAPSHOTS = {
    allmax: {
        metrics: { signals: 4821, comments: 1719, latencyMs: 182, errorRate: 0.8, activeCampaigns: 7, activePersonas: 14 },
        signals: [
            { id: 'sig-9821', user: '@liftlife', campaign: 'Black Friday Boost', partner: 'Allmax', ts: '2025-11-14T09:41:00Z', route: 'Conversion' },
            { id: 'sig-9818', user: '@coachjo', campaign: 'Macro Mentor', partner: 'Allmax', ts: '2025-11-14T09:20:00Z', route: 'Community' },
        ],
        comments: [
            { id: 'c-1001', persona: 'Allmax Coach', preview: 'Dialing in macros for winter cut…', status: 'approved', ts: '2025-11-14T09:40:00Z' },
            { id: 'c-1002', persona: 'Allmax Creator', preview: 'Stack tip: pump + hydration…', status: 'queued', ts: '2025-11-14T09:25:00Z' },
        ],
        personas: [
            { id: 'p001', name: 'Allmax Coach', tier: 'Ambassador', status: 'active' },
            { id: 'p002', name: 'Allmax Creator', tier: 'Creator', status: 'active' },
        ],
        creators: [
            { id: 'cr001', name: 'Maxopolis Motivator', platform: 'IG', status: 'live' },
            { id: 'cr002', name: 'Hypertrophy Hank', platform: 'TikTok', status: 'draft' },
        ],
        campaigns: [
            { id: 'camp-77', name: 'Black Friday Boost', ctr: 4.9, cvr: 2.1, spend: 18200 },
            { id: 'camp-72', name: 'Macro Mentor', ctr: 3.4, cvr: 1.5, spend: 9200 },
        ],
        logs: [
            { id: 'log-1', ts: '2025-11-14T09:45:00Z', message: 'Signal ingested for @liftlife', level: 'info' },
            { id: 'log-2', ts: '2025-11-14T09:32:00Z', message: 'Comment Engine deploy completed', level: 'success' },
        ],
    },
    adeeva: {
        metrics: { signals: 1287, comments: 602, latencyMs: 244, errorRate: 1.6, activeCampaigns: 4, activePersonas: 9 },
        signals: [
            { id: 'sig-771', user: '@cliniciank', campaign: 'Gut Reset', partner: 'Adeeva', ts: '2025-11-14T08:14:00Z', route: 'Education' },
            { id: 'sig-766', user: '@biomebetty', campaign: 'Immune Health', partner: 'Adeeva', ts: '2025-11-14T07:56:00Z', route: 'Care' },
        ],
        comments: [
            { id: 'c-501', persona: 'Adeeva Clinician', preview: 'New journal data on…', status: 'review', ts: '2025-11-14T08:10:00Z' },
            { id: 'c-505', persona: 'Adeeva Coach', preview: 'Supplement pairing tip…', status: 'approved', ts: '2025-11-14T07:50:00Z' },
        ],
        personas: [
            { id: 'p101', name: 'Adeeva Clinician', tier: 'Pro', status: 'active' },
            { id: 'p102', name: 'Adeeva Care Team', tier: 'AI-Agent', status: 'draft' },
        ],
        creators: [
            { id: 'cr101', name: 'Dr. Rivera', platform: 'YouTube', status: 'live' },
            { id: 'cr102', name: 'Wellness Woven', platform: 'IG', status: 'paused' },
        ],
        campaigns: [
            { id: 'camp-31', name: 'Gut Reset', ctr: 3.1, cvr: 1.9, spend: 6400 },
            { id: 'camp-29', name: 'Immune Health', ctr: 2.4, cvr: 1.1, spend: 4100 },
        ],
        logs: [
            { id: 'log-10', ts: '2025-11-14T09:01:00Z', message: 'Persona sync staged for Adeeva Clinician', level: 'info' },
            { id: 'log-11', ts: '2025-11-14T08:42:00Z', message: 'Latency alert resolved (edge cluster 2)', level: 'success' },
        ],
    },
    gima: {
        metrics: { signals: 2140, comments: 885, latencyMs: 205, errorRate: 1.1, activeCampaigns: 5, activePersonas: 11 },
        signals: [
            { id: 'sig-501', user: '@learninglane', campaign: 'Exam Sprint', partner: 'GIMA', ts: '2025-11-14T05:33:00Z', route: 'Education' },
            { id: 'sig-498', user: '@mentormaya', campaign: 'STEM Pathways', partner: 'GIMA', ts: '2025-11-14T05:20:00Z', route: 'Guidance' },
        ],
        comments: [
            { id: 'c-301', persona: 'GIMA Tutor', preview: 'New study flow for finals…', status: 'approved', ts: '2025-11-14T05:25:00Z' },
            { id: 'c-302', persona: 'GIMA Mentor', preview: 'Scholarship reminder…', status: 'queued', ts: '2025-11-14T05:18:00Z' },
        ],
        personas: [
            { id: 'p201', name: 'GIMA Tutor', tier: 'AI-Agent', status: 'active' },
            { id: 'p202', name: 'GIMA Mentor', tier: 'Ambassador', status: 'inactive' },
        ],
        creators: [
            { id: 'cr201', name: 'STEM Squad', platform: 'YouTube', status: 'live' },
            { id: 'cr202', name: 'Campus Pulse', platform: 'IG', status: 'live' },
        ],
        campaigns: [
            { id: 'camp-51', name: 'Exam Sprint', ctr: 5.2, cvr: 2.7, spend: 15000 },
            { id: 'camp-49', name: 'STEM Pathways', ctr: 4.1, cvr: 2.0, spend: 10800 },
        ],
        logs: [
            { id: 'log-21', ts: '2025-11-14T06:10:00Z', message: 'Edge deploy completed for Comment Engine v2', level: 'success' },
            { id: 'log-22', ts: '2025-11-14T05:58:00Z', message: 'Signal replay request queued', level: 'warn' },
        ],
    },
};
export function getSnapshot(partnerParam) {
    const key = (partnerParam ?? 'allmax').toLowerCase();
    const snapshot = BASE_SNAPSHOTS[key] ?? BASE_SNAPSHOTS.allmax;
    return { ...snapshot, partner: (partnerParam ?? 'Allmax') };
}
