/**
 * @file TEMPLATE_StatBunker.js
 * @description Blueprint for a "Stat Bunker". This is for passive, "Always On" bonuses
 * that are calculated once at the start of combat.
 */

export const METADATA = {
    id: 'TEMPLATE_STAT_ID',
    type: 'STAT', // This is critical for the engine to load it correctly
};

const templateStatBunker = (context, config = {}) => {
    if (!context || !context.source) return null;
    // implement stat calculation logic here in concrete bunkers
    return null;
};

export default templateStatBunker;

export function createStatBunker(config = {}) {
    return {
        id: config.id || METADATA.id,
        type: 'STAT',
        metadata: { ...METADATA, ...config },
        handler: (context) => templateStatBunker(context, config)
    };
}
