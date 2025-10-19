/**
 * Auto-generated Effect Bunker
 */
import { METADATA as templateMetadata, createEffectBunker as templateCreateEffectBunker } from '../templates/TEMPLATE_EffectBunker.js';
import { BUNKER_METADATA_SCHEMA, validateSchema } from '../../schema.js';
import { checkContext, checkSource, checkConditions } from '../bunkerUtils.js';

export const METADATA = {
  "id": "perk_counter_attack_empower",
  "type": "PERK",
  "label": "Counter Attack",
  "description": "On Block: Gain a 20% Empower for 4s.",
  "defaultValue": 0.2,
  "defaultDuration": 4,
  "eventType": "BLOCK_START",
  "category": "EMPOWER",
  "conditions": [
    "ON_BLOCK"
  ]
};
validateSchema(METADATA, BUNKER_METADATA_SCHEMA);

export default templateCreateEffectBunker(METADATA);
