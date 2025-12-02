export type PartnerId = 'adeeva' | 'allmax' | 'gima';

export interface CommentLimits {
  maxDailyComments: number;
  maxCommentsPerUserPerDay: number;
  minSecondsBetweenComments: number;
}

export interface TrafficProfile {
  tier: 'low_volume' | 'mid_volume' | 'high_volume';
  expectedDailySignals: number;
  burstFactor: number;
  priority: number;
}

export interface FunnelConfig {
  enabled: boolean;
  primaryCta: string;
  secondaryCta?: string;
  trackingTag: string;
}

export interface Funnels {
  [key: string]: FunnelConfig;
}

export interface PersonaRoutingRule {
  id: string;
  match: {
    audience?: string[];
    platform?: string[];
    contentType?: string[];
    minReach?: number;
  };
  personaId: string;
}

export interface PersonaRoutingConfig {
  defaultPersonaId: string;
  priorityPersonas: string[];
  rules: PersonaRoutingRule[];
}

export interface FeatureFlags {
  adminOnly: boolean;
  enableMembers: boolean;
  enablePartners: boolean;
  enablePublicApi: boolean;
  enableAutoPublish: boolean;
  enableHighVolumeBurstMode?: boolean;
}

export interface TrackingConfig {
  partnerCode: string;
  utmSource: string;
  utmMedium: string;
  utmCampaignPrefix: string;
  analyticsBucket: string;
}

export interface GovernanceConfig {
  requiresClinicianDisclosure?: boolean;
  maxMedicalClaimsPerComment: number;
  requiresManualReview: boolean;
  sensitiveTopics: string[];
}

export interface PartnerConfig {
  partnerId: PartnerId;
  version: string;
  name: string;
  slug: string;
  brand: {
    primaryColor: string;
    secondaryColor: string;
    accentColor?: string;
    logoVariant?: string;
  };
  currency: string;
  locales: string[];
  commentLimits: CommentLimits;
  trafficProfile: TrafficProfile;
  funnels: Funnels;
  personaRouting: PersonaRoutingConfig;
  featureFlags: FeatureFlags;
  tracking: TrackingConfig;
  governance: GovernanceConfig;
}

// Some modules previously imported PartnerConfigSchema. To resolve that safely:
export type PartnerConfigSchema = PartnerConfig;

// -----------------------------------------------------------------------------
// Canonical Partner Configs (TS in-memory map)
// If you prefer JSON, mirror these structures in JSON and import them here.
// -----------------------------------------------------------------------------

const adeevaConfig: PartnerConfig = {
  partnerId: 'adeeva',
  version: '1',
  name: 'Adeeva',
  slug: 'adeeva',
  brand: {
    primaryColor: '#008C95',
    secondaryColor: '#00BCAF',
    accentColor: '#F4B400',
    logoVariant: 'adeeva-standard'
  },
  currency: 'CAD',
  locales: ['en-CA', 'en-US'],
  commentLimits: {
    maxDailyComments: 800,
    maxCommentsPerUserPerDay: 5,
    minSecondsBetweenComments: 60
  },
  trafficProfile: {
    tier: 'mid_volume',
    expectedDailySignals: 6000,
    burstFactor: 1.5,
    priority: 7
  },
  funnels: {
    practitionerProgram: {
      enabled: true,
      primaryCta: 'Join Practitioner Program',
      secondaryCta: 'Learn More',
      trackingTag: 'adeeva_practitioner'
    },
    supplementEducation: {
      enabled: true,
      primaryCta: 'View Product Details',
      trackingTag: 'adeeva_education'
    }
  },
  personaRouting: {
    defaultPersonaId: 'P-ADE-EDU',
    priorityPersonas: ['P-ADE-EDU', 'P-002'],
    rules: [
      {
        id: 'adeeva_practitioner_content',
        match: {
          audience: ['clinician', 'naturopath', 'nutritionist']
        },
        personaId: 'P-ADE-EDU'
      }
    ]
  },
  featureFlags: {
    adminOnly: true,
    enableMembers: false,
    enablePartners: false,
    enablePublicApi: false,
    enableAutoPublish: false
  },
  tracking: {
    partnerCode: 'ADEEVA',
    utmSource: 'aime',
    utmMedium: 'comment_engine',
    utmCampaignPrefix: 'adeeva_',
    analyticsBucket: 'adeeva-aime-events'
  },
  governance: {
    requiresClinicianDisclosure: true,
    maxMedicalClaimsPerComment: 0,
    requiresManualReview: true,
    sensitiveTopics: ['diagnosis', 'cure', 'treatment']
  }
};

