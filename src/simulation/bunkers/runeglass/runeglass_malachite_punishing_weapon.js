import { hasEffectByCategory } from '../../stateUtils.js';

const PERK_ID = 'perkid_runeglassgem_crueladd_melee';

const damageBonusVsCCEffect = {
    id: 'effect_runeglass_punishing_vs_cc',
    name: 'Runeglass Punishing vs. CC',
    category: 'EMPOWER',
    statusId: 'EMPOWER',
    duration: 0, 
    valueFormula: '14',
    scalingPerGearScore: '',
};

const meleeDamageBonusEffect = {
    id: 'effect_runeglass_punishing_melee_bonus',
    name: 'Runeglass Punishing Melee Bonus',
    category: 'UNCAPPED_DAMAGE',
    statusId: 'UNCAPPED_DAMAGE',
    duration: 0,
    valueFormula: '2',
    scalingPerGearScore: '',
};

export const handleRuneglassMalachitePunishingWeapon = (context) => {
    const isEquipped = context.source.perks?.some(p => p.id === PERK_ID);
    if (!isEquipped) {
        return;
    }

    if (!context.attack) return;

    // --- DEFINITIVE FIX V4 ---
    // Check if the target has a CC effect from a *previous* event.
    const ccEffect = context.target.activeEffects.find(e => e.categories?.includes('CC') && e.timestamp < context.timestamp);

    if (ccEffect) {
        context.source.activeEffects.push({ ...damageBonusVsCCEffect });
    }
    
    if (context.attack.isMelee) {
        context.source.activeEffects.push({ ...meleeDamageBonusEffect });
    }
};

