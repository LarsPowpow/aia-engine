import { useState, useEffect, useCallback } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, writeBatch, doc, collection, getDocs, addDoc, setDoc } from "firebase/firestore";

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

// --- UKB Schemas ---
const UKB_SCHEMAS = {
    effects: {
        effect_id: { type: 'text', label: 'Effect ID', required: true, overridable: false },
        name: { type: 'text', label: 'Name', overridable: true },
        type: { type: 'select', label: 'Type', options: ['EMPOWER', 'BLEED', 'FORTIFY', 'HASTE', 'SLOW', 'HEAL', 'DAMAGE', 'ROOT', 'STUN', 'WEAKEN', 'REND', 'MANA_RESTORE'], overridable: true },
        application_trigger: { type: 'text', label: 'Application Trigger', overridable: true },
        target: { type: 'select', label: 'Target', options: ['SELF', 'TARGET', 'GROUP_IN_AOE', 'FRIENDLY_TARGET'], overridable: true },
        value_type: { type: 'select', label: 'Value Type', options: ['PERCENTAGE', 'FLAT', 'WEAPON_DAMAGE_PCT', 'BASE_HEALTH_PCT'], overridable: true },
        value: { type: 'text', label: 'Value', overridable: true },
        duration_seconds: { type: 'number', label: 'Duration (s)', overridable: true },
        is_stackable: { type: 'checkbox', label: 'Is Stackable', overridable: true },
        max_stacks: { type: 'number', label: 'Max Stacks', overridable: true },
        scales_with_attribute: { type: 'select', label: 'Scales With', options: ['', 'FOCUS', 'INTELLIGENCE', 'STRENGTH', 'DEXTERITY', 'CONSTITUTION'], overridable: true },
        synergy_tags: { type: 'textarea', label: 'Synergy Tags', overridable: true },
        description: { type: 'textarea', label: 'Description', overridable: true },
    },
    abilities: {
        ability_id: { type: 'text', label: 'Ability ID', required: true, overridable: false },
        name: { type: 'text', label: 'Name', overridable: true },
        type: { type: 'select', label: 'Type', options: ['PERK', 'WEAPON_MASTERY', 'GEM', 'STATUS_EFFECT'], overridable: true },
        trigger: { type: 'text', label: 'Trigger', overridable: true },
        effects_to_apply: { type: 'multiselect', label: 'Effects to Apply', overridable: true },
        prerequisites: { type: 'textarea', label: 'Prerequisites', overridable: true },
        internal_cooldown_seconds: { type: 'number', label: 'Internal Cooldown (s)', overridable: true },
        description: { type: 'textarea', label: 'Description', overridable: true },
    }
};

// --- COMPONENT: MigrationForm (Internal to App) ---
function MigrationForm({ schema, initialData, formId, onDataChange, allEffects = [], onOverride }) {
    const [formData, setFormData] = useState(initialData || {});
    useEffect(() => { setFormData(initialData || {}); }, [initialData]);
    const triggerChange = (newData) => { setFormData(newData); onDataChange(newData); };
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let newValue;
        if (type === 'checkbox') { newValue = checked; }
        else if (type === 'number') { newValue = parseFloat(value) || 0; }
        else if (schema[name]?.type === 'textarea' && (name === 'synergy_tags' || name === 'prerequisites')) {
             newValue = value.split(',').map(s => s.trim()).filter(Boolean);
        } else { newValue = value; }
        triggerChange({ ...formData, [name]: newValue });
    };
    const handleMultiSelectChange = (e) => {
        const { value, checked } = e.target;
        const currentValues = formData.effects_to_apply || [];
        let newValues;
        if (checked) { newValues = [...currentValues, value]; }
        else { newValues = currentValues.filter(val => val !== value); }
        triggerChange({ ...formData, effects_to_apply: newValues });
    };
    return (
        <form id={formId} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(schema).map(([key, field]) => {
                    let value = (formData && formData[key]) ? formData[key] : '';
                    if (Array.isArray(value) && (key === 'synergy_tags' || key === 'prerequisites')) {
                        value = value.join(', ');
                    }
                    if (field.type === 'multiselect') {
                        return (
                             <div key={key} className="md:col-span-2 lg:col-span-3">
                                 <label className="block text-sm font-medium text-gray-300">{field.label}</label>
                                 <div className="mt-2 h-32 overflow-y-auto bg-gray-900/50 p-2 rounded-md border border-gray-700 grid grid-cols-2 md:grid-cols-3 gap-2">
                                     {allEffects.sort((a,b) => a.localeCompare(b)).map(effectId => (
                                         <label key={effectId} className="flex items-center space-x-2 text-sm font-mono">
                                             <input type="checkbox" value={effectId} checked={(formData.effects_to_apply || []).includes(effectId)} onChange={handleMultiSelectChange} className="bg-gray-800 border-gray-600 rounded h-4 w-4 text-emerald-500 focus:ring-emerald-600" />
                                             <span className="truncate">{effectId}</span>
                                         </label>
                                     ))}
                                 </div>
                             </div>
                        );
                    }
                    return (
                        <div key={key} className={field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}>
                            <label htmlFor={`${formId}-${key}`} className="flex items-center text-sm font-medium text-gray-300">
                                {field.label}
                                {field.overridable && (
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const correctValue = prompt(`Create override for "${field.label}".\n\nEnter the correct value that should ALWAYS be used for this perk:`);
                                            if (correctValue) onOverride(key, correctValue);
                                        }}
                                        className="ml-2 text-xs bg-purple-700 hover:bg-purple-600 text-white font-bold py-0.5 px-1.5 rounded-sm"
                                        title={`Create a permanent override rule for this field.`}
                                    >
                                        O
                                    </button>
                                )}
                            </label>
                            {field.type === 'textarea' ? ( <textarea id={`${formId}-${key}`} name={key} value={value} onChange={handleChange} rows={2} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-sm" />
                            ) : field.type === 'select' ? ( <select id={`${formId}-${key}`} name={key} value={value} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-sm"> <option value="">-- Select --</option> {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)} </select>
                            ) : field.type === 'checkbox' ? ( <div className="flex items-center h-full mt-1"> <input id={`${formId}-${key}`} name={key} type="checkbox" checked={!!value} onChange={handleChange} className="bg-gray-700 border-gray-600 rounded h-5 w-5 text-amber-500 focus:ring-amber-600" /> </div>
                            ) : ( <input id={`${formId}-${key}`} name={key} type={field.type} value={value} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-sm" />
                            )}
                        </div>
                    );
                })}
            </div>
        </form>
    );
}

