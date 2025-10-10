import { useState, useEffect, useCallback } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, writeBatch, doc } from "firebase/firestore";

// Component Imports
import ViewerPage from './components/ViewerPage';
import TabNavigation from './components/TabNavigation';
import SystemLog from './components/SystemLog';
import ForgePanel from './components/ForgePanel';
import AdminPanel from './components/AdminPanel';

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
        effect_id: { type: 'text', label: 'Effect ID (e.g., Empower_10_Pct_5s)', required: true },
        name: { type: 'text', label: 'Name (e.g., Empower)' },
        type: { type: 'select', label: 'Type', options: ['EMPOWER', 'BLEED', 'FORTIFY', 'HASTE', 'SLOW', 'HEAL', 'DAMAGE', 'ROOT', 'STUN', 'WEAKEN', 'REND', 'MANA_RESTORE'] },
        application_trigger: { type: 'select', label: 'Application Trigger', options: ['ON_HIT', 'ON_CRITICAL_HIT', 'ON_DODGE', 'ON_BLOCK_BREAK', 'ON_HEADSHOT', 'PASSIVE', 'ON_HEAL'] },
        target: { type: 'select', label: 'Target', options: ['SELF', 'TARGET', 'GROUP_IN_AOE', 'FRIENDLY_TARGET'] },
        value_type: { type: 'select', label: 'Value Type', options: ['PERCENTAGE', 'FLAT', 'WEAPON_DAMAGE_PCT', 'MAX_MANA_PCT'] },
        value: { type: 'number', label: 'Value (e.g., 0.1 for 10%)' },
        duration_seconds: { type: 'number', label: 'Duration (s)' },
        is_stackable: { type: 'checkbox', label: 'Is Stackable' },
        max_stacks: { type: 'number', label: 'Max Stacks' },
        scales_with_attribute: { type: 'select', label: 'Scales With', options: ['', 'FOCUS', 'INTELLIGENCE', 'STRENGTH', 'DEXTERITY', 'CONSTITUTION'] },
        description: { type: 'textarea', label: 'Description' },
    },
    abilities: {
        ability_id: { type: 'text', label: 'Ability ID (e.g., Perk_KeenlyJagged)', required: true },
        name: { type: 'text', label: 'Name' },
        type: { type: 'select', label: 'Type', options: ['PERK', 'WEAPON_MASTERY', 'GEM', 'STATUS_EFFECT'] },
        trigger: { type: 'select', label: 'Trigger', options: ['ON_HIT', 'ON_CRITICAL_HIT', 'ON_DODGE', 'ON_BLOCK_BREAK', 'ON_HEADSHOT', 'PASSIVE', 'ON_HEAL'] },
        effects_to_apply: { type: 'multiselect', label: 'Effects to Apply' },
        internal_cooldown_seconds: { type: 'number', label: 'Internal Cooldown (s)' },
        description: { type: 'textarea', label: 'Description' },
    }
};

// --- COMPONENT: MigrationForm (Internal) ---
function MigrationForm({ schema, initialData, formId, onDataChange }) {
    const [formData, setFormData] = useState(initialData);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        const newFormData = { ...formData, [name]: newValue };
        setFormData(newFormData);
        onDataChange(newFormData);
    };

    return (
        <form id={formId} className="space-y-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(schema).map(([key, field]) => {
                    if (field.type === 'multiselect') {
                        return (
                            <div key={key} className="md:col-span-2 lg:col-span-3">
                                <label className="block text-sm font-medium text-gray-300">{field.label || key}</label>
                                <div className="mt-1 p-2 bg-gray-800 rounded-md text-xs text-gray-400 font-mono">
                                    {formData[key] ? formData[key].join(', ') : 'None'}
                                </div>
                            </div>
                        );
                    }
                    return (
                        <div key={key} className={field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}>
                            <label className="block text-sm font-medium text-gray-300">{field.label || key}</label>
                            {field.type === 'textarea' ? (
                                <textarea name={key} value={formData[key] || ''} onChange={handleChange} rows="2" className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:ring-amber-500 focus:border-amber-500 text-sm" />
                            ) : field.type === 'select' ? (
                                <select name={key} value={formData[key] || ''} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:ring-amber-500 focus:border-amber-500 text-sm">
                                    <option value="">-- Select --</option>
                                    {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            ) : field.type === 'checkbox' ? (
                                <input type="checkbox" name={key} checked={formData[key] || false} onChange={handleChange} className="mt-2 bg-gray-700 border-gray-600 rounded h-5 w-5 text-sky-500 focus:ring-sky-600" />
                            ) : (
                                <input type={field.type || 'text'} name={key} value={formData[key] || ''} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:ring-amber-500 focus:border-amber-500 text-sm" />
                            )}
                        </div>
                    );
                })}
            </div>
        </form>
    );
}

