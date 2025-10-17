import { hasEffectById } from '../../stateUtils.js';

const PERK_ID = 'perkid_weaponmastery_sword_leapingstrike';

const damageBonusEffect = {
    id: 'effect_empowering_leaping_strike_bonus',
    name: 'Empowering Leaping Strike Bonus',
    category: 'UNCAPPED_DAMAGE',
    statusId: 'UNCAPPED_DAMAGE',
    duration: 0,
    valueFormula: '13',
    scalingPerGearScore: '0,725:0.00365',
};

export const handleEmpoweringLeapingStrike = (context) => {
    const isEquipped = context.source.perks?.some(p => p.id === PERK_ID);
    if (!isEquipped) {
        return;
    }

    if (!context.attack) {
        return;
    }

    // --- DEFINITIVE FIX V4 ---
    // Check if the target has the slow effect from a *previous* event.
    const slowEffect = context.target.activeEffects.find(e => e.id === 'effect_cowardly_punishment_slow');
    
    // The effect exists AND it was applied before the current event's timestamp.
    if (slowEffect && slowEffect.timestamp < context.timestamp) {
        context.source.activeEffects.push({ ...damageBonusEffect });
    }
};