// --- COMPONENT: MigrationPanel (Internal to App) ---
function MigrationPanel({ stagedData, setStagedData, addLog, db, onOverride }) {
    const handleDataChange = (itemIndex, dataType, effectIndex, newData) => {
        const newStagedData = JSON.parse(JSON.stringify(stagedData));
        if (dataType === 'ability') { newStagedData[itemIndex].ability_to_create = newData; }
        else if (dataType === 'effect') { newStagedData[itemIndex].effects_to_create[effectIndex] = newData; }
        setStagedData(newStagedData);
    };
    const handleClearAll = () => { setStagedData([]); addLog('info', 'Migration staging area has been cleared.'); };
    const handleCommitAll = async () => {
        if (!db || stagedData.length === 0) { addLog('error', 'Commit failed: No data staged or database not connected.'); return; }
        addLog('special', `Initiating commit of ${stagedData.length} item(s) to UKB...`);
        const batch = writeBatch(db);
        let effectCount = 0; let abilityCount = 0;
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
        } catch (e) { addLog('error', `Error committing to UKB: ${e.message}`); }
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
                                    allEffects={[...item.effects_to_create.map(e => e.effect_id), ...(item.ability_to_create.effects_to_apply || [])].filter((v, i, a) => a.indexOf(v) === i)} 
                                    onDataChange={(newData) => handleDataChange(itemIndex, 'ability', null, newData)}
                                    onOverride={(field, value) => onOverride(item.original_perk.id, `ability.${field}`, value)}
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
                                                    onOverride={(field, value) => onOverride(item.original_perk.id, `effect.${effectIndex}.${field}`, value)}
                                                 />
                                             </div>
                                        ))
                                    ) : ( <p className="text-gray-500 italic">No effects were generated for this item.</p> )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : ( <p className="text-center text-gray-400"> The workshop is empty. Run the Deconstructor in The Forge to stage items for verification. </p> )}
            </div>
            {stagedData && stagedData.length > 0 && (
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <button onClick={handleCommitAll} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition"> Approve & Commit All ({stagedData.length}) </button>
                    <button onClick={handleClearAll} className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 px-6 rounded-lg text-lg transition"> Reject and Clear All ({stagedData.length}) </button>
                </div>
            )}
        </div>
    );
}

