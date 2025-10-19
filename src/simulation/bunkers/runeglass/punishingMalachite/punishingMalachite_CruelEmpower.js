/**
 * @file punishingMalachite_CruelEmpower.js
 * @description Factory bunker for Punishing Cruel: +14% empower damage against targets affected by Crowd Control effects.
 */

import { METADATA as templateMetadata, createEffectBunker as templateCreateEffectBunker } from '../../templates/TEMPLATE_EffectBunker.js';
import { BUNKER_METADATA_SCHEMA, validateSchema } from '../../../schema.js';
import { checkContext, checkSource, checkConditions } from '../../bunkerUtils.js';

export const METADATA = {
    ...templateMetadata,
    id: 'runeglass_malachite_cruel_empower',
    type: 'RUNEGLASS',
    label: 'Runeglass of Punishing Malachite (Punishing Cruel)',
    description: '+14% empower damage against targets affected by Crowd Control effects.',
    amount: 0.14,
    eventType: 'CONDITIONAL',
    damageType: 'EMPOWER',
    category: 'EMPOWER',
    conditions: ['TARGET_HAS_CC'],
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
            console.log('[PUNISHING CRUEL DEBUG] Handler called with context:', JSON.parse(JSON.stringify(context)));
            if (!checkContext(context)) {
                console.log('[PUNISHING CRUEL DEBUG] Context check failed.');
                return null;
            }
            const conditionsMet = checkConditions(meta.conditions, context);
            console.log('[PUNISHING CRUEL DEBUG] Conditions met:', conditionsMet);
            if (!conditionsMet) {
                console.log('[PUNISHING CRUEL DEBUG] Condition TARGET_HAS_CC not met. No empower applied.');
                return null;
            }
            console.log('[PUNISHING CRUEL DEBUG] Condition met. Applying empower effect:', meta.amount);
            return {
                applyEffects: [{
                    id: meta.id + '_empower',
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
