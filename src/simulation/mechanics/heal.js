/**
 * @file heal.js
 * @description Contains the logic for the HEAL effect category. This version is compliant with
 * the "True Formula" for perk scaling from The Book of Law.
 */

/**
 * The First Law of Scaling: Calculates the perkMultiplier variable.
 * @param {string} scalingPerGearScore - The raw scaling string (e.g., "0,725:0.00365").
 * @param {number} gearScore - The item's current Gear Score.
 * @returns {number} The calculated perk multiplier.
 */
const calculatePerkMultiplier = (scalingPerGearScore, gearScore) => {
    if (!scalingPerGearScore || typeof scalingPerGearScore !== 'string') return 0;
    
    const parts = scalingPerGearScore.replace(',', '.').split(':');
    if (parts.length !== 2) return 0;

    const breakpoint = parseFloat(parts[0]);
    const factor = parseFloat(parts[1]);

    if (isNaN(breakpoint) || isNaN(factor) || gearScore <= breakpoint) {
        return 0;
    }

    return (gearScore - breakpoint) * factor;
};


/**
 * Applies a heal effect to a combatant.
 * @param {object} effect - The effect document from the UKB.
 * @param {object} context - The context of the event (e.g., { damageDealt }).
 * @param {object} combatant - The combatant to be healed.
 * @param {function} logAndCapture - The simulation's logging function.
 */
const applyHeal = (effect, context, combatant, logAndCapture) => {
    const { damageDealt, timeline } = context;
    let healAmount = 0;

    // This is hardcoded for now. In the future, this will come from the combatant's equipment.
    const gearScore = 700;
    const perkMultiplier = calculatePerkMultiplier(effect.scalingPerGearScore, gearScore);
    const baseValue = parseFloat(effect.valueFormula) || 0;
    
    // The Second Law of Scaling: Final Power = Base + (Base * perkMultiplier)
    const finalPower = baseValue + (baseValue * perkMultiplier);

    if (effect.unit === 'PERCENT_OF_DAMAGE') {
        const percentage = finalPower;
        healAmount = Math.round(damageDealt * (percentage / 100));
    } else if (effect.unit === 'PERCENT_BASE_HEALTH') {
        const percentage = finalPower;
        // --- FIX START ---
        // The calculation now correctly uses the new, reliable `maxHealth` property
        // instead of the undefined `health` property. This resolves the NaN bug.
        healAmount = Math.round(combatant.maxHealth * (percentage / 100));
        // --- FIX END ---
    }
    
    if (healAmount > 0) {
        // Ensure current health does not exceed maxHealth.
        combatant.state.health = Math.min(combatant.maxHealth, combatant.state.health + healAmount);
        combatant.stats.healingDone = (combatant.stats.healingDone || 0) + healAmount;
        logAndCapture(timeline, `[HEAL] ${combatant.id} healed for ${healAmount}.`, { newHealth: combatant.state.health });
    }
};

export { applyHeal };

