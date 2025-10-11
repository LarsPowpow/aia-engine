import { useState, useEffect, useCallback } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, writeBatch, doc } from "firebase/firestore";

// Component Imports
import ViewerPage from './components/ViewerPage.jsx';
import TabNavigation from './components/TabNavigation.jsx';
import SystemLog from './components/SystemLog.jsx';
import ForgePanel from './components/ForgePanel.jsx';
import AdminPanel from './components/AdminPanel.jsx';

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyARiZYDRmAPutSoq8_oiMu1f77Dx3iSM",
    authDomain: "aeternumintelligence.firebaseapp.com",
    projectId: "aeternumintelligence",
    storageBucket: "aeternumintelligence.appspot.com",
    messagingSenderId: "581680312893",
    appId: "1:581680312893:web:a7b8dfe93be5798fed2b8a",
    measurementId: "G-NF5TESZ9B4"
};

// --- UKB Schemas (Needed for MigrationPanel) ---
const UKB_SCHEMAS = {
    effects: {
        effect_id: { type: 'text', label: 'Effect ID', required: true },
        name: { type: 'text', label: 'Name' },
        type: { type: 'select', label: 'Type', options: ['EMPOWER', 'BLEED', 'FORTIFY', 'HASTE', 'SLOW', 'HEAL', 'DAMAGE', 'ROOT', 'STUN', 'WEAKEN', 'REND', 'MANA_RESTORE', 'NEEDS_REVIEW'] },
        application_trigger: { type: 'select', label: 'Application Trigger', options: ['ON_HIT', 'ON_CRITICAL_HIT', 'ON_DODGE', 'ON_BLOCK_BREAK', 'ON_HEADSHOT', 'PASSIVE', 'ON_HEAL', 'NEEDS_REVIEW'] },
        target: { type: 'select', label: 'Target', options: ['SELF', 'TARGET', 'GROUP_IN_AOE', 'FRIENDLY_TARGET', 'NEEDS_REVIEW'] },
        value_type: { type: 'select', label: 'Value Type', options: ['PERCENTAGE', 'FLAT', 'WEAPON_DAMAGE_PCT', 'MAX_MANA_PCT', 'NEEDS_REVIEW'] },
        value: { type: 'text', label: 'Value' }, // Can be number or string for formulas
        duration_seconds: { type: 'number', label: 'Duration (s)' },
        is_stackable: { type: 'checkbox', label: 'Is Stackable' },
        max_stacks: { type: 'number', label: 'Max Stacks' },
        scales_with_attribute: { type: 'select', label: 'Scales With', options: ['', 'FOCUS', 'INTELLIGENCE', 'STRENGTH', 'DEXTERITY', 'CONSTITUTION'] },
        description: { type: 'textarea', label: 'Description' },
    },
    abilities: {
        ability_id: { type: 'text', label: 'Ability ID', required: true },
        name: { type: 'text', label: 'Name' },
        type: { type: 'select', label: 'Type', options: ['PERK', 'WEAPON_MASTERY', 'GEM', 'STATUS_EFFECT'] },
        trigger: { type: 'select', label: 'Trigger', options: ['ON_HIT', 'ON_CRITICAL_HIT', 'ON_DODGE', 'ON_BLOCK_BREAK', 'ON_HEADSHOT', 'PASSIVE', 'ON_HEAL', 'NEEDS_REVIEW'] },
        effects_to_apply: { type: 'multiselect', label: 'Effects to Apply' },
        internal_cooldown_seconds: { type: 'number', label: 'Internal Cooldown (s)' },
        description: { type: 'textarea', label: 'Description' },
    }
};

