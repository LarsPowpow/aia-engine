/**
 * @file TEMPLATE_EffectBunker.js
 * @description Robust template for an "Effect Bunker" used by the prefab generator.
 * This template:
 *  - Validates event/conditions using `checkConditions`.
 *  - Builds a canonical effect object and returns `{ applyEffects: [...] }`.
 *  - Auto-generates effect IDs and selects the proper target (source/target) when needed.
 *
 * Expected metadata/config fields (common):
 *  - id: unique bunker id (used as fallback effect id)
 *  - category: effect category (EMPOWER, REND, MISC_DAMAGE, etc.)
 *  - defaultValue / amount: numeric value
 *  - defaultDuration / duration: seconds (use Infinity for passive)
 *  - event: canonical event string (e.g. 'BLOCK_START', 'BLOCK_HIT', etc.)
 *  - eventType: legacy/optional, but always set from prefab 'event' for workflow compliance
 *  - conditions: optional array of condition strings
 */

export const METADATA = {
    id: 'TEMPLATE_EFFECT_ID',
    type: 'EFFECT',
};

import { checkConditions } from '../bunkerUtils.js';

const templateEffectBunker = (context, config = {}) => {
    if (!context || !context.source) return null;
    // Always set eventType from config.event or meta.event for prefab-driven workflow
    const meta = { ...METADATA, ...config };
    const eventType = config.event || meta.event || meta.eventType;

    // 1) Condition / event matching (permanent fix: always use eventType from prefab/config)
    if (eventType && context.eventType && eventType.toUpperCase() !== context.eventType.toUpperCase()) {
        return null;
    }
    if (Array.isArray(meta.conditions) && !checkConditions(meta.conditions, context)) {
        return null;
    }

    // 2) Choose target for the effect. Default: apply to source for EMPOWER/MISC_DAMAGE/HEAL, to target for DEBUFFs
    const effectType = config.effects && config.effects[0] && config.effects[0].type;
    const effectValue = config.effects && config.effects[0] && config.effects[0].value;
    const effectValueType = config.effects && config.effects[0] && config.effects[0].valueType;
    const effectTarget = config.effects && config.effects[0] && config.effects[0].target;
    let category = meta.category || 'MISC_DAMAGE';
    let value = Number(meta.defaultValue ?? meta.amount ?? 0);
    if (effectType === 'heal') {
        category = 'HEAL';
        value = Number(effectValue ?? 0);
    }
    // Choose target: 'self' means source, otherwise target
    const applyToSourceCategories = ['EMPOWER', 'MISC_DAMAGE', 'HEAL'];
    const applyToSource = effectTarget === 'self' || applyToSourceCategories.includes(category.toUpperCase());
    const targetCombatant = applyToSource ? context.source : context.target;
    if (!targetCombatant) return null;

    // 3) Build canonical effect object
    const durationRaw = meta.defaultDuration ?? meta.duration;
    const duration = (durationRaw === undefined || durationRaw === null) ? Infinity : Number(durationRaw);
    const effectId = (meta.effectId || `${meta.id}_${category || 'effect'}`);

    const effect = {
        id: String(effectId),
        name: meta.label || meta.id,
        category,
        value,
        valueType: effectValueType,
        duration,
        source: meta.id,
        label: meta.label,
        description: meta.description,
        conditions: Array.isArray(meta.conditions) ? meta.conditions : [],
    };

    if (process.env.NODE_ENV !== 'production') {
        console.log('[TEMPLATE EFFECT]', { eventType: context.eventType, metaId: meta.id, targetId: targetCombatant.id, effect });
    }

    return { applyEffects: [{ ...effect, targetId: targetCombatant.id }] };
};

export default templateEffectBunker;

export function createEffectBunker(config = {}) {
    return {
        id: config.id || METADATA.id,
        type: 'EFFECT',
        metadata: { ...METADATA, ...config },
        handler: (context) => templateEffectBunker(context, config)
    };
}
