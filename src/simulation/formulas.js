/**
 * AIA-Engine: Combat Formulas (The "Book of Law")
 * This file contains the definitive, pure functions for all combat calculations.
 * It is the mathematical Source of Truth for the entire simulation engine.
 */

// --- UTILITY: PIECEWISE LINEAR INTERPOLATION ---
/**
 * A reusable interpolation function for any piecewise linear data.
 * @param {number} x - The value to find a corresponding y for.
 * @param {Array<Object>} points - An array of objects, e.g., [{x: 5, y: 566}, {x: 50, y: 710}]. Must be sorted by x.
 * @returns {number} The interpolated y value.
 */
function interpolate(x, points) {
    if (x <= points[0].x) return points[0].y;
    if (x >= points[points.length - 1].x) return points[points.length - 1].y;

    let lowerBound, upperBound;
    for (let i = 0; i < points.length - 1; i++) {
        if (points[i].x <= x && points[i+1].x >= x) {
            lowerBound = points[i];
            upperBound = points[i+1];
            break;
        }
    }
    
    const xRange = upperBound.x - lowerBound.x;
    const yRange = upperBound.y - lowerBound.y;
    if (xRange === 0) return lowerBound.y;
    
    const slope = yRange / xRange;
    const yValue = lowerBound.y + (slope * (x - lowerBound.x));
    
    return yValue;
}

// --- FORMULA 1: WEAPON DAMAGE CALCULATION ---

// SOURCE OF TRUTH: "Post-Patch Damage Scaling Analysis" document, 10/13/2025
const WEAPON_SCALING_DATA = {
    Sword: {
        baseDamage: 546,
        primary: {
            attribute: 'STR',
            points: [
                { x: 5, y: 546 }, { x: 50, y: 596 }, { x: 100, y: 649 },
                { x: 150, y: 701 }, { x: 200, y: 750 }, { x: 250, y: 797 },
                { x: 300, y: 841 }, { x: 350, y: 883 }, { x: 400, y: 924 },
                { x: 450, y: 961 }
            ]
        },
        secondary: {
            attribute: 'DEX',
            points: [
                { x: 5, y: 546 }, { x: 50, y: 586 }, { x: 100, y: 635 },
                { x: 150, y: 684 }, { x: 200, y: 730 }, { x: 250, y: 774 },
                { x: 300, y: 816 }, { x: 350, y: 857 }, { x: 400, y: 897 },
                { x: 450, y: 935 }
            ]
        }
    },
    Flail: {
        baseDamage: 566,
        primary: {
            attribute: 'STR',
            points: [
                { x: 5, y: 566 }, { x: 50, y: 671 }, { x: 100, y: 782 },
                { x: 150, y: 888 }, { x: 200, y: 990 }, { x: 250, y: 1087 },
                { x: 300, y: 1180 }, { x: 350, y: 1268 }, { x: 400, y: 1351 },
                { x: 450, y: 1429 }
            ]
        },
        secondary: {
            attribute: 'FOC',
            points: [
                { x: 5, y: 566 }, { x: 50, y: 646 }, { x: 100, y: 731 },
                { x: 150, y: 812 }, { x: 200, y: 890 }, { x: 250, y: 965 },
                { x: 300, y: 1035 }, { x: 350, y: 1103 }, { x: 400, y: 1166 },
                { x: 450, y: 1226 }
            ]
        }
    }
};

/**
 * Calculates total weapon damage by interpolating from scaling tables.
 * This is the master function for pre-flight damage analysis.
 * @param {string} weaponType - The weapon type (e.g., 'Sword', 'Flail').
 * @param {object} attributes - The combatant's attributes { STR, DEX, INT, FOC, CON }.
 * @returns {number} The final calculated weapon damage, rounded.
 */
export function calculateWeaponDamage(weaponType, attributes) {
    const weaponData = WEAPON_SCALING_DATA[weaponType];
    if (!weaponData) return 0;

    // Stage 1: Get the damage bonus from the primary attribute
    const primaryAttr = weaponData.primary.attribute;
    const primaryValue = attributes[primaryAttr] || 0;
    const primaryDamage = interpolate(primaryValue, weaponData.primary.points);
    const primaryBonus = primaryDamage - weaponData.baseDamage;

    // Stage 2: Get the damage bonus from the secondary attribute
    const secondaryAttr = weaponData.secondary.attribute;
    const secondaryValue = attributes[secondaryAttr] || 0;
    const secondaryDamage = interpolate(secondaryValue, weaponData.secondary.points);
    const secondaryBonus = secondaryDamage - weaponData.baseDamage;
    
    // Stage 3: Combine base damage with both bonuses
    const totalDamage = weaponData.baseDamage + primaryBonus + secondaryBonus;

    return Math.round(totalDamage);
}
