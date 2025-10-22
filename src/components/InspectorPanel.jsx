import React, { useState } from 'react';

// Sub-component for the new "Raw State" tab
const EffectsTable = ({ title, effects, combatantState }) => (
    <div>
        <h4 className="text-lg font-semibold text-slate-300 mb-2 border-b border-slate-600 pb-1">{title}</h4>
        {effects && effects.length > 0 ? (
            <table className="min-w-full text-xs text-left">
                <thead className="text-slate-400">
                    <tr>
                        <th className="p-1.5 font-semibold">Source Name</th>
                        <th className="p-1.5 font-semibold">Effect ID</th>
                        <th className="p-1.5 font-semibold text-right">Value</th>
                        <th className="p-1.5 font-semibold text-right">Duration</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                    {effects.map((effect, index) => {
                        // Special handling for HEAL category
                        let displayValue;
                        if (effect.category === 'HEAL' && effect.metadata?.healType === 'percent') {
                            // Calculate actual HP healed
                            const baseHealth = combatantState?.baseHealth || combatantState?.maxHealth || 3000;
                            const healAmount = Math.round(effect.value * baseHealth);
                            displayValue = `${healAmount} HP`;
                        } else if (effect.value !== undefined) {
                            displayValue = `${(effect.value * 100).toFixed(0)}%`;
                        } else {
                            displayValue = effect.valueFormula || 'N/A';
                        }

                        return (
                            <tr key={index} className="font-mono">
                                <td className="p-1.5 whitespace-nowrap">{effect.sourceName || 'Unknown'}</td>
                                <td className="p-1.5 whitespace-nowrap text-cyan-400">{effect.statusId || effect.id}</td>
                                <td className="p-1.5 whitespace-nowrap text-right text-amber-400">{displayValue}</td>
                                <td className="p-1.5 whitespace-nowrap text-right">{
    typeof effect.duration === 'number'
        ? (effect.duration === Infinity ? '∞' : effect.duration.toFixed(1))
        : effect.duration || 'N/A'
}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        ) : (
            <p className="text-slate-500 italic px-2 py-4">No active effects.</p>
        )}
    </div>
);

// Sub-component for the "Summary" tab (Placeholder)
const SummaryTab = ({ logEntry, combatantState, targetState }) => (
    <div className="p-4">
        <h3 className="text-xl font-bold text-amber-400 mb-4">Combat Event Summary</h3>
        <div className="mb-4">
            <div className="text-slate-400 mb-2">Action: <span className="font-mono">{logEntry.action}</span></div>
            <div className="text-slate-400 mb-2">Timestamp: <span className="font-mono">{logEntry.timestamp?.toFixed(1)}s</span></div>
        </div>

        {/* Total Damage & Breakdown */}
        <div className="mb-6">
            <h4 className="text-lg font-semibold text-red-400 mb-2">Total Damage</h4>
            <div className="text-2xl font-bold text-red-300 mb-2">{logEntry.totalDamage ?? logEntry.damage ?? 0}</div>
            {Array.isArray(logEntry.damageBreakdown) && logEntry.damageBreakdown.length > 0 ? (
                <table className="min-w-full text-xs text-left mb-2">
                    <thead className="text-slate-400">
                        <tr>
                            <th className="p-1.5 font-semibold">Source</th>
                            <th className="p-1.5 font-semibold">Type</th>
                            <th className="p-1.5 font-semibold text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {logEntry.damageBreakdown.map((src, idx) => (
                            <tr key={idx} className="font-mono">
                                <td className="p-1.5 whitespace-nowrap">{src.sourceName || src.source || 'Unknown'}</td>
                                <td className="p-1.5 whitespace-nowrap text-cyan-400">{src.type || src.category || 'Effect'}</td>
                                <td className="p-1.5 whitespace-nowrap text-right text-red-400">{src.amount ?? src.value ?? 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="text-slate-500 italic px-2 py-2">No breakdown available.</p>
            )}
        </div>

        {/* Total Healing & Breakdown */}
        <div className="mb-6">
            <h4 className="text-lg font-semibold text-green-400 mb-2">Total Healing</h4>
            <div className="text-2xl font-bold text-green-300 mb-2">{
                Array.isArray(logEntry.healing)
                    ? logEntry.healing.reduce((sum, h) => {
                        if (h.valueType === 'baseHealth') {
                            // Find the target's baseHealth (should be Player for self-heals)
                            const target = h.targetId === 'Player' ? combatantState : h.targetId === 'Target Dummy' ? targetState : null;
                            const baseHealth = target && (target.baseHealth || target.maxHealth || 0);
                            return sum + (typeof h.value === 'number' ? h.value * baseHealth : 0);
                        }
                        return sum + (typeof h.value === 'number' ? h.value : 0);
                    }, 0)
                    : (logEntry.totalHealing ?? logEntry.healing ?? 0)
            }</div>
            {Array.isArray(logEntry.healing) && logEntry.healing.length > 0 ? (
                <table className="min-w-full text-xs text-left mb-2">
                    <thead className="text-slate-400">
                        <tr>
                            <th className="p-1.5 font-semibold">Target</th>
                            <th className="p-1.5 font-semibold">Type</th>
                            <th className="p-1.5 font-semibold text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {logEntry.healing.map((h, idx) => {
                            let amount = h.value;
                            if (h.valueType === 'baseHealth') {
                                const target = h.targetId === 'Player' ? combatantState : h.targetId === 'Target Dummy' ? targetState : null;
                                const baseHealth = target && (target.baseHealth || target.maxHealth || 0);
                                amount = typeof h.value === 'number' ? h.value * baseHealth : 0;
                            }
                            return (
                                <tr key={idx} className="font-mono">
                                    <td className="p-1.5 whitespace-nowrap">{h.targetId || 'Unknown'}</td>
                                    <td className="p-1.5 whitespace-nowrap text-cyan-400">{h.valueType || 'HEAL'}</td>
                                    <td className="p-1.5 whitespace-nowrap text-right text-green-400">{amount}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            ) : (
                <p className="text-slate-500 italic px-2 py-2">No healing breakdown available.</p>
            )}
        </div>
    </div>
);

// Sub-component for the new "Raw State" tab
const RawStateTab = ({ combatantState, targetState, logEntry }) => {
    const [isJsonVisible, setIsJsonVisible] = useState(false);

    // Helper to synthesize computed damage modifiers for display
    function getComputedEffects(state, snapshotEffects, miscPercent) {
        let effects = Array.isArray(state?.activeEffects) && state.activeEffects.length > 0
            ? [...state.activeEffects]
            : Array.isArray(snapshotEffects) ? [...snapshotEffects] : [];
        // Only add miscDmgPercent if not already present and nonzero
        const hasMisc = effects.some(e => e.id === 'computed_misc_damage');
        if (miscPercent && miscPercent !== 0 && !hasMisc) {
            effects.push({
                sourceName: state?.name || 'Computed',
                id: 'computed_misc_damage',
                value: miscPercent,
                duration: null,
            });
        }
        return effects;
    }

    // Use snapshot if combatantState.activeEffects is empty
    const playerEffects = getComputedEffects(
        combatantState,
        logEntry?.snapshot?.combatant?.activeEffects,
        combatantState?.miscDmgPercent || logEntry?.snapshot?.combatant?.miscDmgPercent
    ).filter(e => e.duration !== 0); // Filter out instant effects
    
    const targetEffects = getComputedEffects(
        targetState,
        logEntry?.snapshot?.target?.activeEffects,
        targetState?.miscDmgPercent || logEntry?.snapshot?.target?.miscDmgPercent
    ).filter(e => e.duration !== 0); // Filter out instant effects

    return (
        <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EffectsTable title="Player Active Effects" effects={playerEffects} combatantState={combatantState} />
                <EffectsTable title="Target Active Effects" effects={targetEffects} combatantState={targetState} />
            </div>
            
            {/* The JSON "Escape Hatch" */}
            <div>
                <button 
                    onClick={() => setIsJsonVisible(!isJsonVisible)}
                    className="text-sm text-slate-400 hover:text-cyan-400 transition"
                >
                    {isJsonVisible ? 'Hide' : 'Show'} Full Snapshot Data
                </button>
                {isJsonVisible && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                        <pre className="text-xs bg-black/30 p-2 rounded-md overflow-x-auto custom-scrollbar">
                            {JSON.stringify({ combatantState }, null, 2)}
                        </pre>
                        <pre className="text-xs bg-black/30 p-2 rounded-md overflow-x-auto custom-scrollbar">
                            {JSON.stringify({ targetState }, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Main InspectorPanel Component ---
const InspectorPanel = ({ logEntry, combatantState, targetState, onClose }) => {
    const [activeTab, setActiveTab] = useState('rawState'); // Default to the new tab

    if (!logEntry) return null;

    return (
        // This is a modal-style overlay
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50 rounded-t-xl flex-shrink-0">
                    <h2 className="text-2xl font-semibold text-cyan-300 flex items-center gap-3">
                        Inspector: <span className="text-white">{logEntry.action}</span>
                        <span className="text-sm font-mono bg-slate-700 text-yellow-300 px-2 py-0.5 rounded">@{logEntry.timestamp.toFixed(1)}s</span>
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl leading-none">&times;</button>
                </div>
                
                {/* Tab Navigation */}
                <div className="flex border-b border-slate-700 flex-shrink-0">
                    <button onClick={() => setActiveTab('summary')} className={`tab px-4 py-2 font-semibold border-b-2 transition ${activeTab === 'summary' ? 'active' : 'border-transparent text-slate-400 hover:bg-slate-700/50'}`}>
                        Summary
                    </button>
                    <button onClick={() => setActiveTab('rawState')} className={`tab px-4 py-2 font-semibold border-b-2 transition ${activeTab === 'rawState' ? 'active' : 'border-transparent text-slate-400 hover:bg-slate-700/50'}`}>
                        Raw State
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    {activeTab === 'summary' && <SummaryTab logEntry={logEntry} combatantState={combatantState} targetState={targetState} />}
                    {activeTab === 'rawState' && <RawStateTab combatantState={combatantState} targetState={targetState} logEntry={logEntry} />}
                </div>
            </div>
        </div>
    );
};

export default InspectorPanel;
