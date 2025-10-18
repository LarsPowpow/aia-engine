/**
 * @file punishingMalachite_Stats.js
 * @description Stat Bunker for Runeglass of Punishing Malachite. Handles passive bonuses.
 * @version 1.0.0
 */
import { METADATA } from './METADATA.js';
import { createStatBunker } from '../../templates/TEMPLATE_StatBunker.js';

const punishingMalachite_Stats = (context) => {
    return createStatBunker({
        id: METADATA.id,
        // Define the categories this Stat Bunker is responsible for.
        statCategories: [
            'PASSIVE_ELE_ABSORPTION',
            'PASSIVE_PHY_ABSORPTION',
            'PASSIVE_MELEE_DMG'
        ],
    })(context);
};

export default punishingMalachite_Stats;
