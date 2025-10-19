/**
 * @file punishingMalachite_ArmorMisc.js
 * @description Factory bunker for Punishing Spectral Ward (Armor): +1% melee damage (always on).
 */

import { METADATA as templateMetadata, createEffectBunker as templateCreateEffectBunker } from '../../templates/TEMPLATE_EffectBunker.js';
import { BUNKER_METADATA_SCHEMA, validateSchema } from '../../../schema.js';
import { checkContext, checkSource, checkConditions } from '../../bunkerUtils.js';

export const METADATA = {
    ...templateMetadata,
    id: 'runeglass_malachite_armor_misc',
    type: 'RUNEGLASS',
    label: 'Runeglass of Punishing Malachite (Armor)',
    description: 'Armor Socket: Your melee attacks deal +1% damage.',
    amount: 0.01,
    eventType: 'PASSIVE',
    damageType: 'MISC_DAMAGE',
    category: 'MISC_DAMAGE',
    conditions: [],
    defaultDuration: Infinity,
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
            if (!checkContext(context)) return null;
            // Always-on effect: no conditions
            return {
                applyEffects: [{
                    id: meta.id + '_misc',
                    name: meta.label,
                    category: meta.category,
                    value: meta.amount,
                    duration: meta.defaultDuration,
                    expiresAt: Infinity,
                    sourceName: context.source?.name,
                    conditions: meta.conditions,
                }]
            };
        }
    };
}

export default createEffectBunker();
