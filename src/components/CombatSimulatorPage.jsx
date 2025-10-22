import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { calculateWeaponDamage } from '../simulation/formulas';
import { runSimulation } from '../simulation/engine';
import { midComboBlockChoreography } from '../simulation/choreography';
import PerkLoadoutPanel from '../components/PerkLoadoutPanel';
import MasteryLoadoutPanel from '../components/MasteryLoadoutPanel';
import RuneglassPanel from '../components/RuneglassPanel';
import CommandBar from '../components/CommandBar';
import { db as firestore } from '../services/firebase';
import InspectorPanel from '../components/InspectorPanel';
import CombatLogPanel from '../components/CombatLogPanel';
import { implementedBunkerIds } from '../simulation/bunkers/bunkerManifest.js';

// --- Sub-Component: ControlPanel (Re-integrated to fix build error) ---
const ControlPanel = ({ attributes, setAttributes, calculatedDamage }) => {
    const handleAttributeChange = (attr, value) => {
        const numValue = value === '' ? '' : parseInt(value, 10);
        if (isNaN(numValue) && value !== '') return;
        setAttributes(prev => ({ ...prev, [attr]: numValue }));
    };
    return (
        <div className="bg-slate-800/40 rounded-xl p-4 flex flex-col space-y-4 border border-slate-700 shadow-lg backdrop-blur-sm">
            <h2 className="text-lg font-bold text-slate-100 border-b border-slate-600 pb-2 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg>Control Console</h2>
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
                        <th className="p-2 font-semibold text-slate-300 text-right">Healing</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                    {combatLog.length === 0 ? (
                        <tr><td colSpan="7" className="text-center text-slate-500 py-16">Run a simulation to see the results.</td></tr>
                    ) : (
                        combatLog.map((entry, index) => {
                            // Calculate healing value
                            // Support multiple formats: totalHealing, healing array, or direct healing number
                            let healingValue = 0;
                            
                            if (entry.totalHealing !== undefined) {
                                healingValue = entry.totalHealing;
                            } else if (Array.isArray(entry.healing)) {
                                healingValue = entry.healing.reduce((sum, h) => {
                                    if (h.valueType === 'baseHealth') {
                                        const target = h.targetId === 'Player' 
                                            ? entry.snapshot?.combatant 
                                            : entry.snapshot?.target;
                                        const baseHealth = target?.baseHealth || target?.maxHealth || 0;
                                        return sum + (h.value * baseHealth);
                                    }
                                    return sum + (h.value || 0);
                                }, 0);
                            } else if (typeof entry.healing === 'number') {
                                // Direct healing number (HOT_TICK, DOT_TICK, etc.)
                                healingValue = entry.healing;
                            }
                            
                            // Debug HOT_TICK entries
                            if (entry.action && entry.action.includes('HoT Tick')) {
                                console.log('[CA TABLE DEBUG] HoT Tick entry:', {
                                    action: entry.action,
                                    healing: entry.healing,
                                    healingType: typeof entry.healing,
                                    totalHealing: entry.totalHealing,
                                    calculatedHealingValue: healingValue
                                });
                            }

                            return (
                                <>
                                    <tr key={index} className="hover:bg-slate-700/50 cursor-pointer transition-colors duration-150 even:bg-slate-800/20" onClick={() => onRowClick(index)}>
                                        <td className="p-2 whitespace-nowrap text-slate-400 font-mono">{entry.timestamp.toFixed(1)}s</td>
                                        <td className="p-2 whitespace-nowrap text-green-400 font-semibold">{entry.source}</td>
                                        <td className="p-2 whitespace-nowrap">{entry.action}</td>
                                        <td className="p-2 whitespace-nowrap text-red-400 font-semibold">{entry.target}</td>
                                        <td className="p-2 whitespace-nowrap text-center">{entry.isCrit ? <span className="font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 shadow-[0_0_5px_rgba(251,191,36,0.5)]">YES</span> : <span className="text-slate-500">no</span>}</td>
                                        <td className="p-2 whitespace-nowrap text-right font-bold font-mono">
                  <span className={entry.damageType?.toUpperCase() === 'ARCANE' ? 'text-purple-400' : 'text-white'}>
                    {entry.damage}
                  </span>
                </td>
                                        <td className="p-2 whitespace-nowrap text-right font-mono text-green-300">{healingValue > 0 ? Math.round(healingValue) : ''}</td>
                                    </tr>
                                    {/* Damage Type Subrows (Physical/Arcane split) */}
                                    {entry.damageSubrows && entry.damageSubrows.map((subrow, subIdx) => {
                                        // Color coding by damage type
                                        const isArcane = subrow.type === 'arcane';
                                        const bgColor = isArcane ? 'bg-purple-900/10 hover:bg-purple-800/20' : 'bg-blue-900/10 hover:bg-blue-800/20';
                                        const textColor = isArcane ? 'text-purple-400' : 'text-blue-400';
                                        const damageColor = isArcane ? 'text-purple-300' : 'text-blue-300';
                                        
                                        return (
                                            <tr key={`${index}-dmgtype-${subIdx}`} className={`${bgColor} cursor-pointer transition-colors duration-150`} onClick={() => onRowClick(index)}>
                                                <td className="p-2 pl-8 whitespace-nowrap text-slate-500 font-mono text-xs">↳</td>
                                                <td className={`p-2 whitespace-nowrap ${textColor} font-semibold text-sm`} colSpan="2">Runeglass of Empowered Sapphire</td>
                                                <td className={`p-2 whitespace-nowrap ${damageColor} text-xs italic uppercase`}>{subrow.type}</td>
                                                <td className="p-2 whitespace-nowrap text-center text-slate-600">-</td>
                                                <td className={`p-2 whitespace-nowrap text-right font-bold font-mono ${damageColor}`}>{subrow.damage}</td>
                                                <td className="p-2 whitespace-nowrap text-right"></td>
                                            </tr>
                                        );
                                    })}
                                    {/* Arcane Damage Subrows */}
                                    {entry.arcaneDamageSubrows && entry.arcaneDamageSubrows.map((subrow, subIdx) => (
                                        <tr key={`${index}-arcane-${subIdx}`} className="bg-purple-900/10 hover:bg-purple-800/20 cursor-pointer transition-colors duration-150" onClick={() => onRowClick(index)}>
                                            <td className="p-2 pl-8 whitespace-nowrap text-slate-500 font-mono text-xs">↳</td>
                                            <td className="p-2 whitespace-nowrap text-purple-400 font-semibold text-sm" colSpan="2">{subrow.sourceName}</td>
                                            <td className="p-2 whitespace-nowrap text-purple-300 text-xs italic">{subrow.damageType}</td>
                                            <td className="p-2 whitespace-nowrap text-center text-slate-600">-</td>
                                            <td className="p-2 whitespace-nowrap text-right font-bold font-mono text-purple-300">{subrow.damage}</td>
                                            <td className="p-2 whitespace-nowrap text-right"></td>
                                        </tr>
                                    ))}
                                </>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};

// --- Main Page Component ---
const CombatSimulatorPage = ({ addLog }) => {
    // --- FINAL FIX: Default weapon is now 'Flail' ---
    const [attributes, setAttributes] = useState({ STR: 332, DEX: 36, INT: 5, FOC: 60, CON: 105 });
    const [calculatedDamage, setCalculatedDamage] = useState(0);
    const [combatLog, setCombatLog] = useState([]);
    const [rawEngineLog, setRawEngineLog] = useState([]);
    const [equippedPerks, setEquippedPerks] = useState([]);
    const [equippedMasteries, setEquippedMasteries] = useState([]);
    // Multi-select: equippedRuneglass is now an array
    const [equippedRuneglass, setEquippedRuneglass] = useState([]);
    const [activeAnalysisTab, setActiveAnalysisTab] = useState('analysis');
    const [inspectedIndex, setInspectedIndex] = useState(null);
    const [allSources, setAllSources] = useState([]);

    const handleRowClick = (index) => setInspectedIndex(index);
    const handleCloseInspector = () => setInspectedIndex(null);

    useEffect(() => {
        const fetchSources = async () => {
            try {
                addLog({ type: 'info', message: 'Fetching all sources from UKB...' });
                const querySnapshot = await getDocs(collection(firestore, 'ukb_sources_v2'));
                const sources = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllSources(sources);
                addLog({ type: 'success', message: `Successfully fetched ${sources.length} sources.` });
            } catch (error) {
                addLog({ type: 'error', message: `Failed to fetch sources: ${error.message}` });
            }
        };
        fetchSources();
    }, [addLog]);

    const masteryOptions = useMemo(() => {
        return allSources
            .filter(source => String(source.type ?? '').toUpperCase() === 'WEAPON_MASTERY')
            .filter(source => implementedBunkerIds.includes(source.id));
    }, [allSources]);

    const perkOptions = useMemo(() => {
        return allSources
            .filter(source => String(source.type ?? '').toUpperCase() === 'PERK')
            .filter(source => implementedBunkerIds.includes(source.id));
    }, [allSources]);

    const runeglassOptions = useMemo(() => {
        return allSources
            .filter(source => String(source.type ?? '').toUpperCase() === 'RUNEGLASS')
            .filter(source => implementedBunkerIds.includes(source.id));
    }, [allSources]);

    // Debug logs for component-scoped values — prevents module-scope ReferenceError
    useEffect(() => {
        try {
            console.log('%c[DEBUG] All sources:', 'color: #00ff00; font-weight: bold;', allSources);
            console.log('%c[DEBUG] Implemented bunker IDs:', 'color: #00ffff; font-weight: bold;', implementedBunkerIds);
            console.log('%c[DEBUG] Perk options:', 'color: #ff00ff; font-weight: bold;', perkOptions);
            if (perkOptions.length === 0) {
                console.warn('%c[DEBUG] No perks found. Check that Firestore source type, id, and bucket match generated bunker METADATA.', 'color: #ff0000; font-weight: bold;');
            }
        } catch (err) {
            console.warn('Debug logging failed:', err);
        }
    }, [allSources, perkOptions]);

    // Auto-select all masteries by default
    useEffect(() => {
        if (masteryOptions.length > 0 && equippedMasteries.length === 0) {
            setEquippedMasteries(masteryOptions);
            addLog({ type: 'info', message: `Auto-selected ${masteryOptions.length} masteries by default.` });
        }
    }, [masteryOptions]);

    useEffect(() => {
        const allAttributesValid = Object.values(attributes).every(val => val !== '' && !isNaN(val));
        const startingWeapon = midComboBlockChoreography.find(e => e.weapon)?.weapon || 'Flail';
        if (startingWeapon && allAttributesValid) {
            const damage = calculateWeaponDamage(startingWeapon, attributes);
            setCalculatedDamage(damage);
        } else {
            setCalculatedDamage(0);
        }
    }, [attributes]);

    const handleRunSimulation = async () => {
        addLog({ type: 'info', message: 'Simulation initiated...' });
        const conVal = Number(attributes.CON);
        if (!Number.isFinite(conVal) || conVal <= 0) {
            addLog({ type: 'error', message: 'CON must be a positive number to derive maxHealth' });
            return;
        }

        const allEquippedPerks = [...(equippedPerks || [])];
        if (equippedRuneglass && Array.isArray(equippedRuneglass)) {
            allEquippedPerks.push(...equippedRuneglass);
        }

        const maxHealth = Math.max(1, Math.floor(conVal) * 100);
        const hasCowardlySelected = (equippedMasteries || []).some(m => m.id === 'upgrade_sword_leapingstrike_slow');
        const cowardlyPunishmentMastery = hasCowardlySelected ? {
            id: 'upgrade_sword_leapingstrike_slow',
            effects: [
                {
                    id: 'cowardly_punishment_slow',
                    category: 'SLOW',
                    value: 0.3,
                    duration: 3.0,
                    conditions: ['ON_ABILITY_HIT:ability_sword_leaping_strike']
                }
            ]
        } : null;
        const masteriesPayload = cowardlyPunishmentMastery
            ? [...(equippedMasteries || []).filter(m => m.id !== 'upgrade_sword_leapingstrike_slow'), cowardlyPunishmentMastery]
            : (equippedMasteries || []);
        
        // Determine starting weapon from choreography (first non-consumable event with a weapon)
        const startingWeapon = midComboBlockChoreography.find(e => e.weapon)?.weapon || 'Flail';
        console.log('[COMBAT SIM] Starting weapon from choreography:', startingWeapon);
        
        const combatantPayload = {
            id: 'Player', name: 'Player', weaponType: startingWeapon, attributes,
            perks: allEquippedPerks,
            masteries: masteriesPayload,
            maxHealth,
            baseHealth: maxHealth,
            health: maxHealth,
            state: { health: maxHealth, stamina: 100, mana: 100, cooldowns: {} },
            activeEffects: []
        };
        const targetPayload = {
            id: 'Target Dummy', name: 'Target Dummy', weaponType: 'Sword',
            attributes: { STR: 0, DEX: 0, INT: 0, FOC: 0, CON: 0 },
            perks: [], masteries: [], maxHealth: 5000,
            baseHealth: 5000,
            health: 5000,
            state: { health: 5000, stamina: 0, mana: 0, cooldowns: {} },
            activeEffects: []
        };
        
        // ✅ FIX: Build selectedSources from checkbox selections
        const selectedSources = [
            ...(equippedPerks || []),
            ...(equippedMasteries || []),
            ...(equippedRuneglass || [])
        ];
        
        console.log('[UI] Selected sources for simulation:', {
            perks: equippedPerks?.length || 0,
            masteries: equippedMasteries?.length || 0,
            runeglass: equippedRuneglass?.length || 0,
            total: selectedSources.length
        });
        
        try {
            // ✅ Pass selectedSources instead of allSources
            const { rawLog, analysisLog } = await runSimulation(
                combatantPayload, 
                targetPayload, 
                midComboBlockChoreography, 
                selectedSources  // ← Changed from allSources
            );
            
            console.log('%c[UI PROBE 1: DATA RECEIVED FROM ENGINE]', 'color: #00ffff; font-weight: bold;', {
                analysisLog,
                rawLog
            });

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
                        <PerkLoadoutPanel equippedPerks={equippedPerks} setEquippedPerks={setEquippedPerks} perkOptions={perkOptions} />
                        <MasteryLoadoutPanel equippedMasteries={equippedMasteries} setEquippedMasteries={setEquippedMasteries} masteryOptions={masteryOptions} />
                        <RuneglassPanel equippedRuneglass={equippedRuneglass} setEquippedRuneglass={setEquippedRuneglass} runeglassOptions={runeglassOptions} />
                        <ControlPanel attributes={attributes} setAttributes={setAttributes} calculatedDamage={calculatedDamage} />
                    </div>

                    <div className="lg:col-span-2 flex flex-col bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
                        <div className="flex border-b border-slate-700 flex-shrink-0">
                            <button onClick={() => setActiveAnalysisTab('analysis')} className={`tab px-4 py-2 font-semibold border-b-2 transition ${activeAnalysisTab === 'analysis' ? 'active' : 'border-transparent text-slate-400 hover:bg-slate-800/50'}`}>Combat Analysis</button>
                            <button onClick={() => setActiveAnalysisTab('log')} className={`tab px-4 py-2 font-semibold border-b-2 transition ${activeAnalysisTab === 'log' ? 'active' : 'border-transparent text-slate-400 hover:bg-slate-800/50'}`}>Live Combat Log</button>
                        </div>
                        
                        <div className="p-4 flex-grow min-h-0">
                            {activeAnalysisTab === 'analysis' && <CombatAnalysisPanel combatLog={combatLog} onRowClick={handleRowClick} />}
                            {activeAnalysisTab === 'log' && <CombatLogPanel log={rawEngineLog} />}
                        </div>
                    </div>
                </div>
            </div>

            {inspectedIndex !== null && combatLog[inspectedIndex] && (
                <InspectorPanel logEntry={combatLog[inspectedIndex]} combatantState={combatLog[inspectedIndex].snapshot.combatant} targetState={combatLog[inspectedIndex].snapshot.target} onClose={handleCloseInspector} />
            )}
        </>
    );
};

export default CombatSimulatorPage;

// Debugging logs: moved into a useEffect within the component to avoid referencing
// component-scoped variables from module scope which leads to ReferenceError.

