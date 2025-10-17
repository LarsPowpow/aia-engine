import { hasEffectById } from '../../../stateUtils.js';

const MASTERY_ID = 'upgrade_sword_leapingstrike_slow';

const slowEffect = {
    id: 'effect_cowardly_punishment_slow',
    name: 'Cowardly Punishment - Slow',
    category: 'DEBUFF',
    type: 'Mastery',
    statusId: 'SLOW',
    valueFormula: '30',
    duration: 3,
    scalingPerGearScore: '',
    categories: ['CC', 'SLOW'],
};

export const handleCowardlyPunishment = (context) => {
    const isEquipped = context.source.masteries?.some(m => m.id === MASTERY_ID);
    if (!isEquipped) {
        return;
    }

    if (context.attack?.abilityId === 'ability_sword_leaping_strike') {
        const effectInstance = { ...slowEffect };
        // --- DEFINITIVE FIX V4 ---
        // Stamp the application time on the effect instance.
        effectInstance.timestamp = context.timestamp;
        effectInstance.expiresAt = context.timestamp + effectInstance.duration;
        context.target.activeEffects.push(effectInstance);
    }
};

