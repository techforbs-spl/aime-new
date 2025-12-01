import type { PersonaKey } from "./persona";

export type PartnerId = "allmax" | "adeeva" | "gima";

export interface CreatorProfile {
  id: string; // platform-specific handle or internal ID
  handle: string; // e.g. @dr_smith
  platform: "tiktok" | "instagram" | "youtube" | "other";
  partnerId?: PartnerId; // which partner this creator is most aligned with (optional)
  defaultPersona?: PersonaKey; // default persona for comments to this creator
  tags?: string[]; // labels like "practitioner", "athlete", "educator"
  isTestAccount?: boolean; // can be used in staging/synthetic mode
}

export interface CreatorRegistry {
  [creatorId: string]: CreatorProfile;
}

/**
 * In-memory registry. In a real deployment this may be replaced
 * with a storage-backed repository (DB, KV store, etc.).
 */
const creatorRegistry: CreatorRegistry = {};

/**
 * Register or update a creator profile.
 */
export function upsertCreator(creator: CreatorProfile): void {
  creatorRegistry[creator.id] = creator;
}

/**
 * Get a creator profile by ID.
 */
export function getCreatorById(id: string): CreatorProfile | undefined {
  return creatorRegistry[id];
}

/**
 * Convenience function: assign a creator to GIMA with a GIMA-aligned persona.
 * This is useful when seeding test data or routing practitioners.
 */
export function assignCreatorToGima(
  creatorId: string,
  handle: string,
  platform: CreatorProfile["platform"],
  defaultPersona: PersonaKey = "practitioner_educator"
): CreatorProfile {
  const profile: CreatorProfile = {
    id: creatorId,
    handle,
    platform,
    partnerId: "gima",
    defaultPersona,
    tags: ["practitioner", "education"]
  };

  upsertCreator(profile);
  return profile;
}

/**
 * List all creators currently in memory.
 * This is primarily for debugging and admin views.
 */
export function listCreators(): CreatorProfile[] {
  return Object.values(creatorRegistry);
}
