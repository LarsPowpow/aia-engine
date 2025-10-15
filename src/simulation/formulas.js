/**
 * AIA-Engine: Combat Formulas (The "Book of Law")
 * This file contains the definitive, pure functions for all combat calculations.
 * It is the mathematical Source of Truth for a correct simulation.
 * VERSION 2.1 - Added Base Ability Modifiers
 */

// --- NEW SOURCE OF TRUTH: BASE ABILITY MODIFIERS ---
export const BASE_ABILITY_MODIFIERS = {
    Sword: {
        LIGHT_ATTACK: 1.0, // 100% of Weapon Damage
        HEAVY_ATTACK: 1.2  // 120% of Weapon Damage
    },
    Flail: {
        LIGHT_ATTACK: 1.0, // 100% of Weapon Damage
        HEAVY_ATTACK: 1.2  // 120% of Weapon Damage
    }
};

// --- UTILITY: PIECEWISE LINEAR INTERPOLATION ---
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

// --- DATA SOURCE: RAW WEAPON DAMAGE VALUES ---
const WEAPON_SCALING_DATA = {
    Sword: {
        baseDamage: 546,
        primary: { attribute: 'STR', points: [ { x: 5, y: 546 }, { x: 50, y: 596 }, { x: 100, y: 649 }, { x: 150, y: 701 }, { x: 200, y: 750 }, { x: 250, y: 797 }, { x: 300, y: 841 }, { x: 350, y: 883 }, { x: 400, y: 924 }, { x: 450, y: 961 } ] },
        secondary: { attribute: 'DEX', points: [ { x: 5, y: 546 }, { x: 50, y: 586 }, { x: 100, y: 635 }, { x: 150, y: 684 }, { x: 200, y: 730 }, { x: 250, y: 774 }, { x: 300, y: 816 }, { x: 350, y: 857 }, { x: 400, y: 897 }, { x: 450, y: 935 } ] }
    },
    Flail: {
        baseDamage: 566,
        primary: { attribute: 'STR', points: [ { x: 5, y: 566 }, { x: 50, y: 671 }, { x: 100, y: 782 }, { x: 150, y: 888 }, { x: 200, y: 990 }, { x: 250, y: 1087 }, { x: 300, y: 1180 }, { x: 350, y: 1268 }, { x: 400, y: 1351 }, { x: 450, y: 1429 } ] },
        secondary: { attribute: 'FOC', points: [ { x: 5, y: 566 }, { x: 50, y: 646 }, { x: 100, y: 731 }, { x: 150, y: 812 }, { x: 200, y: 890 }, { x: 250, y: 965 }, { x: 300, y: 1035 }, { x: 350, y: 1103 }, { x: 400, y: 1166 }, { x: 450, y: 1226 } ] }
    }
};

function createScalingBonusTable(rawData) {
    const bonusTable = {};
    for (const weapon in rawData) {
        const data = rawData[weapon];
        bonusTable[weapon] = {
            baseDamage: data.baseDamage,
            primary: {
                attribute: data.primary.attribute,
                points: data.primary.points.map(p => ({ x: p.x, y: (p.y / data.baseDamage) - 1 }))
            },
            secondary: {
                attribute: data.secondary.attribute,
                points: data.secondary.points.map(p => ({ x: p.x, y: (p.y / data.baseDamage) - 1 }))
            }
        };
    }
    return bonusTable;
}

const WEAPON_BONUS_DATA = createScalingBonusTable(WEAPON_SCALING_DATA);

export function calculateWeaponDamage(weaponType, attributes) {
    const weaponData = WEAPON_BONUS_DATA[weaponType];
    if (!weaponData) return 0;

    const primaryAttr = weaponData.primary.attribute;
    const primaryValue = attributes[primaryAttr] || 0;
    const primaryBonus = interpolate(primaryValue, weaponData.primary.points);

    const secondaryAttr = weaponData.secondary.attribute;
    const secondaryValue = attributes[secondaryAttr] || 0;
    const secondaryBonus = interpolate(secondaryValue, weaponData.secondary.points);
    
    const totalAttributeBonus = primaryBonus + secondaryBonus;
    const totalDamage = weaponData.baseDamage * (1 + totalAttributeBonus);

    return Math.round(totalDamage);
}