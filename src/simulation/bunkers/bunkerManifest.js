/**
 * @file bunkerManifest.js
 * @description Central manifest for importing and exporting all Bunker components.
 * Provides a loadBunkers(type) helper used by the engine and a BUNKER_MANIFEST
 * object expected by some UI components.
 */

// NOTE: keep these arrays defensively empty — concrete bunker modules will be
// added here when available. This avoids "missing export" runtime errors.
export const statBunkers = [];
export const modifierBunkers = [];
export const effectBunkers = [];

// Derived list of implemented IDs (keeps consumers from crashing).
const _extractBunkerId = (b) => {
    if (!b || typeof b !== 'object') return null;
    return b.id || b.metadata?.id || b.METADATA?.id || null;
};
export const implementedBunkerIds = [
    ...statBunkers,
    ...modifierBunkers,
    ...effectBunkers
].map(_extractBunkerId).filter(Boolean);

/**
 * loadBunkers(type?)
 * - type: optional string filter: 'STAT' | 'MODIFIER' | 'EFFECT' (case-insensitive)
 * - no type => returns all bunkers in order [stat, modifier, effect]
 */
export function loadBunkers(type = null) {
    if (!type) return [...statBunkers, ...modifierBunkers, ...effectBunkers];
    const t = String(type || '').toUpperCase();
    if (t === 'STAT') return [...statBunkers];
    if (t === 'MODIFIER') return [...modifierBunkers];
    if (t === 'EFFECT') return [...effectBunkers];
    return [...statBunkers, ...modifierBunkers, ...effectBunkers];
}

// Backwards/consumer compatibility: UI expects a single manifest object.
export const BUNKER_MANIFEST = {
    statBunkers,
    modifierBunkers,
    effectBunkers,
    implementedBunkerIds,
    loadBunkers,
};

