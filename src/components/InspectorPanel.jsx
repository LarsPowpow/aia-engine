import React from 'react';

// Helper component for rendering a list of effects with consistent styling.
const EffectList = ({ title, effects, valueKey, unit = '%', textColor = 'text-cyan-400' }) => {
    return (
        <div>
            <h4 className="font-semibold text-slate-300 border-b border-slate-600 mb-2 pb-1">{title}</h4>
            {effects.length > 0 ? (
                <ul className="space-y-1 text-sm">
                    {effects.map(effect => (
                        <li key={effect.id} className="flex justify-between items-center bg-slate-800/50 p-1 rounded">
                            <span className="text-slate-400">{effect.name}</span>
                            <span className={`font-mono font-bold ${textColor}`}>
                                {`${(Math.abs(parseFloat(effect[valueKey])) * 100).toFixed(0)}${unit}`}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-slate-500 italic">None</p>
            )}
        </div>
    );
};

export default function InspectorPanel({ logEntry, combatantState, targetState, onClose }) {
    if (!logEntry) return null;

    const { action, timestamp } = logEntry;

    // Filter effects from the state snapshots for display
    const empowerEffects = combatantState.activeEffects.flatMap(e => 
        e.modifications?.filter(m => m.statToModify === 'OUTGOING_DAMAGE_MODIFIER' && parseFloat(m.valueFormula) > 0)
        .map(m => ({ ...e, value: m.valueFormula })) || []
    );
    const weakenEffects = combatantState.activeEffects.flatMap(e => 
        e.modifications?.filter(m => m.statToModify === 'OUTGOING_DAMAGE_MODIFIER' && parseFloat(m.valueFormula) < 0)
        .map(m => ({ ...e, value: m.valueFormula })) || []
    );
    
    const rendEffects = targetState.activeEffects.flatMap(e => 
        e.modifications?.filter(m => m.statToModify === 'INCOMING_DAMAGE_MODIFIER' && parseFloat(m.valueFormula) > 0)
        .map(m => ({ ...e, value: m.valueFormula })) || []
    );
    const fortifyEffects = targetState.activeEffects.flatMap(e => 
        e.modifications?.filter(m => m.statToModify === 'INCOMING_DAMAGE_MODIFIER' && parseFloat(m.valueFormula) < 0)
        .map(m => ({ ...e, value: m.valueFormula })) || []
    );
    
    const dotEffects = targetState.activeEffects.filter(e => e.category === 'PROC_DAMAGE' && e.duration > 0);

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
                    <div className="font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded-md text-lg">@{timestamp.toFixed(2)}s</div>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700 space-y-4">
                        <h3 className="text-xl font-semibold text-green-400">Combatant State</h3>
                        <EffectList title="Empower" effects={empowerEffects} valueKey="value" textColor="text-green-400" />
                        <EffectList title="Weaken" effects={weakenEffects} valueKey="value" textColor="text-orange-400" />
                    </div>

                    <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700 space-y-4">
                        <h3 className="text-xl font-semibold text-red-400">Target State</h3>
                        <EffectList title="Rend" effects={rendEffects} valueKey="value" textColor="text-red-400" />
                        <EffectList title="Fortify" effects={fortifyEffects} valueKey="value" textColor="text-blue-400" />
                        <EffectList title="Damage over Time (DoTs)" effects={dotEffects} valueKey="valueFormula" unit="% WPN DMG" textColor="text-purple-400" />
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700 flex-shrink-0 text-right">
                    <button 
                        onClick={onClose}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};