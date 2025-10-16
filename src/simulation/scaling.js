/**
 * @file scaling.js
 * @description Centralized module for all perk scaling calculations.
 */

/**
 * Calculates the perkMultiplier based on Gear Score and a scaling string.
 * This is the implementation of "The First Law of Scaling".
 * @param {string} scalingString - The raw scaling data (e.g., "0,725:0.00365").
 * @param {number} gearScore - The item's Gear Score.
 * @returns {number} The calculated perkMultiplier.
 */
const calculatePerkMultiplier = (scalingString, gearScore) => {
    if (!scalingString || !gearScore) {
        return 0;
    }

    // Expected format: "PREFIX,BREAKPOINT:FACTOR" e.g., "0,725:0.00365"
    const parts = scalingString.split(':');
    if (parts.length !== 2) return 0;

    const factor = parseFloat(parts[1]);
    const subParts = parts[0].split(',');
    if (subParts.length !== 2) return 0;
    
    const breakpoint = parseInt(subParts[1], 10);

    if (isNaN(breakpoint) || isNaN(factor)) return 0;

    if (gearScore > breakpoint) {
        return (gearScore - breakpoint) * factor;
    }

    return 0;
};

/**
 * Calculates the final power of an effect using its valueFormula and a pre-calculated multiplier.
 * This is the implementation of "The Second Law of Scaling".
 * @param {string} valueFormula - The formula string (e.g., "15.7 * perkMultiplier").
 * @param {string} scalingString - The raw scaling data string.
 * @param {number} gearScore - The item's Gear Score.
 * @returns {number} The final, calculated power of the effect.
 */
export const calculateEffectValue = (valueFormula, scalingString, gearScore) => {
    const perkMultiplier = calculatePerkMultiplier(scalingString, gearScore);
    
    if (!valueFormula) return 0;

    if (valueFormula.includes('*')) {
        const baseValue = parseFloat(valueFormula.split('*')[0]);
        // The "True Formula" is Final Power = Base + (Base * perkMultiplier)
        return baseValue + (baseValue * perkMultiplier);
    }
    
    return parseFloat(valueFormula) || 0;
};

