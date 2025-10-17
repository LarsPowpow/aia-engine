import React from 'react';

const InspectorPanel = ({ logEntry, combatantState, targetState, onClose }) => {
    if (!logEntry) return null;

    // A reusable component meticulously styled to match your exact design.
    const StatBlock = ({ label, stat, colorClass }) => (
        <div className="py-2">
            <p className="text-slate-300 font-semibold">{label}</p>
            <hr className="border-slate-700 my-1" />
            <div className="min-h-[20px] text-sm text-slate-400 pl-2">
                {stat && stat.sources && stat.sources.length > 0 ? (
                    stat.sources.map((source, index) => (
                        <div key={index} className="flex justify-between items-center">
                            <span>{source.name}</span>
                            <span className="font-mono font-bold text-white">{Math.round(source.value)}%</span>
                        </div>
                    ))
                ) : (
                    <p className="text-slate-500">None</p>
                )}
            </div>
            <div className="flex justify-between items-baseline mt-1">
                <p className="text-slate-300 font-semibold">Total {label}</p>
                <p className={`font-mono text-lg font-bold text-amber-400`}>{Math.round(stat ? stat.total : 0)}%</p>
            </div>
        </div>
    );
    
    // A component for stats that do not have a source breakdown.
    const SimpleStat = ({ label, value }) => (
         <div className="py-2">
            <p className="text-slate-300 font-semibold">{label}</p>
             <hr className="border-slate-700 my-1" />
            <div className="min-h-[20px]"></div>
             <div className="flex justify-between items-baseline mt-1">
                <p className="text-slate-300 font-semibold">Total {label}</p>
                <p className="font-mono text-lg font-bold text-amber-400">{value}%</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-slate-900 border-2 border-cyan-500/50 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                
                <div className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-cyan-400">Inspector: <span className="text-white">{logEntry.action}</span></h2>
                        <p className="text-sm text-slate-400 font-mono">@{logEntry.timestamp.toFixed(2)}s</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl font-light leading-none">&times;</button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar">
                    {/* Combatant State */}
                    <div className="flex flex-col space-y-2 p-4 bg-slate-800/60 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-bold text-green-400 border-b border-slate-600 pb-2 mb-2">Combatant State</h3>
                        <div>
                            <p className="text-slate-300 font-semibold">Healing Done (Event)</p>
                            {/* [MOD-FIX] Correctly reading from the logEntry top level for event-specific healing */}
                            <p className="font-mono text-3xl font-bold text-green-400">{logEntry.healingDone || 0}</p>
                        </div>
                        <StatBlock label="Empower" stat={combatantState.stats.empower} />
                        <StatBlock label="Fortify" stat={combatantState.stats.fortify} />
                        {/* [MOD-UPGRADE] Upgraded to a full StatBlock to show uncapped damage sources */}
                        <StatBlock label="Uncapped Damage" stat={combatantState.stats.uncappedDamage} />
                    </div>

                    {/* Target State */}
                    <div className="flex flex-col space-y-2 p-4 bg-slate-800/60 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-bold text-red-400 border-b border-slate-600 pb-2 mb-2">Target State</h3>
                        <div>
                            <p className="text-slate-300 font-semibold">Damage Dealt</p>
                            <p className="font-mono text-3xl font-bold text-red-400">{logEntry.damage}</p>
                        </div>
                        <StatBlock label="Rend" stat={targetState.stats.rend} />
                        <StatBlock label="Weaken" stat={targetState.stats.weaken} />
                        <SimpleStat label="Damage over Time (DoTs)" value={0} />
                    </div>
                </div>
                
                <div className="p-3 bg-slate-900/50 border-t border-slate-700 flex-shrink-0 text-right">
                     <button onClick={onClose} className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-md transition-colors text-sm">Close</button>
                </div>

            </div>
        </div>
    );
};

export default InspectorPanel;
