
// Empowering Leaping Strike Modifier Bunker (template-driven)
import { createModifierBunker } from '../../templates/TEMPLATE_ModifierBunker.js';

export const METADATA = {
    id: 'perk_empoweringLeapingStrike',
    type: 'PERK',
    label: 'Empowering Leaping Strike',
    description: 'Grants bonus damage on Leaping Strike hit.',
    amount: 0.2, // 20% bonus
    eventType: 'ABILITY_HIT',
    abilityId: 'ability_sword_leaping_strike',
    damageType: 'MISC_DAMAGE',
};

const empoweringLeapingStrike = createModifierBunker(METADATA);
export default empoweringLeapingStrike;
