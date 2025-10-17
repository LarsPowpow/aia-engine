/**
 * @file cowardlyPunishment.js
 * @description Bunker handler for the "Cowardly Punishment" weapon mastery.
 *              Applies a short SLOW debuff to the target when the source lands
 *              Leaping Strike hits.
 * @version 1.0.0
 */

// --- METADATA ---
export const METADATA = {
    id: 'upgrade_sword_leapingstrike_slow',
    type: 'WEAPON_MASTERY',
};

// --- EFFECT TEMPLATE ---
const EFFECT_TEMPLATE = {
    id: 'effect_cowardly_punishment_slow',
    name: 'Cowardly Punishment - Slow',
    category: 'DEBUFF',
    statusId: 'SLOW',
    valueFormula: '30', // percent slow
    duration: 3, // seconds
    type: 'Mastery',
    categories: ['CC', 'SLOW'],
};

// --- BUNKER HANDLER ---
const cowardlyPunishment = (context) => {
    // defensive sanity checks
    if (!context || typeof context !== 'object') return null;
    const source = context.source || null;
    const target = context.target || null;
    const ts = typeof context.timestamp === 'number' ? context.timestamp : (context.ts || 0);
    const eventType = String(context.eventType || (context.action || '')).toUpperCase();
    const abilityId = String(context.abilityId || (context.ability && context.ability.id) || '').trim();

    if (!source || !target) return null;

    // Ensure masteries is an array
    const masteries = Array.isArray(source.masteries) ? source.masteries : [];

    // Only trigger if the source has this mastery equipped
    const hasMastery = masteries.some(m => String(m && m.id || '') === METADATA.id);
    if (!hasMastery) return null;

    // Canonical ability id variants to match
    const canonMatch = (abilityId === 'ability_sword_leaping_strike' || abilityId === 'ability_sword_leapingstrike');

    // Only apply on a successful hit event
    const isHitEvent = eventType.includes('ABILITY_HIT') || eventType.includes('ATTACK');

    if (!isHitEvent || !canonMatch) return null;

    // Defensive ensure arrays exist
    target.activeEffects = Array.isArray(target.activeEffects) ? target.activeEffects : [];

    // Prevent stacking duplicate active slow from the same mastery if already active and not expired
    const now = Number(ts || Date.now() / 1000);
    const alreadyActive = target.activeEffects.some(e => {
        if (!e || !e.id) return false;
        if (e.id !== EFFECT_TEMPLATE.id) return false;
        // if effect has expiresAt, check it's still in future relative to current timestamp
        if (typeof e.expiresAt === 'number') return e.expiresAt > now;
        // fallback: consider timestamp + duration
        const applied = typeof e.timestamp === 'number' ? e.timestamp : (e.appliedAt || 0);
        const dur = typeof e.duration === 'number' ? e.duration : EFFECT_TEMPLATE.duration;
        return (applied + dur) > now;
    });
    if (alreadyActive) return null;

    // Build effect instance
    const value = Number(parseFloat(EFFECT_TEMPLATE.valueFormula || '0')) || 0;
    const duration = Number(EFFECT_TEMPLATE.duration || 0);
    const effectInstance = {
        id: EFFECT_TEMPLATE.id,
        name: EFFECT_TEMPLATE.name,
        category: EFFECT_TEMPLATE.category,
        value,
        duration,
        timestamp: now,
        appliedAt: now,
        expiresAt: duration > 0 ? (now + duration) : undefined,
        sourceId: METADATA.id,
        sourceName: source.name || source.id || 'Unknown',
    };

    // Apply effect
    target.activeEffects.push(effectInstance);

    // Return a small result object so engine can pick up anything useful if needed
    return {
        appliedEffectId: effectInstance.id,
        appliedTo: target.id || target.name || null,
    };
};

export default cowardlyPunishment;