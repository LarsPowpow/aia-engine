import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { calculateWeaponDamage } from '../simulation/formulas';
import { runSimulation } from '../simulation/engine';
import { midComboBlockChoreography } from '../simulation/choreography';
import ChoreographerPanel from '../components/ChoreographerPanel';
import PerkLoadoutPanel from '../components/PerkLoadoutPanel';
import MasteryLoadoutPanel from '../components/MasteryLoadoutPanel';
import BuildManagerPanel from '../components/BuildManagerPanel';
import OCRScannerPanel from '../components/OCRScannerPanel';
import CommandBar from '../components/CommandBar';
import { db as firestore } from '../services/firebase';
import InspectorPanel from '../components/InspectorPanel';
import CombatLogPanel from '../components/CombatLogPanel';
import RuneglassPanel from '../components/RuneglassPanel'; // <-- IMPORT THE NEW PANEL

// --- Sub-Component: ControlPanel (No Changes) ---
const ControlPanel = ({ attributes, setAttributes, weaponType, setWeaponType, calculatedDamage }) => {
    const handleAttributeChange = (attr, value) => {
        const numValue = value === '' ? '' : parseInt(value, 10);
        if (isNaN(numValue) && value !== '') return;
        setAttributes(prev => ({ ...prev, [attr]: numValue }));
    };
    return (
        <div className="bg-slate-800/40 rounded-xl p-4 flex flex-col space-y-4 border border-slate-700 shadow-lg backdrop-blur-sm">
            <h2 className="text-lg font-bold text-slate-100 border-b border-slate-600 pb-2 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg>Control Console</h2>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700"><label className="text-sm font-medium text-slate-400 mb-2 block">Weapon</label><select value={weaponType} onChange={(e) => setWeaponType(e.target.value)} className="w-full bg-slate-700 border border-slate-600 text-white rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"><option value="Sword">Sword</option><option value="Flail">Flail</option></select></div>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Attributes</h3>
                <div className="grid grid-cols-2 gap-3">{Object.keys(attributes).map(attr => (<div key={attr} className={attr === 'CON' ? 'col-span-2' : ''}><label className="text-xs font-semibold text-slate-400 uppercase">{attr}</label><input type="number" value={attributes[attr]} onChange={(e) => handleAttributeChange(attr, e.target.value)} className="w-full bg-slate-700/80 border border-slate-600 rounded-md p-2 mt-1 focus:bg-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"/></div>))}</div>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-amber-500/30 text-center shadow-inner">
                 <h3 className="font-bold text-amber-400 mb-1 text-sm uppercase tracking-wider">Pre-Flight Analysis</h3>
                 <div className="flex justify-center items-center"><span className="text-4xl font-mono font-bold text-white bg-slate-800/50 px-4 py-1 rounded-md shadow-[0_0_8px_rgba(251,191,36,0.2)]">{calculatedDamage}</span></div>
            </div>
        </div>
    );
};

