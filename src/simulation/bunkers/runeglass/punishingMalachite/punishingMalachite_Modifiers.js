/**
 * @file punishingMalachite_Modifiers.js
 * @description Modifier Bunker for Runeglass of Punishing Malachite. Handles conditional damage.
 * @version 1.0.0
 */
import { METADATA } from './METADATA.js';
// Fix: templates live two levels up from this folder
import { createModifierBunker } from '../../templates/TEMPLATE_ModifierBunker.js';

import { BUNKER_METADATA_SCHEMA, validateSchema } from '../../../../schema.js';
validateSchema(METADATA, BUNKER_METADATA_SCHEMA);
const punishingMalachite_Modifiers = createModifierBunker(METADATA);
export default punishingMalachite_Modifiers;
