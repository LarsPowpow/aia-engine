/**
 * @file punishingMalachite_Modifiers.js
 * @description Modifier Bunker for Runeglass of Punishing Malachite. Handles conditional damage.
 * @version 1.0.0
 */
import { METADATA } from './METADATA.js';
// Fix: templates live two levels up from this folder
import { createModifierBunker } from '../../templates/TEMPLATE_ModifierBunker.js';

const punishingMalachite_Modifiers = createModifierBunker({
    id: METADATA.id,
    // Define the categories this Modifier Bunker is responsible for.
    modifierCategories: [
         'MISC_DAMAGE'
    ],
});

export default punishingMalachite_Modifiers;