// --- MAIN APP COMPONENT ---
function App() {
    const [activeTab, setActiveTab] = useState('viewer');
    const [logs, setLogs] = useState([]);
    const [db, setDb] = useState(null);
    const [stagedData, setStagedData] = useState([]);
    const [apiKey, setApiKey] = useState('');
    const [prompts, setPrompts] = useState([]);
    const [selectedPromptId, setSelectedPromptId] = useState('');
    const [activePromptContent, setActivePromptContent] = useState('');
    const [isLogExpanded, setIsLogExpanded] = useState(false);

    const addLog = useCallback((type, message) => {
        const timestamp = new Date().toLocaleTimeString();
        const typeClasses = { success: 'text-emerald-400', error: 'text-red-400', info: 'text-gray-400', special: 'text-amber-400', system: 'text-purple-400'};
        setLogs(prevLogs => [...prevLogs, { timestamp, message, typeClass: typeClasses[type] || typeClasses.info }]);
    }, []);
    
    useEffect(() => {
        const savedApiKey = localStorage.getItem('geminiApiKey');
        if (savedApiKey) { setApiKey(savedApiKey); addLog('info', 'Gemini API Key loaded from memory.'); }
    }, [addLog]);

    const handleApiKeyChange = (e) => {
        const newKey = e.target.value;
        setApiKey(newKey);
        localStorage.setItem('geminiApiKey', newKey);
    };

    useEffect(() => {
        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        setDb(firestore);
        addLog('success', 'Firebase UKB connection established.');
        
        const fetchPrompts = async () => {
            addLog('info', 'Fetching AI prompts from database...');
            try {
                const querySnapshot = await getDocs(collection(firestore, 'prompts'));
                const promptsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPrompts(promptsData);

                if (promptsData.length > 0) {
                    addLog('success', `Found ${promptsData.length} prompts in the database.`);
                    setSelectedPromptId(promptsData[0].id);
                    setActivePromptContent(promptsData[0].content);
                } else {
                    addLog('warning', 'No prompts found in the database. Please add one via the Admin Panel.');
                }
            } catch (error) { addLog('error', `Failed to fetch prompts: ${error.message}`); }
        };
        fetchPrompts();
    }, [addLog]);

    const handlePromptSelect = (promptId) => {
        const selected = prompts.find(p => p.id === promptId);
        if (selected) {
            setSelectedPromptId(selected.id);
            setActivePromptContent(selected.content);
            addLog('info', `Loaded prompt: ${selected.name || selected.id}`);
        }
    };

    const handlePromptContentChange = (newContent) => { setActivePromptContent(newContent); };
    
    const handleSaveNewPromptVersion = async () => {
        if (!db) { addLog('error', 'Database not connected. Cannot save prompt.'); return; }
        const newPromptName = prompt('Enter a name for this new prompt version (e.g., v2.3_with_synergy_tags):');
        if (newPromptName && activePromptContent) {
            try {
                const docRef = await addDoc(collection(db, 'prompts'), { name: newPromptName, content: activePromptContent, timestamp: new Date(), });
                addLog('success', `New prompt version "${newPromptName}" saved with ID: ${docRef.id}`);
                const querySnapshot = await getDocs(collection(db, 'prompts'));
                const promptsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPrompts(promptsData);
            } catch (error) { addLog('error', `Failed to save new prompt: ${error.message}`); }
        }
    };

    const handleCreateOverride = async (perkId, fieldToOverride, correctValue) => {
        if (!db) { addLog('error', 'Database not connected. Cannot create override.'); return; }
        addLog('special', `Creating override rule for ${perkId}...`);
        try {
            const overrideRef = doc(db, 'exception_overrides', perkId);
            await setDoc(overrideRef, { [fieldToOverride]: correctValue }, { merge: true });
            addLog('success', `Override rule created: For perk "${perkId}", the field "${fieldToOverride}" will now always be "${correctValue}".`);
        } catch (error) { addLog('error', `Failed to create override: ${error.message}`); }
    };

    const handleClearSystemLog = () => {
        setLogs([]);
        addLog('info', 'System Log cleared by Captain.');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'viewer': return <ViewerPage db={db} addLog={addLog} />;
            case 'forge':
                return <ForgePanel 
                           db={db}
                           setStagedData={setStagedData}
                           addLog={addLog} 
                           setActiveTab={setActiveTab} 
                           apiKey={apiKey}
                           onApiKeyChange={handleApiKeyChange}
                           activePromptContent={activePromptContent}
                       />;
            case 'migration': 
                return <MigrationPanel 
                           stagedData={stagedData} 
                           setStagedData={setStagedData} 
                           addLog={addLog} 
                           db={db}
                           onOverride={handleCreateOverride} 
                       />;
            case 'admin':
                return <AdminPanel 
                           addLog={addLog} 
                           db={db}
                           prompts={prompts}
                           selectedPromptId={selectedPromptId}
                           activePromptContent={activePromptContent}
                           onPromptSelect={handlePromptSelect}
                           onPromptContentChange={handlePromptContentChange}
                           onSaveNewPrompt={handleSaveNewPromptVersion}
                           onClearSystemLog={handleClearSystemLog}
                       />;
            default: return null;
        }
    };

    return (
        <div className="bg-gray-900 text-gray-200 h-screen font-sans flex flex-col">
            <header className="bg-gray-800 border-b border-gray-700 p-4 shadow-lg flex-shrink-0">
                <div className="w-full max-w-screen-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-center text-teal-400 tracking-wider">
                        Aeternum Intelligence Agency
                    </h1>
                    <p className="text-center text-teal-600 text-sm">Cockpit v2.0</p>
                </div>
            </header>

            <div className="w-full max-w-screen-2xl mx-auto flex-grow overflow-hidden flex flex-col">
                <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
                <main className="flex-grow p-4 md:p-8 overflow-y-auto">
                    {renderContent()}
                </main>
            </div>

            <footer className="flex-shrink-0 bg-gray-900 border-t border-gray-700 p-4">
                <div className="w-full max-w-screen-2xl mx-auto">
                    <SystemLog 
                        logs={logs} 
                        isExpanded={isLogExpanded}
                        setIsExpanded={setIsLogExpanded}
                    />
                </div>
            </footer>
        </div>
    );
}

export default App;