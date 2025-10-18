/**
 * @file empoweringLeapingStrike_Effects.js
 * @description Mass-producible effect bunker for Empowering Leaping Strike.
 */

import { METADATA as templateMetadata } from '../../templates/TEMPLATE_EffectBunker.js';
import { checkContext, checkSource, checkConditions } from '../../bunkers/bunkerUtils.js';

export const METADATA = {
    ...templateMetadata,
    id: 'perk_empoweringLeapingStrike',
    type: 'WEAPON_MASTERY',
    label: 'Empowering Leaping Strike',
    defaultDuration: 3.0,
    defaultValue: 0.2,
    category: 'MISC_DAMAGE',
    conditions: ['ON_ABILITY_HIT:ability_sword_leaping_strike'],
};

export function createEffectBunker(config = {}) {
    const meta = { ...METADATA, ...config };
    return {
        id: meta.id,
        type: meta.type,
        metadata: meta,
        handler: (context) => {
            if (!checkContext(context) || !checkSource(context.source, 'masteries')) {
                return null;
            }
            // Find mastery config for this effect
            const masterySource = context.source.masteries.find(m => m.id === meta.id);
            if (!masterySource) return null;
            // Apply misc damage buff to player for 3 seconds on Leaping Strike hit
            const effectDef = {
                id: meta.id + '_misc',
                name: meta.label,
                category: meta.category,
                value: meta.defaultValue,
                duration: meta.defaultDuration,
                expiresAt: context.timestamp + meta.defaultDuration,
                sourceName: context.source.name,
                conditions: meta.conditions,
            };
            if (checkConditions(meta.conditions, context)) {
                return { applyEffects: [effectDef] };
            }
            return null;
        }
    };
}

export default createEffectBunker();