// --- Sub-Component: CombatAnalysisPanel (No Changes) ---
const CombatAnalysisPanel = ({ combatLog, onRowClick }) => {
    return (
        <div className="flex-grow overflow-auto custom-scrollbar pr-1 h-full">
            <table className="min-w-full text-sm text-left">
                <thead className="bg-black/20 sticky top-0 backdrop-blur-sm z-10">
                    <tr>
                        <th className="p-2 font-semibold text-slate-300">Time</th>
                        <th className="p-2 font-semibold text-slate-300">Source</th>
                        <th className="p-2 font-semibold text-slate-300">Action</th>
                        <th className="p-2 font-semibold text-slate-300">Target</th>
                        <th className="p-2 font-semibold text-slate-300 text-center">Crit?</th>
                        <th className="p-2 font-semibold text-slate-300 text-right">Damage</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                    {combatLog.length === 0 ? ( 
                        <tr><td colSpan="6" className="text-center text-slate-500 py-16">Run a simulation to see the results.</td></tr>
                    ) : (
                        combatLog.map((entry, index) => (
                            <tr key={index} className="hover:bg-slate-700/50 cursor-pointer transition-colors duration-150 even:bg-slate-800/20" onClick={() => onRowClick(index)}>
                                <td className="p-2 whitespace-nowrap text-slate-400 font-mono">{entry.timestamp.toFixed(1)}s</td>
                                <td className="p-2 whitespace-nowrap text-green-400 font-semibold">{entry.source}</td>
                                <td className="p-2 whitespace-nowrap">{entry.action}</td>
                                <td className="p-2 whitespace-nowrap text-red-400 font-semibold">{entry.target}</td>
                                <td className="p-2 whitespace-nowrap text-center">{entry.isCrit ? <span className="font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 shadow-[0_0_5px_rgba(251,191,36,0.5)]">YES</span> : <span className="text-slate-500">no</span>}</td>
                                <td className="p-2 whitespace-nowrap text-right font-bold font-mono text-white">{entry.damage}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};


// --- Main Page Component ---
const CombatSimulatorPage = ({ addLog }) => {
    const [weaponType, setWeaponType] = useState('Sword');
    const [attributes, setAttributes] = useState({ STR: 332, DEX: 36, INT: 5, FOC: 60, CON: 105 });
    const [calculatedDamage, setCalculatedDamage] = useState(0);
    const [combatLog, setCombatLog] = useState([]);
    const [rawEngineLog, setRawEngineLog] = useState([]);
    const [equippedPerks, setEquippedPerks] = useState([]);
    const [equippedMasteries, setEquippedMasteries] = useState([]);
    const [savedBuilds, setSavedBuilds] = useState([]);
    const [buildName, setBuildName] = useState('');
    const [activeAnalysisTab, setActiveAnalysisTab] = useState('analysis');
    const [inspectedIndex, setInspectedIndex] = useState(null);
    const handleRowClick = (index) => setInspectedIndex(index);
    const handleCloseInspector = () => setInspectedIndex(null);


    const fetchBuilds = useCallback(async () => { /* ... no changes ... */ }, [addLog]);
    useEffect(() => { fetchBuilds(); }, [fetchBuilds]);
    const handleSaveBuild = async () => { /* ... no changes ... */ };
    const handleLoadBuild = (buildId) => { /* ... no changes ... */ };

    useEffect(() => {
        const allAttributesValid = Object.values(attributes).every(val => val !== '' && !isNaN(val));
        if (weaponType && allAttributesValid) {
            const damage = calculateWeaponDamage(weaponType, attributes);
            setCalculatedDamage(damage);
        } else {
            setCalculatedDamage(0);
        }
    }, [weaponType, attributes]);

    const handleRunSimulation = async () => {
        addLog({ type: 'info', message: 'Simulation initiated...' });
        const combatant = { id: 'Player', weaponType, attributes, perks: equippedPerks, masteries: equippedMasteries };
        const target = { id: 'Target Dummy', health: 50000 };
        try {
            const { rawLog, analysisLog } = await runSimulation(combatant, target, midComboBlockChoreography, firestore);
            setRawEngineLog(rawLog);
            setCombatLog(analysisLog);
            addLog({ type: 'success', message: 'Simulation complete.' });
        } catch (error) {
            console.error("Simulation failed:", error);
            addLog({ type: 'error', message: `Simulation failed: ${error.message}` });
        }
    };

    const clearCombatLog = () => {
        setCombatLog([]);
        setRawEngineLog([]);
        addLog({ type: 'info', message: 'Combat logs cleared.' });
    };

    return (
        <>
            <style>{`.custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; } .tab.active { color: #22d3ee; border-color: #22d3ee; }`}</style>
            <div className="h-screen flex flex-col p-4 sm:p-6 space-y-4 bg-gradient-to-br from-slate-900 to-slate-800 text-slate-300 font-sans">
                <div className="flex justify-between items-center flex-shrink-0">
                    <h1 className="text-2xl font-bold text-amber-400 tracking-wider">Combat Simulator</h1>
                </div>
                <div className="flex-shrink-0"><CommandBar onRunSimulation={handleRunSimulation} onClearLog={clearCombatLog} isPrimary={true}/></div>
                
                <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                    
                    <div className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar p-1">
                        <PerkLoadoutPanel equippedPerks={equippedPerks} setEquippedPerks={setEquippedPerks} />
                        {/* --- RENDER THE NEW PANEL --- */}
                        <RuneglassPanel equippedPerks={equippedPerks} setEquippedPerks={setEquippedPerks} />
                        <MasteryLoadoutPanel equippedMasteries={equippedMasteries} setEquippedMasteries={setEquippedMasteries} />
                        <ControlPanel attributes={attributes} setAttributes={setAttributes} weaponType={weaponType} setWeaponType={setWeaponType} calculatedDamage={calculatedDamage}/>
                        <BuildManagerPanel savedBuilds={savedBuilds} buildName={buildName} setBuildName={setBuildName} onSaveBuild={handleSaveBuild} onLoadBuild={handleLoadBuild} />
                        <OCRScannerPanel addLog={addLog} setEquippedMasteries={setEquippedMasteries} equippedMasteries={equippedMasteries} />
                        <ChoreographerPanel />
                    </div>

                    <div className="lg:col-span-2 flex flex-col bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
                        <div className="flex border-b border-slate-700 flex-shrink-0">
                            <button onClick={() => setActiveAnalysisTab('analysis')} className={`tab px-4 py-2 font-semibold border-b-2 transition ${activeAnalysisTab === 'analysis' ? 'active' : 'border-transparent text-slate-400 hover:bg-slate-800/50'}`}>
                                Combat Analysis
                            </button>
                            <button onClick={() => setActiveAnalysisTab('log')} className={`tab px-4 py-2 font-semibold border-b-2 transition ${activeAnalysisTab === 'log' ? 'active' : 'border-transparent text-slate-400 hover:bg-slate-800/50'}`}>
                                Live Combat Log
                            </button>
                        </div>
                        
                        <div className="p-4 flex-grow min-h-0">
                            {activeAnalysisTab === 'analysis' && <CombatAnalysisPanel combatLog={combatLog} onRowClick={handleRowClick} />}
                            {activeAnalysisTab === 'log' && <CombatLogPanel log={rawEngineLog} />}
                        </div>
                    </div>
                </div>
            </div>

            {inspectedIndex !== null && combatLog[inspectedIndex] && (
                <InspectorPanel 
                    logEntry={combatLog[inspectedIndex]} 
                    combatantState={combatLog[inspectedIndex].snapshot.combatant} 
                    targetState={combatLog[inspectedIndex].snapshot.target} 
                    onClose={handleCloseInspector} 
                />
            )}
        </>
    );
};

export default CombatSimulatorPage;