const allmaxConfig: PartnerConfig = {
  partnerId: 'allmax',
  version: '2',
  name: 'ALLMAX Nutrition',
  slug: 'allmax',
  brand: {
    primaryColor: '#D0021B',
    secondaryColor: '#111111',
    accentColor: '#F5A623',
    logoVariant: 'allmax-standard'
  },
  currency: 'USD',
  locales: ['en-US', 'en-CA'],
  commentLimits: {
    maxDailyComments: 1500,
    maxCommentsPerUserPerDay: 8,
    minSecondsBetweenComments: 40
  },
  trafficProfile: {
    tier: 'high_volume',
    expectedDailySignals: 18000,
    burstFactor: 2.0,
    priority: 10
  },
  funnels: {
    ecommerce: {
      enabled: true,
      primaryCta: 'Shop Now',
      secondaryCta: 'View Stack',
      trackingTag: 'allmax_shop'
    },
    athleteContent: {
      enabled: true,
      primaryCta: 'Follow Athlete',
      trackingTag: 'allmax_athlete'
    }
  },
  personaRouting: {
    defaultPersonaId: 'P-001',
    priorityPersonas: ['P-001', 'P-002'],
    rules: [
      {
        id: 'allmax_gym_content',
        match: {
          audience: ['gym-goer', 'bodybuilder'],
          platform: ['instagram', 'tiktok']
        },
        personaId: 'P-001'
      }
    ]
  },
  featureFlags: {
    adminOnly: true,
    enableMembers: false,
    enablePartners: false,
    enablePublicApi: false,
    enableAutoPublish: false,
    enableHighVolumeBurstMode: true
  },
  tracking: {
    partnerCode: 'ALLMAX',
    utmSource: 'aime',
    utmMedium: 'comment_engine',
    utmCampaignPrefix: 'allmax_',
    analyticsBucket: 'allmax-aime-events'
  },
  governance: {
    maxMedicalClaimsPerComment: 0,
    requiresManualReview: true,
    sensitiveTopics: ['claims', 'results', 'before/after']
  }
};

const gimaConfigV4: PartnerConfig = {
  partnerId: 'gima',
  version: '4',
  name: 'Global Integrative Medicine Academy',
  slug: 'gima',
  brand: {
    primaryColor: '#005B9E',
    secondaryColor: '#00A6C7',
    accentColor: '#FFD166',
    logoVariant: 'gima-standard'
  },
  currency: 'USD',
  locales: ['en-US', 'en-CA'],
  commentLimits: {
    maxDailyComments: 2000,
    maxCommentsPerUserPerDay: 10,
    minSecondsBetweenComments: 45
  },
  trafficProfile: {
    tier: 'high_volume',
    expectedDailySignals: 25000,
    burstFactor: 2.5,
    priority: 9
  },
  funnels: {
    professionalCourses: {
      enabled: true,
      primaryCta: 'View Course Details',
      secondaryCta: 'Join Waitlist',
      trackingTag: 'gima_pro_course'
    },
    freeWebinars: {
      enabled: true,
      primaryCta: 'Reserve Your Seat',
      secondaryCta: 'View Speakers',
      trackingTag: 'gima_webinar'
    }
  },
  personaRouting: {
    defaultPersonaId: 'P-GIMA-EDU',
    priorityPersonas: ['P-GIMA-EDU', 'P-GIMA-COACH', 'P-002'],
    rules: [
      {
        id: 'gima_pro_clinicians',
        match: {
          audience: ['clinician', 'nurse', 'chiropractor'],
          platform: ['instagram', 'tiktok']
        },
        personaId: 'P-GIMA-EDU'
      },
      {
        id: 'gima_high_volume_reels',
        match: {
          contentType: ['reel', 'short'],
          minReach: 5000
        },
        personaId: 'P-GIMA-COACH'
      }
    ]
  },
  featureFlags: {
    adminOnly: true,
    enableMembers: false,
    enablePartners: false,
    enablePublicApi: false,
    enableAutoPublish: false,
    enableHighVolumeBurstMode: true
  },
  tracking: {
    partnerCode: 'GIMA',
    utmSource: 'aime',
    utmMedium: 'comment_engine',
    utmCampaignPrefix: 'gima_',
    analyticsBucket: 'gima-aime-events'
  },
  governance: {
    requiresClinicianDisclosure: true,
    maxMedicalClaimsPerComment: 0,
    requiresManualReview: true,
    sensitiveTopics: ['diagnosis', 'cure', 'treatment', 'prescription']
  }
};

export const PARTNER_CONFIGS: Record<PartnerId, PartnerConfig> = {
  adeeva: adeevaConfig,
  allmax: allmaxConfig,
  gima: gimaConfigV4
};

// Primary loader helpers
export function getPartnerConfig(id: PartnerId): PartnerConfig {
  const cfg = PARTNER_CONFIGS[id];
  if (!cfg) {
    throw new Error(`Unknown partnerId: ${id}`);
  }
  return cfg;
}

export function getAllPartnerConfigs(): PartnerConfig[] {
  return Object.values(PARTNER_CONFIGS);
}

// Default export for modules using default import style:
export default {
  PARTNER_CONFIGS,
  getPartnerConfig,
  getAllPartnerConfigs
};
