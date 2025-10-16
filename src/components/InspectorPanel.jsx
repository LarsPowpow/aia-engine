// Filepath: src/components/InspectorPanel.jsx
import React from 'react';

// Helper component for rendering the total stat value.
const TotalStat = ({ label, value, unit = '%' }) => (
    <div className="mt-2 pt-2 border-t border-slate-600">
        <div className="flex justify-between items-baseline">
            <span className="font-bold text-slate-300">{label}</span>
            <span className="font-mono text-xl font-bold text-yellow-300">{value.toFixed(0)}{unit}</span>
        </div>
    </div>
);


// Helper component for rendering a list of effects with consistent styling.
const EffectList = ({ title, effects, valueKey, unit = '%', textColor = 'text-cyan-400', totalValue }) => {
    return (
        <div>
            <h4 className="font-semibold text-slate-300 border-b border-slate-600 mb-2 pb-1">{title}</h4>
            {effects && effects.length > 0 ? (
                <ul className="space-y-1 text-sm">
                    {effects.map((effect, index) => {
                        // --- FIX START ---
                        // The value to display is now consistently passed in the 'displayValue' property.
                        const displayValue = (Math.abs(parseFloat(effect.displayValue || 0))).toFixed(0);
                        // --- FIX END ---
                        return (
                            <li key={effect.id || index} className="flex justify-between items-center bg-slate-800/50 p-1 rounded">
                                <span className="text-slate-400">{effect.name}</span>
                                <span className={`font-mono font-bold ${textColor}`}>
                                    {`${displayValue}${unit}`}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="text-sm text-slate-500 italic">None</p>
            )}
            <TotalStat label={`Total ${title}`} value={totalValue} />
        </div>
    );
};

export default function InspectorPanel({ logEntry, combatantState, targetState, onClose }) {
    if (!logEntry) return null;

    const { action, timestamp, damage } = logEntry;
    
    // --- FIX START ---
    // This logic is now robust. It correctly identifies and processes BOTH complex effects
    // with a nested `modifications` array AND simple `STAT_MODIFIER` effects.
    const empowerEffects = combatantState.activeEffects?.flatMap(effect => {
        // Case 1: Complex effects (e.g., from a STATUS_EFFECT)
        if (effect.modifications) {
            return effect.modifications
                .filter(m => m.statToModify === 'OUTGOING_DAMAGE_MODIFIER' && parseFloat(m.valueFormula) > 0)
                .map(m => ({
                    id: `${effect.id}-${m.statToModify}`, // Create a more unique key for React
                    name: effect.name,
                    displayValue: m.valueFormula
                }));
        }
        // Case 2: Simple passive effects (e.g., Canary's Blessing)
        if (effect.category === 'STAT_MODIFIER' && effect.statusId === 'EMPOWER') {
            return [{
                id: effect.id,
                name: effect.name,
                displayValue: effect.valueFormula
            }];
        }
        return []; // Return an empty array for effects that don't match
    }) || [];
    // --- FIX END ---

    // Note: The filtering logic for other effects remains unchanged for now, but will need a similar upgrade in the future.
    const fortifyEffects = combatantState.activeEffects?.flatMap(e => 
        e.modifications?.filter(m => m.statToModify === 'INCOMING_DAMAGE_MODIFIER' && parseFloat(m.valueFormula) < 0)
        .map(m => ({ ...e, displayValue: m.valueFormula })) || []
    ) || [];
    
    const uncappedDamageEffects = combatantState.activeEffects?.filter(e => e.category === 'DAMAGE_MODIFIER').map(e => ({...e, displayValue: e.valueFormula})) || [];
    
    const rendEffects = targetState.activeEffects?.flatMap(e => 
        e.modifications?.filter(m => m.statToModify === 'INCOMING_DAMAGE_MODIFIER' && parseFloat(m.valueFormula) > 0)
        .map(m => ({ ...e, displayValue: m.valueFormula })) || []
    ) || [];

    const weakenEffects = targetState.activeEffects?.flatMap(e => 
        e.modifications?.filter(m => m.statToModify === 'OUTGOING_DAMAGE_MODIFIER' && parseFloat(m.valueFormula) < 0)
        .map(m => ({ ...e, displayValue: m.valueFormula })) || []
    ) || [];
        
    const dotEffects = targetState.activeEffects?.filter(e => e.category === 'PROC_DAMAGE' && e.duration > 0).map(e => ({...e, displayValue: e.valueFormula})) || [];

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={onClose}
        >
            <div 
                className="bg-slate-900 border border-cyan-500/30 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-cyan-400">Inspector: <span className="text-white">{action}</span></h2>
                    <div className="font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded-md text-lg">
                        @{typeof timestamp === 'number' ? timestamp.toFixed(2) : '0.00'}s
                    </div>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Combatant State */}
                    <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700 space-y-4">
                        <h3 className="text-xl font-semibold text-green-400 mb-4 border-b border-slate-600 pb-2">Combatant State</h3>
                        <div className="mb-4">
                            <h4 className="font-semibold text-slate-300 mb-1">Healing Done</h4>
                            <p className="text-3xl font-bold text-green-400 font-mono">
                                {combatantState.stats?.healingDone || 0}
                            </p>
                        </div>
                        <EffectList title="Empower" effects={empowerEffects} textColor="text-green-400" totalValue={combatantState.stats.empower || 0} />
                        <EffectList title="Fortify" effects={fortifyEffects} textColor="text-blue-400" totalValue={combatantState.stats.fortify || 0} />
                        <EffectList title="Uncapped Damage %" effects={uncappedDamageEffects} textColor="text-yellow-400" totalValue={combatantState.stats.miscDmg || 0} />
                    </div>

                    {/* Target State */}
                    <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700 space-y-4">
                        <h3 className="text-xl font-semibold text-red-400 mb-4 border-b border-slate-600 pb-2">Target State</h3>
                        <div className="mb-4">
                            <h4 className="font-semibold text-slate-300 mb-1">Damage Dealt</h4>
                            <p className="text-3xl font-bold text-red-400 font-mono">{damage !== undefined ? damage : 'N/A'}</p>
                        </div>
                        <EffectList title="Rend" effects={rendEffects} textColor="text-red-400" totalValue={targetState.stats.rend || 0} />
                        <EffectList title="Weaken" effects={weakenEffects} textColor="text-orange-400" totalValue={targetState.stats.weaken || 0} />
                        <EffectList title="Damage over Time (DoTs)" effects={dotEffects} unit="% WPN DMG" textColor="text-purple-400" totalValue={0} />
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700 flex-shrink-0 text-right">
                    <button onClick={onClose} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg transition">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