// --- COMPONENT: MigrationForm (Now with live state updates) ---
function MigrationForm({ schema, initialData, formId, onDataChange, allEffects = [] }) {
    const [formData, setFormData] = useState(initialData || {});

    useEffect(() => {
        setFormData(initialData || {});
    }, [initialData]);

    const triggerChange = (newData) => {
        setFormData(newData);
        onDataChange(newData);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value);
        triggerChange({ ...formData, [name]: newValue });
    };
    
    const handleMultiSelectChange = (e) => {
        const { value, checked } = e.target;
        const currentValues = formData.effects_to_apply || [];
        let newValues;
        if (checked) {
            newValues = [...currentValues, value];
        } else {
            newValues = currentValues.filter(val => val !== value);
        }
        triggerChange({ ...formData, effects_to_apply: newValues });
    };

    return (
        <form id={formId} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(schema).map(([key, field]) => {
                    const fullKey = `${formId}-${key}`;
                    const value = formData[key];

                    if (field.type === 'multiselect') {
                        return (
                             <div key={fullKey} className="md:col-span-2 lg:col-span-3">
                                 <label className="block text-sm font-medium text-gray-300">{field.label}</label>
                                 <div className="mt-2 h-32 overflow-y-auto bg-gray-900/50 p-2 rounded-md border border-gray-700 grid grid-cols-2 md:grid-cols-3 gap-2">
                                     {allEffects.sort((a,b) => a.localeCompare(b)).map(effectId => (
                                         <label key={effectId} className="flex items-center space-x-2 text-sm font-mono">
                                             <input
                                                 type="checkbox"
                                                 value={effectId}
                                                 checked={(formData.effects_to_apply || []).includes(effectId)}
                                                 onChange={handleMultiSelectChange}
                                                 className="bg-gray-800 border-gray-600 rounded h-4 w-4 text-emerald-500 focus:ring-emerald-600"
                                             />
                                             <span className="truncate">{effectId}</span>
                                         </label>
                                     ))}
                                 </div>
                             </div>
                        )
                    }

                    return (
                        <div key={fullKey} className={field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}>
                            <label htmlFor={fullKey} className="block text-sm font-medium text-gray-300">{field.label}</label>
                            {field.type === 'textarea' ? (
                                <textarea id={fullKey} name={key} value={value || ''} onChange={handleChange} rows={2} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-sm" />
                            ) : field.type === 'select' ? (
                                <select id={fullKey} name={key} value={value || ''} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-sm">
                                    <option value="">-- Select --</option>
                                    {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            ) : field.type === 'checkbox' ? (
                                 <div className="flex items-center h-full mt-1">
                                     <input id={fullKey} name={key} type="checkbox" checked={!!value} onChange={handleChange} className="bg-gray-700 border-gray-600 rounded h-5 w-5 text-amber-500 focus:ring-amber-600" />
                                 </div>
                            ) : (
                                <input id={fullKey} name={key} type={field.type} value={value || ''} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-sm" />
                            )}
                        </div>
                    );
                })}
            </div>
        </form>
    );
}


