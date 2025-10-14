import React, { useState, useEffect } from 'react';
import { calculateWeaponDamage } from '../simulation/formulas';
import { runSimulationV2 } from '../simulation/engine_v2'; // <-- IMPORT THE NEW GLASS ENGINE
import { midComboBlockChoreography } from '../simulation/choreography';
import ChoreographerPanel from './ChoreographerPanel';
import PerkLoadoutPanel from './PerkLoadoutPanel';
import CommandBar from './CommandBar';
import { db as firestore } from '../services/firebase';
import InspectorPanel from './InspectorModal';
import CombatLogPanel from './CombatLogPanel'; 

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
const CombatAnalysisPanel = ({ combatLog, isFocusMode, setIsFocusMode }) => {
    const [inspectedIndex, setInspectedIndex] = React.useState(null);
    const handleRowClick = (index) => setInspectedIndex(index);
    const handleCloseInspector = () => setInspectedIndex(null);
    const getInspectorData = (entry) => ({ combatantState: { health: '100/100', stamina: '50/100', buffs: entry.activeBuffs || 'None' }, targetState: { health: '45000/50000', debuffs: entry.effectsApplied || 'None' }, formulaBreakdown: `Base: 500 * (1 + STR Bonus: 0.5) * (1 - Armor Mit: 0.2) = ${entry.damage}` });
    return (
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700 flex flex-col h-full shadow-lg backdrop-blur-sm">
            <div className="flex justify-between items-center border-b border-slate-600 pb-2 mb-2"><h2 className="text-lg font-bold text-slate-100 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a1 1 0 001 1h12a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1-1zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 4a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" /></svg>Combat Analysis</h2><div className="flex items-center space-x-2"><button onClick={() => setIsFocusMode(!isFocusMode)} className="p-2 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition" title="Toggle Focus Mode"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" /></svg></button></div></div>
            <div className="flex-grow overflow-auto custom-scrollbar pr-1"><table className="min-w-full text-sm text-left"><thead className="bg-black/20 sticky top-0 backdrop-blur-sm z-10"><tr><th className="p-2 font-semibold text-slate-300">Time</th><th className="p-2 font-semibold text-slate-300">Source</th><th className="p-2 font-semibold text-slate-300">Action</th><th className="p-2 font-semibold text-slate-300">Target</th><th className="p-2 font-semibold text-slate-300 text-center">Crit?</th><th className="p-2 font-semibold text-slate-300 text-right">Damage</th></tr></thead><tbody className="divide-y divide-slate-700/50">{combatLog.length === 0 && ( <tr><td colSpan="6" className="text-center text-slate-500 py-16">Run a simulation to see the results.</td></tr>)}{combatLog.map((entry, index) => (<tr key={index} className="hover:bg-slate-700/50 cursor-pointer transition-colors duration-150 even:bg-slate-800/20" onClick={() => handleRowClick(index)}><td className="p-2 whitespace-nowrap text-slate-400 font-mono">{entry.timestamp.toFixed(1)}s</td><td className="p-2 whitespace-nowrap text-green-400 font-semibold">{entry.source}</td><td className="p-2 whitespace-nowrap">{entry.action}</td><td className="p-2 whitespace-nowrap text-red-400 font-semibold">{entry.target}</td><td className="p-2 whitespace-nowrap text-center">{entry.isCrit ? <span className="font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 shadow-[0_0_5px_rgba(251,191,36,0.5)]">YES</span> : <span className="text-slate-500">no</span>}</td><td className="p-2 whitespace-nowrap text-right font-bold font-mono text-white">{entry.damage}</td></tr>))}</tbody></table></div>
            {inspectedIndex !== null && (<InspectorPanel logEntry={combatLog[inspectedIndex]} combatantState={getInspectorData(combatLog[inspectedIndex]).combatantState} targetState={getInspectorData(combatLog[inspectedIndex]).targetState} formulaBreakdown={getInspectorData(combatLog[inspectedIndex]).formulaBreakdown} onClose={handleCloseInspector} />)}
        </div>
    );
};

