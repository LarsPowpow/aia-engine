/**
 * @file runeglass_malachite_punishing_weapon.js
 * @description Bunker for the Punishing Runeglass Gem (Malachite).
 * @version 1.1.0 - Aligned with Bunker Manifest architecture
 */

// --- METADATA ---
export const METADATA = {
  id: 'perkid_runeglassgem_crueladd_melee',
  type: 'PERK',
};

// --- BUNKER HANDLER ---
const runeglassMalachitePunishing = (context) => {
    // Self-check: Is this perk equipped?
    const isEquipped = context.combatant.perks?.some(p => p.id === METADATA.id);
    if (!isEquipped) {
        return;
    }

    // Trigger: Only on ATTACK or ABILITY_HIT events
    if (context.eventType.includes('ATTACK') || context.eventType.includes('ABILITY_HIT')) {
        // Condition: Check if the target has an active CC effect.
        const targetHasCC = context.target.activeEffects.some(e => e.category === 'CC');

        if (targetHasCC) {
            const damageBonusVsCCEffect = {
                id: 'effect_runeglass_punishing_vs_cc',
                name: 'Runeglass Punishing vs. CC',
                category: 'EMPOWER',
                value: 14, // 14% empower
                duration: 0, // Applies only to this hit
                sourceName: 'Punishing Malachite',
            };
            context.combatant.activeEffects.push(damageBonusVsCCEffect);
        }
    }
};

export default runeglassMalachitePunishing;
