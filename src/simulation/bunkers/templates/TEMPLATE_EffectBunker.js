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
    // implement effect-generation logic in concrete bunkers
    return null;
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