// --- COMPONENT: MigrationPanel (Internal) ---
function MigrationPanel({ stagedData, setStagedData, addLog, db }) {

    const handleDataChange = (updatedItem, itemIndex, itemType, subIndex = null) => {
        const newStagedData = [...stagedData];
        if (itemType === 'ability') {
            newStagedData[itemIndex].ability_to_create = updatedItem;
        } else if (itemType === 'effect') {
            newStagedData[itemIndex].effects_to_create[subIndex] = updatedItem;
        }
        setStagedData(newStagedData);
    };

    const handleRemoveItem = (indexToRemove) => {
        setStagedData(currentData => currentData.filter((_, index) => index !== indexToRemove));
        addLog('info', `Removed staged item ${indexToRemove + 1} from the workshop.`);
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

    const handleCommitItem = async (item, index) => {
        if (!db) {
            addLog('error', 'Commit failed: Database not connected.');
            return;
        }
        addLog('special', `Initiating surgical commit of item ${index + 1}: ${item.ability_to_create.name}...`);

        const batch = writeBatch(db);
        let effectCount = 0;
        let abilityCount = 0;
        
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

        try {
            await batch.commit();
            addLog('success', `Surgical commit successful for '${item.ability_to_create.name}'.`);
            handleRemoveItem(index);
        } catch (e) {
            addLog('error', `Error during surgical commit: ${e.message}`);
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-amber-500/50">
            <h2 className="text-2xl font-semibold text-amber-300 mb-4 text-center">Migration Workshop</h2>
            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-8">
                {stagedData && stagedData.length > 0 ? (
                    stagedData.map((item, index) => (
                        <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-4">
                            <div className="flex justify-between items-center gap-4">
                                <h3 className="text-2xl font-semibold text-amber-400">Staged Item {index + 1}: {item.ability_to_create.name}</h3>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => handleCommitItem(item, index)}
                                        className="bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold py-1 px-3 text-sm rounded-lg transition"
                                    >
                                        Commit Item
                                    </button>
                                    <button
                                        onClick={() => handleRemoveItem(index)}
                                        className="bg-red-600/50 hover:bg-red-600 text-white font-bold py-1 px-3 text-sm rounded-lg transition"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-lg font-semibold text-emerald-300 mb-2 border-b border-emerald-500/50 pb-1">Proposed Ability</h4>
                                <MigrationForm
                                    schema={UKB_SCHEMAS.abilities}
                                    initialData={item.ability_to_create}
                                    formId={`ability-form-${index}`}
                                    onDataChange={(data) => handleDataChange(data, index, 'ability')}
                                />
                            </div>
                            
                            {item.effects_to_create && item.effects_to_create.length > 0 && (
                                <div>
                                    <h4 className="text-lg font-semibold text-sky-300 mb-2 border-b border-sky-500/50 pb-1">Proposed Effects</h4>
                                    <div className="space-y-4">
                                        {item.effects_to_create.map((effect, effectIndex) => (
                                            <MigrationForm
                                                key={effectIndex}
                                                schema={UKB_SCHEMAS.effects}
                                                initialData={effect}
                                                formId={`effect-form-${index}-${effectIndex}`}
                                                onDataChange={(data) => handleDataChange(data, index, 'effect', effectIndex)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-400">
                        Upload an image in The Forge to begin the automated deconstruction pipeline. Proposed objects will appear here for verification.
                    </p>
                )}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button
                    onClick={handleCommitAll}
                    className="w-full bg-emerald-400 hover:bg-emerald-500 text-gray-900 font-bold py-3 px-6 rounded-lg text-lg transition disabled:bg-emerald-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                    disabled={stagedData.length === 0}
                >
                    Approve & Commit All {stagedData.length > 0 && `(${stagedData.length})`}
                </button>
                <button
    onClick={handleClearAll}
    className="w-full bg-amber-700/50 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
>
    Reject and Clear All {stagedData.length > 0 && `(${stagedData.length})`}
</button>
            </div>
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
                return <ForgePanel setStagedData={setStagedData} addLog={addLog} setActiveTab={setActiveTab} />;
            case 'migration':
                return <MigrationPanel stagedData={stagedData} setStagedData={setStagedData} addLog={addLog} db={db} />;
            case 'admin':
                return <AdminPanel addLog={addLog} db={db} />; // <-- PROP ADDED HERE
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

