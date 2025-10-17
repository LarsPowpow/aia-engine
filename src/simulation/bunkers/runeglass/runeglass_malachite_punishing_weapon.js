/**
 * @file runeglass_malachite_punishing_weapon.js
 * @description Data-driven Bunker for Punishing Cruel. Parses the 'effects' array from the source data.
 * @version 3.0.0 - Rosetta Stone v7 Compliant
 */

// --- METADATA ---
// This ID must perfectly match the `id` in the ukb_sources_v2 Firestore document.
export const METADATA = {
  id: 'perkid_runeglassgem_crueladd_melee',
  type: 'RUNEGLASS',
};

// --- BUNKER HANDLER ---
const runeglassMalachitePunishingWeapon = (context) => {
    const { combatant, target, eventType } = context;
    if (!combatant) return;

    // Find the full perk data object from the combatant's equipped perks.
    // This object contains the new `effects` array.
    const sourcePerk = combatant.perks?.find(p => p.id === METADATA.id);
    if (!sourcePerk || !Array.isArray(sourcePerk.effects)) {
        return;
    }

    // Iterate through all effects defined in the perk's data.
    for (const effectTemplate of sourcePerk.effects) {
        
        // --- Condition Processor ---
        let conditionsMet = true;
        for (const condition of effectTemplate.conditions) {
            switch (condition) {
                case 'ON_EQUIP':
                    // This condition is for persistent effects. We will handle it by checking if the effect is already active.
                    const isAlreadyActive = combatant.activeEffects.some(e => e.id === effectTemplate.id);
                    if (isAlreadyActive) {
                        conditionsMet = false; 
                    }
                    break;
                
                case 'ON_MELEE_HIT':
                    if (!eventType.includes('ATTACK') && !eventType.includes('ABILITY_HIT')) {
                        conditionsMet = false;
                    }
                    break;

                case 'TARGET_HAS_CC':
                    const targetHasCC = target?.activeEffects.some(e => e.category === 'CC');
                    if (!targetHasCC) {
                        conditionsMet = false;
                    }
                    break;
                
                default:
                    // If we encounter an unknown condition, assume it's not met.
                    conditionsMet = false;
                    break;
            }
            // If any condition fails, stop checking for this effect.
            if (!conditionsMet) break;
        }

        // --- Effect Application ---
        if (conditionsMet) {
            const newEffect = {
                id: effectTemplate.id,
                name: effectTemplate.name,
                category: effectTemplate.category,
                // The 'value' is parsed directly from the data's valueFormula.
                value: parseFloat(effectTemplate.valueFormula) || 0,
                // Duration is set based on the ON_EQUIP condition.
                duration: effectTemplate.conditions.includes('ON_EQUIP') ? Infinity : 0,
                sourceName: sourcePerk.name,
            };
            combatant.activeEffects.push(newEffect);
        }
    }
};

export default runeglassMalachitePunishingWeapon;

