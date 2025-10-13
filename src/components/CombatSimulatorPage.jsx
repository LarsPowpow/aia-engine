import React, { useState, useEffect } from 'react';
import { calculateWeaponDamage } from '../simulation/formulas';
import { runSimulation } from '../simulation/engine';
import PerkLoadoutPanel from './PerkLoadoutPanel';
import { db as firestore } from '../services/firebase';

// --- Sub-Component: ControlPanel (No changes needed) ---
const ControlPanel = ({ attributes, setAttributes, weaponType, setWeaponType, calculatedDamage, onRunSimulation }) => {
    // ...existing code...
    const handleAttributeChange = (attr, value) => {
        const numValue = value === '' ? '' : parseInt(value, 10);
        if (isNaN(numValue) && value !== '') return;
        setAttributes(prev => ({ ...prev, [attr]: numValue }));
    };

    return (
        <div className="bg-gray-800/50 rounded-lg p-4 flex flex-col space-y-6 border border-gray-700 h-full">
            <h2 className="text-xl font-semibold text-white border-b border-gray-600 pb-2">Control Console</h2>
            <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-700">
                <h3 className="font-bold text-white mb-3">Weapon</h3>
                <select 
                    value={weaponType}
                    onChange={(e) => setWeaponType(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                >
                    <option value="Sword">Sword</option>
                    <option value="Flail">Flail</option>
                </select>
            </div>
            <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-700">
                <h3 className="font-bold text-white mb-3">Attributes</h3>
                <div className="grid grid-cols-2 gap-4">
                    {Object.keys(attributes).map(attr => (
                        <div key={attr} className={attr === 'CON' ? 'col-span-2' : ''}>
                            <label className="text-sm font-medium text-gray-400">{attr}</label>
                            <input 
                                type="number" 
                                value={attributes[attr]}
                                onChange={(e) => handleAttributeChange(attr, e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 mt-1 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-gray-900/70 p-4 rounded-lg border border-cyan-600/50">
                 <h3 className="font-bold text-cyan-400 mb-2">Pre-Flight Analysis</h3>
                 <div className="flex justify-between items-center">
                     <span className="text-gray-300">Calculated Damage:</span>
                     <span className="text-2xl font-bold text-white bg-gray-700 px-3 py-1 rounded-md">{calculatedDamage}</span>
                 </div>
            </div>
            <div className="flex-grow"></div>
            <button 
                onClick={onRunSimulation}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition duration-300 shadow-lg shadow-cyan-600/20 disabled:bg-gray-600 disabled:shadow-none"
                disabled={calculatedDamage === 0}
            >
                Run Simulation
            </button>
        </div>
    );
};

// --- Sub-Component: CombatAnalysisPanel (UPDATED) ---
const CombatAnalysisPanel = ({ combatLog, clearCombatLog, isFocusMode, setIsFocusMode }) => {
    return (
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 flex flex-col h-full">
            <div className="flex justify-between items-center border-b border-gray-600 pb-2 mb-4">
                <h2 className="text-xl font-semibold text-white">Combat Analysis</h2>
                <div className="flex items-center space-x-2">
                    {/* --- ADD THIS BUTTON --- */}
                    <button 
                        onClick={clearCombatLog}
                        className="p-2 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white" title="Clear Combat Log"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    {/* --------------------- */}
                    <button 
                        onClick={() => setIsFocusMode(!isFocusMode)}
                        className="p-2 rounded-md hover:bg-gray-700" title="Toggle Focus Mode"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" /></svg>
                    </button>
                </div>
            </div>
            <div className="flex-grow overflow-auto">
                 {/* ... table remains the same ... */}
                 <table className="min-w-full text-sm text-left">
                    <thead className="bg-black/40 sticky top-0">
                        <tr>
                            <th className="p-2 font-semibold">Time</th>
                            <th className="p-2 font-semibold">Source</th>
                            <th className="p-2 font-semibold">Action</th>
                            <th className="p-2 font-semibold">Target</th>
                            <th className="p-2 font-semibold text-center">Crit?</th>
                            <th className="p-2 font-semibold text-right">Damage</th>
                            <th className="p-2 font-semibold">Effect Applied</th>
                            <th className="p-2 font-semibold">Active Buffs</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                        {combatLog.length === 0 && ( <tr><td colSpan="8" className="text-center text-gray-500 py-8">No simulation data. Run a simulation to see the results.</td></tr>)}
                        {combatLog.map((entry, index) => (
                             <tr key={index} className="hover:bg-gray-700/50">
                                <td className="p-2 whitespace-nowrap text-gray-400">{entry.timestamp.toFixed(1)}s</td>
                                <td className="p-2 whitespace-nowrap text-cyan-400">{entry.source}</td>
                                <td className="p-2 whitespace-nowrap">{entry.action}</td>
                                <td className="p-2 whitespace-nowrap text-red-400">{entry.target}</td>
                                <td className="p-2 whitespace-nowrap text-center">{entry.isCrit ? <span className="text-yellow-400 font-bold">YES</span> : 'no'}</td>
                                <td className="p-2 whitespace-nowrap text-right font-bold text-white">{entry.damage}</td>
                                <td className="p-2 whitespace-nowrap text-red-300">{entry.effectsApplied}</td>
                                <td className="p-2 whitespace-nowrap text-yellow-400">{entry.activeBuffs}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Main Page Component (UPDATED) ---
const CombatSimulatorPage = () => {
    const [weaponType, setWeaponType] = useState('Sword');
    const [attributes, setAttributes] = useState({ STR: 332, DEX: 36, INT: 5, FOC: 60, CON: 105 });
    const [calculatedDamage, setCalculatedDamage] = useState(0);
    const [combatLog, setCombatLog] = useState([]);
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
        const combatant = { weaponType, attributes, id: 'Player' };
        const target = { id: 'Target Dummy', health: 50000 };
        const log = runSimulation(combatant, target);
        setCombatLog(log);
    };

    // --- ADD THIS FUNCTION ---
    const clearCombatLog = () => {
        setCombatLog([]);
    };
    // -----------------------

    return (
        <div className="h-full flex flex-col space-y-4">
            <h1 className="text-2xl font-bold text-white">Combat Simulator</h1>
            <div className={`flex-grow grid gap-6 ${isFocusMode ? 'grid-cols-1' : 'grid-cols-3'}`}>
                <div className={isFocusMode ? 'hidden' : 'col-span-1'}>
                    <ControlPanel 
                        attributes={attributes}
                        setAttributes={setAttributes}
                        weaponType={weaponType}
                        setWeaponType={setWeaponType}
                        calculatedDamage={calculatedDamage}
                        onRunSimulation={handleRunSimulation}
                    />
                    <PerkLoadoutPanel 
                        equippedPerks={equippedPerks}
                        setEquippedPerks={setEquippedPerks}
                        firestore={firestore}
                    />
                </div>
                <div className={isFocusMode ? 'col-span-1' : 'col-span-2'}>
                    <CombatAnalysisPanel 
                        combatLog={combatLog}
                        clearCombatLog={clearCombatLog}
                        isFocusMode={isFocusMode}
                        setIsFocusMode={setIsFocusMode}
                    />
                </div>
            </div>
        </div>
    );
};

export default CombatSimulatorPage;
