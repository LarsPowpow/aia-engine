// --- AUTO-IMPORT all generated effect bunkers using Vite import.meta.glob ---
const generatedBunkerModules = import.meta.glob('./generated/*.js', { eager: true });
const generatedBunkers = Object.values(generatedBunkerModules).map(mod => mod.default).filter(Boolean);

export const statBunkers = [
    { id: 'perkid_slottable_common_empower', handler: () => {} },
    { id: 'runeglass_gem_malachite_melee', handler: () => {} }
];

import empower20 from './modifierBunkers/empower20.js';
import cowardlyPunishment from './masteries/sword/cowardlyPunishment/cowardlyPunishment_Effects';
import leapingStrike from './masteries/sword/leapingStrike_Effects.js';
import punishingMalachiteArmorMisc from './runeglass/punishingMalachite/punishingMalachite_ArmorMisc.js';
import punishingMalachiteWeaponMisc from './runeglass/punishingMalachite/punishingMalachite_WeaponMisc.js';
import punishingMalachiteCruelEmpower from './runeglass/punishingMalachite/punishingMalachite_CruelEmpower.js';
import empoweringLeapingStrike from './perks/empoweringLeapingStrike/empoweringLeapingStrike_Modifiers.js';
import keenlyJaggedII from './generated/perk_keenly_jagged_ii.js';

export const modifierBunkers = [empoweringLeapingStrike];
export const effectBunkers = [
    cowardlyPunishment,
    leapingStrike,
    punishingMalachiteArmorMisc,
    punishingMalachiteWeaponMisc,
    punishingMalachiteCruelEmpower,
    keenlyJaggedII,
    ...generatedBunkers
];

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

