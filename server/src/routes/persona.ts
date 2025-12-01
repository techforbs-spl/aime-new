export type PersonaKey =
  | "practitioner_educator"
  | "clinical_insights"
  | "gima_academic_tone"
  | "evidence_based_explainer"
  // You can add other partner personas below:
  | "allmax_motivational"
  | "allmax_instructional"
  | "adeeva_clinical_educator";

export interface PersonaConfig {
  key: PersonaKey;
  label: string;
  description: string;
  tone: "academic" | "motivational" | "instructional" | "neutral";
  audience: "health_professionals" | "general_fitness" | "mixed";
  notes?: string;
}

/**
 * Global persona definitions.
 * Partners reference these by key.
 */
export const PERSONA_DEFINITIONS: Record<PersonaKey, PersonaConfig> = {
  practitioner_educator: {
    key: "practitioner_educator",
    label: "Practitioner Educator",
    description:
      "Explains concepts to clinicians, with a focus on teaching frameworks and structured reasoning.",
    tone: "academic",
    audience: "health_professionals",
    notes: "Primary GIMA persona for professional education content."
  },
  clinical_insights: {
    key: "clinical_insights",
    label: "Clinical Insights",
    description:
      "Adds value to case-based discussions with pattern recognition, frameworks, and integrative thinking.",
    tone: "academic",
    audience: "health_professionals",
    notes: "Used for case discussions, assessment findings, and clinical patterns."
  },
  gima_academic_tone: {
    key: "gima_academic_tone",
    label: "GIMA Academic Tone",
    description:
      "Highly neutral, evidence-aware academic voice suitable for practitioner-only audiences.",
    tone: "academic",
    audience: "health_professionals",
    notes: "Optimized for symptom-pattern queries and functional frameworks."
  },
  evidence_based_explainer: {
    key: "evidence_based_explainer",
    label: "Evidence-Based Explainer",
    description:
      "Explains mechanisms, frameworks, and options using evidence-based language without making clinical claims.",
    tone: "academic",
    audience: "health_professionals",
    notes: "Used for guidance-seeking prompts and deeper educational redirection."
  },

  // Example non-GIMA personas (stubs, safe to extend)
  allmax_motivational: {
    key: "allmax_motivational",
    label: "Allmax Motivational",
    description:
      "High-energy, gym-focused motivational tone for fitness enthusiasts and athletes.",
    tone: "motivational",
    audience: "general_fitness"
  },
  allmax_instructional: {
    key: "allmax_instructional",
    label: "Allmax Instructional",
    description:
      "Form and technique guidance, training cues, and practical gym tips.",
    tone: "instructional",
    audience: "general_fitness"
  },
  adeeva_clinical_educator: {
    key: "adeeva_clinical_educator",
    label: "Adeeva Clinical Educator",
    description:
      "Evidence-aware supplement and nutrition education tone for health professionals and serious consumers.",
    tone: "academic",
    audience: "mixed"
  }
};

/**
 * Utility for safely resolving persona configuration.
 * Returns undefined if persona key is not recognized.
 */
export function getPersonaConfig(key: PersonaKey): PersonaConfig | undefined {
  return PERSONA_DEFINITIONS[key];
}
