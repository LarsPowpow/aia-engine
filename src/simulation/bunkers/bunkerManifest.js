// --- AUTO-IMPORT all generated effect bunkers using Vite import.meta.glob ---
const generatedBunkerModules = import.meta.glob('./generated/*.js', { eager: true });
const generatedBunkers = Object.values(generatedBunkerModules).map(mod => mod.default).filter(Boolean);

console.log('[BUNKER MANIFEST] Generated bunkers loaded:', {
    moduleCount: Object.keys(generatedBunkerModules).length,
    moduleKeys: Object.keys(generatedBunkerModules),
    bunkerCount: generatedBunkers.length,
    bunkerIds: generatedBunkers.map(b => b.METADATA?.id || b.metadata?.id || b.id || 'UNKNOWN')
});

export const statBunkers = [
    { id: 'perkid_slottable_common_empower', handler: () => {} },
    { id: 'runeglass_gem_malachite_melee', handler: () => {} }
];

import empower20 from './modifierBunkers/empower20.js';
import cowardlyPunishment from './masteries/sword/cowardlyPunishment/cowardlyPunishment_Effects';
import punishingMalachiteArmorMisc from './runeglass/punishingMalachite/punishingMalachite_ArmorMisc.js';
import punishingMalachiteWeaponMisc from './runeglass/punishingMalachite/punishingMalachite_WeaponMisc.js';
import punishingMalachiteCruelEmpower from './runeglass/punishingMalachite/punishingMalachite_CruelEmpower.js';
import empoweringLeapingStrike from './perks/empoweringLeapingStrike/empoweringLeapingStrike_Modifiers.js';
import perk_keenly_jagged_ii from './generated/perk_keenly_jagged_ii';
import perk_keenly_empowered_ii from './generated/perk_keenly_empowered_ii';
import perk_disdained_infliction_ii from './generated/perk_disdained_infliction_ii';
import runeglass_empowered_sapphire_weapon from './modifiers/runeglass_empowered_sapphire_weapon.js';
import runeglass_empowered_sapphire_armor from './modifiers/runeglass_empowered_sapphire_armor.js';
import runeglass_empowered_sapphire_weapon_hex from './effectBunkers/runeglass_empowered_sapphire_weapon_hex.js';
import runeglass_punishing_sapphire_weapon from './modifiers/runeglass_punishing_sapphire_weapon.js';
import runeglass_punishing_sapphire_weapon_empowered from './modifiers/runeglass_punishing_sapphire_weapon_empowered.js';
import runeglass_punishing_sapphire_armor from './modifiers/runeglass_punishing_sapphire_armor.js';
import runeglass_empowered_malachite_weapon from './modifiers/runeglass_empowered_malachite_weapon.js';
import runeglass_empowered_malachite_weapon_misc from './modifiers/runeglass_empowered_malachite_weapon_misc.js';
import runeglass_empowered_malachite_armor from './modifiers/runeglass_empowered_malachite_armor.js';
import runeglass_empowered_malachite_weapon_hex from './effectBunkers/runeglass_empowered_malachite_weapon_hex.js';
import runeglass_empowered_jasper_retaliate_stack from './effectBunkers/runeglass_empowered_jasper_retaliate_stack.js';
import runeglass_empowered_jasper_weapon_hex from './effectBunkers/runeglass_empowered_jasper_hex.js';
import runeglass_empowered_jasper_retaliate_modifier from './modifiers/runeglass_empowered_jasper_retaliate_modifier.js';
import runeglass_empowered_jasper_armor from './modifiers/runeglass_empowered_jasper_armor.js';
import runeglass_punishing_jasper_retaliate_modifier from './modifiers/runeglass_punishing_jasper_retaliate_modifier.js';
import runeglass_punishing_jasper_weapon_misc from './modifiers/runeglass_punishing_jasper_weapon_misc.js';
import runeglass_punishing_jasper_armor from './modifiers/runeglass_punishing_jasper_armor.js';
import perk_enchanted_ii from './generated/perk_enchanted_ii.js';
import perk_sacred_ii from './generated/perk_sacred_ii.js';
import perk_keen_ii from './generated/perk_keen_ii.js';
import perk_vicious_ii from './generated/perk_vicious_ii.js';
import perk_skilled_enchantment_ii from './generated/perk_skilled_enchantment_ii.js';
import perk_empowered_ii from './generated/perk_empowered_ii.js';
import perk_fortified_ii from './generated/perk_fortified_ii.js';
import perk_anointed_lifesteal_ii from './generated/perk_anointed_lifesteal_ii.js';
import perk_divine_ii from './generated/perk_divine_ii.js';
import perk_end_ii from './generated/perk_end_ii.js';
import perk_arcane_damage_ii from './generated/perk_arcane_damage_ii.js';

export const modifierBunkers = [
    perk_disdained_infliction_ii,
    perk_enchanted_ii,
    perk_sacred_ii,
    perk_keen_ii,
    perk_vicious_ii,
    perk_skilled_enchantment_ii,
    perk_empowered_ii,
    perk_fortified_ii,
    perk_anointed_lifesteal_ii,
    perk_divine_ii,
    perk_end_ii,
    perk_arcane_damage_ii,
    runeglass_empowered_sapphire_weapon,
    runeglass_empowered_sapphire_armor,
    runeglass_punishing_sapphire_weapon,
    runeglass_punishing_sapphire_weapon_empowered,
    runeglass_punishing_sapphire_armor,
    runeglass_empowered_malachite_weapon,
    runeglass_empowered_malachite_weapon_misc,
    runeglass_empowered_malachite_armor
    ,runeglass_empowered_jasper_retaliate_modifier,
    runeglass_empowered_jasper_armor,
    runeglass_punishing_jasper_retaliate_modifier,
    runeglass_punishing_jasper_weapon_misc,
    runeglass_punishing_jasper_armor
];

export const effectBunkers = [
    empoweringLeapingStrike,
    perk_keenly_jagged_ii,
    perk_keenly_empowered_ii,
    runeglass_empowered_sapphire_weapon_hex,
    runeglass_empowered_malachite_weapon_hex,
    runeglass_empowered_jasper_retaliate_stack,
    runeglass_empowered_jasper_weapon_hex,
    ...generatedBunkers
];

console.log('[BUNKER MANIFEST] Effect bunkers loaded:', {
    count: effectBunkers.length,
    ids: effectBunkers.map(b => b.METADATA?.id || b.metadata?.id || b.id || 'UNKNOWN'),
    jasperRetaliate: effectBunkers.find(b => 
        (b.METADATA?.id || b.metadata?.id || b.id) === 'runeglass_empowered_jasper_retaliate_stack'
    ) ? '✅ FOUND' : '❌ MISSING'
});

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

