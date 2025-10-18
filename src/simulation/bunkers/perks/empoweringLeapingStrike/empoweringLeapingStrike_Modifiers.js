/**
 * @file empoweringLeapingStrike_Modifiers.js
 * @description "Dumb Brick" implementation for the Empowering Leaping Strike perk.
 * @version 5.0.0 (Final Architecture)
 */

import { METADATA as templateMetadata } from '../../templates/TEMPLATE_ModifierBunker.js';
import { checkContext, checkSource, checkConditions } from '../../bunkerUtils.js';

export const METADATA = {
    ...templateMetadata,
    id: 'perk_empoweringLeapingStrike',
    type: 'PERK',
};

const handler = (context) => {
    if (!checkContext(context) || !checkSource(context.source, 'perks')) {
        return null;
    }

    const { source } = context;
    const modifiers = [];

    for (const sourcePerk of source.perks) {
        if (sourcePerk.id !== METADATA.id || !sourcePerk.effects) {
            continue;
        }

        for (const effectDef of sourcePerk.effects) {
            // Pass the specific source perk instance to the context for location checks
            const localContext = { ...context, sourcePerkLocation: sourcePerk.slot }; 
            if (checkConditions(effectDef.conditions, localContext)) {
                modifiers.push({
                    category: effectDef.category,
                    value: parseFloat(effectDef.valueFormula) || 0,
                    sourceId: METADATA.id,
                });
            }
        }
    }

    return modifiers.length > 0 ? { modifyDamage: modifiers } : null;
};

export default handler;
