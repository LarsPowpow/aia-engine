/**
 * @file METADATA.js
 * @description Shared metadata for the Punishing Malachite Runeglass Bunkers.
 * @version 1.0.0
 */
import { BUNKER_METADATA_SCHEMA, validateSchema } from '../../../../schema.js';
export const METADATA = {
    id: 'runeglass_gem_malachite_melee',
    type: 'RUNEGLASS',
    label: 'Punishing Malachite',
    description: 'Grants bonus damage when equipped.',
    amount: 0.15,
    eventType: 'ABILITY_HIT',
    abilityId: null,
    damageType: 'MISC_DAMAGE',
    category: 'MISC_DAMAGE',
    conditions: [],
};
validateSchema(METADATA, BUNKER_METADATA_SCHEMA);
