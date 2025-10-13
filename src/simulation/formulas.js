/**
 * Calculates total weapon damage for a given weapon type and attribute set.
 * @param {string} weaponType - The weapon type string (e.g., 'Sword').
 * @param {object} attributes - Attribute object (e.g., { STR: 332, DEX: 36, FOC: 60 }).
 * @returns {number} The total weapon damage, rounded to nearest integer.
 */
export function calculateWeaponDamage(weaponType, attributes) {
    const weaponData = WEAPON_SCALING_DATA[weaponType];
    if (!weaponData) return 0;
    const baseDamage = weaponData.baseDamage;

    // Primary
    const primaryAttr = weaponData.primary.attribute;
    const primaryValue = attributes[primaryAttr] || 0;
    const primaryAdded = interpolate(primaryValue, weaponData.primary, baseDamage);

    // Secondary
    const secondaryAttr = weaponData.secondary.attribute;
    const secondaryValue = attributes[secondaryAttr] || 0;
    const secondaryAdded = interpolate(secondaryValue, weaponData.secondary, baseDamage);

    const totalDamage = baseDamage + primaryAdded + secondaryAdded;
    return Math.round(totalDamage);
}
/**
 * Interpolates added damage from a single attribute using a scaling table.
 * @param {number} attributeValue - The attribute score to evaluate.
 * @param {object} scalingTable - Object with 'points' and 'damageValues' arrays.
 * @param {number} baseDamage - The weapon's base damage.
 * @returns {number} The total added damage from this attribute.
 */
export function interpolate(attributeValue, scalingTable, baseDamage) {
    if (attributeValue <= 5) return 0;
    const { points, damageValues } = scalingTable;
    let lowerIdx = 0;
    let upperIdx = points.length - 1;

    // Find bounds
    for (let i = 0; i < points.length; i++) {
        if (points[i] <= attributeValue) lowerIdx = i;
        if (points[i] > attributeValue) {
            upperIdx = i;
            break;
        }
    }

    const lowerBound = { points: points[lowerIdx], damage: damageValues[lowerIdx] };
    const upperBound = { points: points[upperIdx], damage: damageValues[upperIdx] };

    const pointsInRange = upperBound.points - lowerBound.points;
    const damageInRange = upperBound.damage - lowerBound.damage;
    const damagePerPoint = pointsInRange === 0 ? 0 : damageInRange / pointsInRange;

    const pointsFromLower = attributeValue - lowerBound.points;
    const damageGainSinceLowerBound = pointsFromLower * damagePerPoint;

    const totalAddedDamage = (lowerBound.damage - baseDamage) + damageGainSinceLowerBound;
    return totalAddedDamage;
}
// --- WEAPON SCALING DATA ---
export const WEAPON_SCALING_DATA = {
    Sword: {
        baseDamage: 546,
        primary: {
            attribute: 'STR',
            points: [5, 49, 50, 51, 99, 100, 101, 149, 150, 151, 199, 200, 201, 250, 251, 299, 300, 301, 325, 349, 350, 351, 399, 400, 401, 449, 450, 451],
            damageValues: [546, 681, 684, 687, 835, 838, 840, 958, 960, 963, 1069, 1071, 1073, 1169, 1171, 1254, 1255, 1257, 1292, 1328, 1329, 1330, 1392, 1393, 1395, 1450, 1450, 1451]
        },
        secondary: {
            attribute: 'DEX',
            points: [5, 49, 50, 51, 99, 100, 101, 149, 150, 151],
            damageValues: [546, 643, 646, 648, 754, 756, 758, 843, 845, 847]
        }
    },
    Flail: {
        baseDamage: 566,
        primary: {
            attribute: 'STR',
            points: [5, 49, 50, 51, 99, 100, 101, 149, 150, 151, 199, 200, 201, 250, 251, 299, 300, 301, 325, 349, 350, 351, 399, 400, 401, 449, 450, 451],
            damageValues: [566, 707, 710, 713, 866, 869, 872, 994, 997, 999, 1109, 1112, 1114, 1214, 1216, 1301, 1303, 1305, 1341, 1378, 1380, 1381, 1445, 1446, 1447, 1505, 1505, 1506]
        },
        secondary: {
            attribute: 'FOC',
            points: [5, 49, 50, 51, 99, 100, 101, 149, 150, 151],
            damageValues: [566, 668, 670, 672, 783, 785, 787, 875, 877, 879]
        }
    }
};
// --- ATTRIBUTE THRESHOLDS (Source of Truth for bonuses) ---
export const ATTRIBUTE_THRESHOLDS = {
    STR: {
        50: { description: "+5% damage to Melee light attacks.", effects: { melee_light_attack_damage_percent: 5 } },
        100: { description: "+10% damage to Melee heavy attacks.", effects: { melee_heavy_attack_damage_percent: 10 } },
        150: { description: "+50% stamina damage from Melee light and heavy attacks.", effects: { melee_stamina_damage_percent: 50 } },
        200: { description: "+10% damage on stunned, slowed, or rooted enemies.", effects: { conditional_damage_percent: 10, condition: ['stunned', 'slowed', 'rooted'] } },
        250: { description: "Stamina regeneration is continued while performing Melee light and heavy attacks.", effects: { grants_special_ability: 'uninterruptible_stamina_regen' } },
        300: { description: "Melee light and heavy attacks gain GRIT.", effects: { grants_special_ability: 'grit_on_melee_attacks' } },
    },
    DEX: {
        50: { description: "+5% chance to crit.", effects: { crit_chance_percent: 5 } },
        100: { description: "+5% thrust damage.", effects: { thrust_damage_percent: 5 } },
        150: { description: "Dodging cost 10 less stamina.", effects: { dodge_stamina_cost_reduction: 10 } },
        200: { description: "+10% bonus backstab and headshot damage.", effects: { backstab_damage_percent: 10, headshot_damage_percent: 10 } },
        250: { description: "+10% damage on stunned, slowed, or rooted enemies.", effects: { conditional_damage_percent: 10, condition: ['stunned', 'slowed', 'rooted'] } },
        300: { description: "Ammo has a 15% chance of being returned. Guaranteed crit after a dodge roll.", effects: { ammo_return_chance: 15, grants_special_ability: 'guaranteed_crit_after_dodge' } },
    },
    INT: {
        50: { description: "+10% damage to light and heavy magic attacks.", effects: { magic_attack_damage_percent: 10 } },
        100: { description: "+10% crit damage.", effects: { crit_damage_percent: 10 } },
        150: { description: "+15% to elemental damage.", effects: { elemental_damage_percent: 15 } },
        200: { description: "+10 mana after a dodge.", effects: { mana_on_dodge_flat: 10 } },
        250: { description: "+30% duration to damage of self buffs.", effects: { self_dot_duration_percent: 30 } },
        300: { description: "+30% damage on first hit on full health target.", effects: { first_hit_full_health_damage_percent: 30 } },
    },
    FOC: {
        50: { description: "+10% mana regeneration rate.", effects: { mana_regen_rate_percent: 10 } },
        100: { description: "+20 to mana pool.", effects: { mana_pool_flat: 20 } },
        150: { description: "+20% healing output.", effects: { healing_output_percent: 20 } },
        200: { description: "+20% duration on casted buffs.", effects: { casted_buff_duration_percent: 20 } },
        250: { description: "+30 mana on any self or group kill with a life staff.", effects: { mana_on_kill_flat: 30 } },
        300: { description: "When mana drops below 10%, gain 200% mana regen for 10s.", effects: { grants_special_ability: 'low_mana_regen_buff' } },
    },
    CON: {
        50: { description: "All health consumables 20% stronger.", effects: { consumable_healing_percent: 20 } },
        100: { description: "Increase max health by 10% of physical armor.", effects: { max_health_from_physical_armor_percent: 10 } },
        150: { description: "10% reduction to crit damage taken.", effects: { crit_damage_reduction_percent: 10 } },
        200: { description: "20% increase to armor.", effects: { armor_increase_percent: 20 } },
        250: { description: "80% damage reduction when full health.", effects: { full_health_damage_reduction_percent: 80 } },
        300: { description: "20% longer duration on stun, slow, and root spells.", effects: { cc_duration_on_target_percent: 20 } },
    },
};
/**
 * Returns all active effects for a given attribute and score.
 * @param {string} attrKey - One of 'STR', 'DEX', 'INT', 'FOC', 'CON'.
 * @param {number} score - The attribute score.
 * @returns {Array} Array of effect objects for all thresholds <= score.
 */
