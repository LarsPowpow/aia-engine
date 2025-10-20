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
    
    // --- HEAL effect: apply healing directly ---
    if (effectData.category === 'HEAL') {
        const healAmount = effectData.value;
        const healTarget = target;
        healTarget.health = Math.min(healTarget.maxHealth, healTarget.health + healAmount);
        console.log('[STATE MANAGER] Applied healing:', healAmount, 'to', healTarget.id, 'new health:', healTarget.health);

        // Only add heal to activeEffects if it has duration > 0 (HoT effects)
        if (effectData.duration > 0) {
            const healEffect = {
                ...effectData,
                appliedAt: now,
                expiresAt: now + effectData.duration,
                sourceName: context.source && context.source.name ? context.source.name : (context.sourceId || 'Unknown'),
            };
            healTarget.activeEffects.push(healEffect);
            console.log('[STATE MANAGER] Added HoT (Heal over Time) effect to activeEffects:', healEffect.id);
        } else {
            console.log('[STATE MANAGER] Instant heal (duration: 0), not adding to activeEffects');
        }
        return;
    }

    // --- DOT effect: Anti-stack by effect ID ---
    if (effectData.category === 'DOT') {
        const existingDoT = target.activeEffects.find(e => 
            e.category === 'DOT' && e.id === effectData.id
        );
        
        if (existingDoT) {
            console.log(`[STATE MANAGER] DoT ${effectData.id} already active on ${target.id}, blocking reapplication (no stacking, no refresh)`);
            return;
        }
        
        // Apply new DoT
        const newDoT = {
            ...effectData,
            appliedAt: now,
            expiresAt: now + effectData.duration,
            sourceName: context.source && context.source.name ? context.source.name : (context.sourceId || 'Unknown'),
        };
        target.activeEffects.push(newDoT);
        console.log(`[STATE MANAGER] Applied new DoT ${effectData.id} to ${target.id}, expires at ${newDoT.expiresAt.toFixed(2)}s`);
        return;
    }

    // --- EMPOWER, REND, FORTIFY, MISC_DAMAGE: Anti-stack by source, with caps ---
    if (['EMPOWER', 'REND', 'FORTIFY', 'MISC_DAMAGE'].includes(effectData.category)) {
        // Check if same source already has this effect active
        const existingFromSameSource = target.activeEffects.find(e => 
            e.category === effectData.category && 
            e.sourceId === effectData.sourceId
        );
        
        if (existingFromSameSource) {
            // Refresh duration (extend expiration)
            existingFromSameSource.expiresAt = now + effectData.duration;
            existingFromSameSource.appliedAt = now;
            console.log(`[STATE MANAGER] Refreshed ${effectData.category} from ${effectData.sourceId} on ${target.id}, new expiration: ${existingFromSameSource.expiresAt.toFixed(2)}s`);
            return;
        }
        
        // Calculate current total from this category
        const currentTotal = target.activeEffects
            .filter(e => e.category === effectData.category)
            .reduce((sum, e) => sum + (e.value || 0), 0);
        
        // Define caps per category
        const caps = {
            EMPOWER: 0.50,
            FORTIFY: 0.50,
            REND: 0.70,
            MISC_DAMAGE: Infinity  // Uncapped
        };
        
        const cap = caps[effectData.category] || Infinity;
        let valueToApply = effectData.value;
        
        // Apply partial amount if would exceed cap
        if (currentTotal + valueToApply > cap) {
            const originalValue = valueToApply;
            valueToApply = Math.max(0, cap - currentTotal);
            console.log(`[STATE MANAGER] ${effectData.category} would exceed ${(cap * 100).toFixed(0)}% cap. Applying partial: ${(valueToApply * 100).toFixed(1)}% (was ${(originalValue * 100).toFixed(1)}%)`);
        }
        
        // Don't apply if value becomes 0 or negative
        if (valueToApply <= 0) {
            console.log(`[STATE MANAGER] ${effectData.category} already at cap (${(cap * 100).toFixed(0)}%), blocking new effect from ${effectData.sourceId}`);
            return;
        }
        
        // Apply new effect with (possibly capped) value
        const newEffect = {
            ...effectData,
            value: valueToApply,
            appliedAt: now,
            expiresAt: now + effectData.duration,
            sourceName: context.source && context.source.name ? context.source.name : (context.sourceId || 'Unknown'),
        };
        target.activeEffects.push(newEffect);
        console.log(`[STATE MANAGER] Applied ${effectData.category} from ${effectData.sourceId} to ${target.id}: ${(valueToApply * 100).toFixed(1)}% (total now: ${((currentTotal + valueToApply) * 100).toFixed(1)}%)`);
        return;
    }

    // --- Fallback for unknown categories ---
    console.warn(`[STATE MANAGER] Unknown effect category: ${effectData.category}, applying without special logic`);
    target.activeEffects.push({
        ...effectData,
        appliedAt: now,
        expiresAt: now + effectData.duration,
    });
};


export const stateManager = {
    applyDamageModifiers,
    applyEffect,
};
