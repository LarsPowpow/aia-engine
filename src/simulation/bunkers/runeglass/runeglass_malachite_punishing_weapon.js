/**
 * @file runeglass_malachite_punishing_weapon.js
 * @description Final, data-driven Bunker for Punishing Cruel.
 * @version 7.0.0 - Pre-Event State Compliant
 */

// --- METADATA ---
export const METADATA = {
  id: 'perkid_runeglassgem_crueladd_melee',
  type: 'RUNEGLASS',
};

// --- BUNKER HANDLER ---
const runeglassMalachitePunishingWeapon = (context) => {
    // Use the live source to apply effects, but the pre-event target for checks.
    const { source, targetPreEvent, eventType } = context;
    if (!source || !targetPreEvent) return;

    const sourcePerk = source.perks?.find(p => p.id === METADATA.id);
    if (!sourcePerk || !Array.isArray(sourcePerk.effects)) {
        return;
    }

    for (const effectTemplate of sourcePerk.effects) {
        if (effectTemplate.conditions?.includes('ON_EQUIP')) {
            continue;
        }

        let conditionsMet = true;
        for (const condition of effectTemplate.conditions) {
            if (condition === 'ON_MELEE_HIT') {
                if (!eventType.includes('ATTACK') && !eventType.includes('ABILITY_HIT')) {
                    conditionsMet = false;
                }
            } else if (condition === 'TARGET_HAS_CC') {
                // --- FINAL FIX: Check against the PRE-EVENT state ---
                const targetHasCC = targetPreEvent.activeEffects.some(e => 
                    (e.category === 'SLOW' || e.category === 'ROOT' || e.category === 'STUN')
                );
                if (!targetHasCC) {
                    conditionsMet = false;
                }
            } else {
                conditionsMet = false;
            }
            if (!conditionsMet) break;
        }

        if (conditionsMet) {
            const newEffect = {
                id: effectTemplate.id,
                name: effectTemplate.name,
                category: effectTemplate.category,
                value: parseFloat(effectTemplate.valueFormula) || 0,
                duration: 0, 
                sourceName: sourcePerk.name,
            };
            // Apply the effect to the LIVE source object
            source.activeEffects.push(newEffect);
        }
    }
};

export default runeglassMalachitePunishingWeapon;

