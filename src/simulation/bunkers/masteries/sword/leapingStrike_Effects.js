/**
 * @file leapingStrike_Effects.js
 * @description Mass-producible effect bunker for Empowering Leaping Strike (template-driven).
 * @version 1.0.0
 */

import { METADATA as templateMetadata, createEffectBunker as templateCreateEffectBunker } from '../../templates/TEMPLATE_EffectBunker.js';
import { BUNKER_METADATA_SCHEMA, validateSchema } from '../../../schema.js';
import { checkContext, checkSource, checkConditions } from '../../bunkerUtils.js';

export const METADATA = {
    ...templateMetadata,
    id: 'perk_empoweringLeapingStrike',
    type: 'WEAPON_MASTERY',
    label: 'Empowering Leaping Strike',
    description: 'Grants bonus damage on Leaping Strike hit.',
    amount: 0.2, // 20% bonus
    eventType: 'ABILITY_HIT',
    abilityId: 'ability_sword_leaping_strike',
    damageType: 'MISC_DAMAGE',
    category: 'MISC_DAMAGE',
    conditions: ['ON_ABILITY_HIT:ability_sword_leaping_strike'],
    defaultDuration: 3.0,
};
validateSchema(METADATA, BUNKER_METADATA_SCHEMA);

export function createEffectBunker(config = {}) {
    const meta = { ...METADATA, ...config };
    validateSchema(meta, BUNKER_METADATA_SCHEMA);
    return {
        id: meta.id,
        type: meta.type,
        metadata: meta,
        handler: (context) => {
            console.log('[ELS Effect Bunker] Handler called:', {
                eventType: context.eventType,
                abilityId: context.abilityId,
                source: context.source,
                target: context.target,
                masteries: context.source?.masteries,
                conditions: meta.conditions
            });
            if (!checkContext(context) || !checkSource(context.source, 'perks')) {
                console.log('[ELS Effect Bunker] Context/source check failed (perks)');
                return null;
            }
            const perkSource = context.source.perks.find(p => p.id === meta.id);
            if (!perkSource) {
                console.log('[ELS Effect Bunker] Perk not found:', meta.id);
                return null;
            }
            if (!checkConditions(meta.conditions, context)) {
                console.log('[ELS Effect Bunker] Conditions not met:', meta.conditions);
                return null;
            }
            console.log('[ELS Effect Bunker] Applying effect:', {
                id: meta.id + '_misc',
                value: meta.amount,
                duration: meta.defaultDuration
            });
            return {
                applyEffects: [{
                    id: meta.id + '_misc',
                    name: meta.label,
                    category: meta.category,
                    value: meta.amount,
                    duration: meta.defaultDuration,
                    expiresAt: context.timestamp + meta.defaultDuration,
                    sourceName: context.source.name,
                    conditions: meta.conditions,
                }]
            };
        }
    };
}

export default createEffectBunker();
