import React, { useState } from 'react';

// Sub-component for the new "Raw State" tab
const EffectsTable = ({ title, effects }) => (
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
                    {effects.map((effect, index) => (
                        <tr key={index} className="font-mono">
                            <td className="p-1.5 whitespace-nowrap">{effect.sourceName || 'Unknown'}</td>
                            <td className="p-1.5 whitespace-nowrap text-cyan-400">{effect.statusId || effect.id}</td>
                            <td className="p-1.5 whitespace-nowrap text-right text-amber-400">{effect.valueFormula || 'N/A'}</td>
                            <td className="p-1.5 whitespace-nowrap text-right">{effect.duration === Infinity ? '∞' : effect.duration?.toFixed(1) || 'N/A'}</td>
                        </tr>
                    ))}
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
        <p>This is a placeholder for the original summary view.</p>
        <p className="mt-2 text-slate-400">Action: <span className="font-mono">{logEntry.action}</span></p>
        <p className="text-slate-400">Damage: <span className="font-mono">{logEntry.damage}</span></p>
    </div>
);

// Sub-component for the new "Raw State" tab
const RawStateTab = ({ combatantState, targetState }) => {
    const [isJsonVisible, setIsJsonVisible] = useState(false);

    return (
        <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EffectsTable title="Player Active Effects" effects={combatantState?.activeEffects} />
                <EffectsTable title="Target Active Effects" effects={targetState?.activeEffects} />
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
                    {activeTab === 'rawState' && <RawStateTab combatantState={combatantState} targetState={targetState} />}
                </div>
            </div>
        </div>
    );
};

export default InspectorPanel;