// --- Main Page Component ---
const CombatSimulatorPage = () => {
    const [weaponType, setWeaponType] = useState('Sword');
    const [attributes, setAttributes] = useState({ STR: 332, DEX: 36, INT: 5, FOC: 60, CON: 105 });
    const [calculatedDamage, setCalculatedDamage] = useState(0);
    const [combatLog, setCombatLog] = useState([]);
    const [rawEngineLog, setRawEngineLog] = useState([]);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [equippedPerks, setEquippedPerks] = useState([]);

    useEffect(() => {
        const allAttributesValid = Object.values(attributes).every(val => val !== '' && !isNaN(val));
        if (weaponType && allAttributesValid) {
            const damage = calculateWeaponDamage(weaponType, attributes);
            setCalculatedDamage(damage);
        } else {
            setCalculatedDamage(0);
        }
    }, [weaponType, attributes]);

    const handleRunSimulation = () => {
        const combatant = { id: 'Player', weaponType, attributes, perks: equippedPerks };
        const target = { id: 'Target Dummy', health: 50000 };
        
        // --- Call the new Glass Engine ---
        const { rawLog, analysisLog } = runSimulationV2(combatant, target, midComboBlockChoreography);
        setRawEngineLog(rawLog);
        setCombatLog(analysisLog); // This will be empty for now
    };

    const clearCombatLog = () => {
        setCombatLog([]);
        setRawEngineLog([]);
    };

    return (
        <>
        <style>{`.custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; } .tactical-grid { background-image: linear-gradient(rgba(30, 41, 59, 0.8), rgba(30, 41, 59, 0.8)), radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0); background-size: 20px 20px; }`}</style>
        <div className="h-screen flex flex-col p-4 sm:p-6 space-y-4 bg-gradient-to-br from-slate-900 to-slate-800 text-slate-300 font-sans tactical-grid">
            <div className="flex justify-between items-center flex-shrink-0"><h1 className="text-2xl font-bold text-amber-400 tracking-wider flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V3m0 18v-3m6-9h3m-18 0h3m15-3l-2 2m-10-2l2 2m-2 10l2-2m10 2l-2-2" /></svg>Combat Simulator</h1></div>
            <div className="flex-shrink-0"><CommandBar onRunSimulation={handleRunSimulation} onClearLog={clearCombatLog} isPrimary={true}/></div>
            <div className={`flex-grow grid gap-6 ${isFocusMode ? 'grid-cols-1' : 'lg:grid-cols-3'} overflow-hidden`}>
                <div className={`${isFocusMode ? 'hidden' : 'lg:col-span-1'} flex flex-col gap-6 overflow-y-auto custom-scrollbar p-1`}>
                    <ControlPanel attributes={attributes} setAttributes={setAttributes} weaponType={weaponType} setWeaponType={setWeaponType} calculatedDamage={calculatedDamage}/>
                    <PerkLoadoutPanel equippedPerks={equippedPerks} setEquippedPerks={setEquippedPerks} firestore={firestore}/>
                    <ChoreographerPanel />
                    <div className="mt-auto pt-4"><CommandBar onRunSimulation={handleRunSimulation} onClearLog={clearCombatLog} isPrimary={false} /></div>
                </div>

                {/* --- CORRECTED LAYOUT FOR ANALYSIS & LOG PANELS --- */}
                <div className={`${isFocusMode ? 'col-span-1' : 'lg:col-span-2'} grid grid-rows-2 gap-6`}>
                    <div className="row-span-1"><CombatAnalysisPanel combatLog={combatLog} isFocusMode={isFocusMode} setIsFocusMode={setIsFocusMode} /></div>
                    <div className="row-span-1"><CombatLogPanel log={rawEngineLog} /></div>
                </div>
            </div>
        </div>
        </>
    );
};

export default CombatSimulatorPage;