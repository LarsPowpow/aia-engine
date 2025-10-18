/**
 * @file stateManager.js
 * @description The "Smart" component of the engine. This is the single source of truth
 * for all stateful logic, such as applying effects (with anti-stacking)
 * and calculating damage modifiers (with caps).
 * This module is ONLY to be called by engine.js, never by a Bunker.
 */

// Per The Book of Law, Section 3.2
const EMPOWER_CAP = 0.50; // 50%
const REND_CAP = 0.70;    // 70%

/**
 * Applies a list of damage modifiers to the base damage terms.
 * This is the heart of Stroke 1.
 * @param {object} damageTerms - The initial damage terms object.
 * @param {array} modifierList - A list of { category, value } objects from Bunkers.
 * @returns {object} The new damage terms with modifiers applied.
 */
const applyDamageModifiers = (damageTerms, modifierList) => {
    const newTerms = { ...damageTerms };
    let totalEmpower = newTerms.empowerPercent || 0;
    let totalRend = newTerms.rendPercent || 0;

    for (const mod of modifierList) {
        switch (mod.category) {
            case 'EMPOWER':
                totalEmpower += mod.value;
                break;
            case 'REND':
                totalRend += mod.value;
                break;
            // Add other modifier categories here in the future
        }
    }

    // Apply caps
    newTerms.empowerPercent = Math.min(totalEmpower, EMPOWER_CAP);
    newTerms.rendPercent = Math.min(totalRend, REND_CAP);

    return newTerms;
};

/**
 * Applies a single effect to a target combatant.
 * This is the heart of Stroke 2.
 * This function contains all the anti-stacking, duration refresh, etc., logic.
 * @param {object} target - The combatant receiving the effect.
 * @param {object} effectData - The effect object definition from a Bunker.
 * @param {object} context - The combat event context for timestamp info.
 */
const applyEffect = (target, effectData, context) => {
    if (!target.activeEffects) {
        target.activeEffects = [];
    }

    const now = context.timestamp;
    const existingEffect = target.activeEffects.find(e => e.id === effectData.id);

    if (existingEffect) {
        // --- Refresh Logic ---
        // For now, we only refresh duration. More complex rules can be added here.
        existingEffect.expiresAt = now + effectData.duration;
        existingEffect.appliedAt = now; // Update timestamp of last application
    } else {
        // --- Application Logic ---
        const newEffect = {
            ...effectData,
            appliedAt: now,
            expiresAt: now + effectData.duration,
        };
        target.activeEffects.push(newEffect);
    }
};


export const stateManager = {
    applyDamageModifiers,
    applyEffect,
};