export function getActiveAttributeEffects(attrKey, score) {
    const thresholds = ATTRIBUTE_THRESHOLDS[attrKey];
    if (!thresholds) return [];
    return Object.entries(thresholds)
        .filter(([threshold]) => score >= Number(threshold))
        .map(([_, obj]) => obj.effects);
}
/**
 * AIA-Engine: Combat Formulas (The "Book of Law")
 * This file contains the definitive, pure functions for all combat calculations.
 * It is the mathematical Source of Truth for the entire simulation engine.
 */

// --- ATTRIBUTE SCALING INTERPOLATION TABLE (Source of Truth) ---
// This table translates raw attribute scores into a damage multiplier.
const ATTRIBUTE_SCALING_TABLE = {
    50: 0.05625,
    100: 0.1625,
    150: 0.31875,
    200: 0.525,
    250: 0.78125,
    300: 1.0875,
    350: 1.44375
};

/**
 * Calculates the attribute scaling bonus based on player attributes and weapon type.
 * For now, this is a simplified version for a Sword (STR primary, DEX secondary).
 * @param {object} attributes - The combatant's attributes { str, dex, ... }.
 * @returns {number} The attribute scaling bonus multiplier.
 */
export function calculateAttributeBonus(attributes) {
    // This is a simplified linear interpolation for now.
    // We will upgrade this to a more complex function later if needed.
    
    // Find the two STR breakpoints the player is between.
    const strPoints = Object.keys(ATTRIBUTE_SCALING_TABLE).map(Number);
    let lowerStr = 0;
    let upperStr = 50;

    for (const point of strPoints) {
        if (attributes.str >= point) {
            lowerStr = point;
        } else {
            upperStr = point;
            break;
        }
    }
    
    // Calculate the scaling bonus
    const lowerBonus = ATTRIBUTE_SCALING_TABLE[lowerStr] || 0;
    const upperBonus = ATTRIBUTE_SCALING_TABLE[upperStr] || lowerBonus;

    const range = upperStr - lowerStr;
    const progress = (attributes.str - lowerStr) / range;
    
    const strBonus = lowerBonus + (upperBonus - lowerBonus) * progress;

    // For now, we are only calculating the primary attribute (STR).
    // Secondary attribute scaling (DEX) will be added in a future pass.
    return strBonus;
}

/**
 * Formula 1: Base Weapon Damage
 * @param {number} weaponBaseDamage - The raw base damage of the weapon.
 * @param {object} attributes - The combatant's attributes.
 * @returns {number} The calculated base damage before other modifiers.
 */
export function calculateBaseDamage(weaponBaseDamage, attributes) {
    const attributeBonus = calculateAttributeBonus(attributes);
    return weaponBaseDamage * (1 + attributeBonus);
}
