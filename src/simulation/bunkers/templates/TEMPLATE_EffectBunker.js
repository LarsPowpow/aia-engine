/**
 * @file TEMPLATE_EffectBunker.js
 * @description Blueprint for an "Effect Bunker". This Bunker runs on Stroke 2
 * of the Two Stroke engine to apply a status effect.
 */

export const METADATA = {
    id: 'TEMPLATE_EFFECT_ID',
    type: 'EFFECT',
};

const templateEffectBunker = (context, config = {}) => {
    if (!context || !context.source) return null;
    // Schema-driven: check event/conditions using checkConditions if available
    const { checkConditions } = require('../bunkerUtils');
    const meta = { ...METADATA, ...config };
    // If eventType or conditions are present, check them
    let shouldProc = true;
    if (meta.eventType && context.eventType && meta.eventType.toUpperCase() !== context.eventType.toUpperCase()) {
        shouldProc = false;
    }
    if (meta.conditions && !checkConditions(meta.conditions, context)) {
        shouldProc = false;
    }
    if (!shouldProc) return null;
    // Build effect object from metadata/config
    const effect = {
        id: meta.id,
        category: meta.category,
        value: meta.defaultValue ?? meta.amount ?? 0,
        duration: meta.defaultDuration ?? meta.duration ?? 0,
        source: meta.id,
        label: meta.label,
        description: meta.description
    };
    // Optional: add debug log for prefab troubleshooting
    if (process.env.NODE_ENV !== 'production') {
        console.log('[EFFECT BUNKER TEMPLATE]', { context, meta, effect });
    }
    return { applyEffects: [effect] };
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
