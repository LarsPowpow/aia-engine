/**
 * Auto-generated Effect Bunker
 */
import { METADATA as templateMetadata, createEffectBunker as templateCreateEffectBunker } from '../templates/TEMPLATE_EffectBunker.js';
import { BUNKER_METADATA_SCHEMA, validateSchema } from '../../schema.js';
import { checkContext, checkSource, checkConditions } from '../bunkerUtils.js';

export const METADATA = {
  "id": "perk_healing_defense_ii",
  "type": "PERK",
  "bucket": "fixed_perk",
  "label": "Healing Defense II",
  "name": "Healing Defense II",
  "description": "On Block: Heal for 2.5% base health (5s cooldown).",
  "event": "onBlock",
  "condition": {
    "type": "activeItem",
    "itemType": "Kite Shield"
  },
  "cooldown": 5,
  "effects": [
    {
      "type": "heal",
      "value": 0.025,
      "valueType": "baseHealth",
      "target": "self"
    }
  ],
  "labels": [
    "D_Fixed_Shield_Kite_OnBlock"
  ],
  "perk_bucket": "fixed_perk"
};
validateSchema(METADATA, BUNKER_METADATA_SCHEMA);

export default templateCreateEffectBunker(METADATA);