// --- COMPONENT: MigrationPanel (Internal to App) ---
function MigrationPanel({ stagedData, setStagedData, addLog, db }) {

    const handleDataChange = (itemIndex, dataType, effectIndex, newData) => {
        const newStagedData = JSON.parse(JSON.stringify(stagedData)); // Deep copy to prevent state mutation issues
        if (dataType === 'ability') {
            newStagedData[itemIndex].ability_to_create = newData;
        } else if (dataType === 'effect') {
            newStagedData[itemIndex].effects_to_create[effectIndex] = newData;
        }
        setStagedData(newStagedData);
    };

    const handleClearAll = () => {
        setStagedData([]);
        addLog('info', 'Migration staging area has been cleared.');
    };

    const handleCommitAll = async () => {
        if (!db || stagedData.length === 0) {
            addLog('error', 'Commit failed: No data staged or database not connected.');
            return;
        }
        addLog('special', `Initiating commit of ${stagedData.length} item(s) to UKB...`);
        
        const batch = writeBatch(db);
        let effectCount = 0;
        let abilityCount = 0;

        stagedData.forEach(item => {
            if (item.effects_to_create && Array.isArray(item.effects_to_create)) {
                item.effects_to_create.forEach(effect => {
                    if (effect.effect_id) {
                        const effectRef = doc(db, 'effects', effect.effect_id);
                        batch.set(effectRef, effect, { merge: true });
                        effectCount++;
                    }
                });
            }
            if (item.ability_to_create && item.ability_to_create.ability_id) {
                const abilityRef = doc(db, 'abilities', item.ability_to_create.ability_id);
                batch.set(abilityRef, item.ability_to_create, { merge: true });
                abilityCount++;
            }
        });

        try {
            await batch.commit();
            addLog('success', `Commit successful: ${abilityCount} ability(s) and ${effectCount} effect(s) saved to UKB.`);
            handleClearAll();
        } catch (e) {
            addLog('error', `Error committing to UKB: ${e.message}`);
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-amber-500/50">
            <h2 className="text-2xl font-semibold text-amber-300 mb-4 text-center">Migration Workshop</h2>
            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-8">
                {stagedData && stagedData.length > 0 ? (
                    stagedData.map((item, itemIndex) => (
                        <div key={itemIndex} className="bg-gray-800/50 p-4 rounded-lg border border-gray-600 space-y-4">
                            <h3 className="text-xl font-semibold text-amber-400">Staged Item #{itemIndex + 1}: {item.original_perk.name}</h3>
                            
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                <h4 className="text-lg font-semibold text-emerald-300 mb-2 border-b border-emerald-500/50 pb-1">Proposed Ability</h4>
                                <MigrationForm
                                    schema={UKB_SCHEMAS.abilities}
                                    initialData={item.ability_to_create}
                                    formId={`ability-${itemIndex}`}
                                    allEffects={[
                                        ...item.effects_to_create.map(e => e.effect_id),
                                        ...(item.ability_to_create.effects_to_apply || [])
                                    ].filter((v, i, a) => a.indexOf(v) === i)}
                                    onDataChange={(newData) => handleDataChange(itemIndex, 'ability', null, newData)}
                                />
                            </div>

                            <div>
                                <h4 className="text-lg font-semibold text-sky-300 mb-2 mt-4 border-b border-sky-500/50 pb-1">Proposed Effects</h4>
                                <div className="space-y-4">
                                    {item.effects_to_create.length > 0 ? (
                                        item.effects_to_create.map((effect, effectIndex) => (
                                             <div key={effectIndex} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                                 <MigrationForm
                                                     schema={UKB_SCHEMAS.effects}
                                                     initialData={effect}
                                                     formId={`effect-${itemIndex}-${effectIndex}`}
                                                     onDataChange={(newData) => handleDataChange(itemIndex, 'effect', effectIndex, newData)}
                                                 />
                                             </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 italic">No effects were generated for this item.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-400">
                        The workshop is empty. Run the Deconstructor in The Forge to stage items for verification.
                    </p>
                )}
            </div>
            {stagedData && stagedData.length > 0 && (
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleCommitAll}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition"
                    >
                        Approve & Commit All ({stagedData.length})
                    </button>
                    <button
                        onClick={handleClearAll}
                        className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 px-6 rounded-lg text-lg transition"
                    >
                        Reject and Clear All ({stagedData.length})
                    </button>
                </div>
            )}
        </div>
    );
}


// --- MAIN APP COMPONENT ---
function App() {
    const [activeTab, setActiveTab] = useState('viewer');
    const [logs, setLogs] = useState([
        { timestamp: new Date().toLocaleTimeString(), message: 'Cockpit v2.0 Initialized. All systems nominal.', typeClass: 'text-gray-400' },
    ]);
    const [db, setDb] = useState(null);
    const [stagedData, setStagedData] = useState([]);
    const [apiKey, setApiKey] = useState(''); // <-- NEW: API Key State

    // --- NEW: "Set and Forget" API Key Logic ---
    useEffect(() => {
        const savedApiKey = localStorage.getItem('geminiApiKey');
        if (savedApiKey) {
            setApiKey(savedApiKey);
            addLog('info', 'Gemini API Key loaded from memory.');
        }
    }, []);

    const handleApiKeyChange = (e) => {
        const newKey = e.target.value;
        setApiKey(newKey);
        localStorage.setItem('geminiApiKey', newKey);
    };
    // ---------------------------------------------

    const addLog = useCallback((type, message) => {
        const timestamp = new Date().toLocaleTimeString();
        const typeClasses = { success: 'text-emerald-400', error: 'text-red-400', info: 'text-gray-400', special: 'text-amber-400' };
        setLogs(prevLogs => [...prevLogs, { timestamp, message, typeClass: typeClasses[type] || typeClasses.info }]);
    }, []);

    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            setDb(firestore);
            addLog('success', 'Firebase UKB connection established.');
        } catch (error) {
            addLog('error', `Firebase connection error: ${error.message}`);
        }
    }, [addLog]);

    const renderContent = () => {
        switch (activeTab) {
            case 'viewer':
                return <ViewerPage db={db} addLog={addLog} />;
            case 'forge':
                // --- MODIFIED: Pass API Key props down ---
                return <ForgePanel 
                           setStagedData={setStagedData} 
                           addLog={addLog} 
                           setActiveTab={setActiveTab} 
                           apiKey={apiKey}
                           onApiKeyChange={handleApiKeyChange}
                       />;
            case 'migration':
                return <MigrationPanel stagedData={stagedData} setStagedData={setStagedData} addLog={addLog} db={db} />;
            case 'admin':
                return <AdminPanel addLog={addLog} db={db} />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-900 text-gray-200 min-h-screen font-sans">
            <div className="w-full max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-emerald-400">
                        Aeternum Intelligence Agency
                    </h1>
                    <p className="text-xl text-gray-400">
                        Cockpit v2.0
                    </p>
                </div>
                <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
                <div>{renderContent()}</div>
                <SystemLog logs={logs} />
            </div>
        </div>
    );
}

export default App;