import { useState, useEffect, useCallback } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, writeBatch, doc, collection, getDocs, addDoc, setDoc, updateDoc, arrayUnion, deleteDoc, getDoc } from "firebase/firestore";

// Component Imports
import ViewerPage from './components/ViewerPage.jsx';
import TabNavigation from './components/TabNavigation.jsx';
import SystemLog from './components/SystemLog.jsx';
import ForgePanel from './components/ForgePanel.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import OverrideModal from './components/OverrideModal.jsx';
import { OverridesContext } from './contexts/OverridesContext.jsx';
import { SchemaContext } from './contexts/SchemaContext.jsx';


// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// --- UKB Schemas (The "Hardcoded" Dictionary) ---
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
        type: { type: 'select', label: 'Type', options: ['PERK', 'WEAPON_MASTERY', 'GEM', 'STATUS_EFFECT', 'ATTRIBUTE_BONUS'], overridable: true },
        trigger: { type: 'text', label: 'Trigger', overridable: true },
        effects_to_apply: { type: 'multiselect', label: 'Effects to Apply', overridable: true },
        prerequisites: { type: 'textarea', label: 'Prerequisites', overridable: true },
        internal_cooldown_seconds: { type: 'number', label: 'Internal Cooldown (s)', overridable: true },
        description: { type: 'textarea', label: 'Description', overridable: true },
    }
};

// --- COMPONENT: MigrationForm (Internal to App) ---
function MigrationForm({ schema, initialData, formId, onDataChange, allEffects = [], onOpenOverrideModal, perkId, fieldPathPrefix, schemaName }) {
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
                                        onClick={() => onOpenOverrideModal(perkId, `${fieldPathPrefix}.${key}`, field.label, key, schemaName)}
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
function MigrationPanel({ stagedData, setStagedData, addLog, db, onOpenOverrideModal }) {
    const handleDataChange = (itemIndex, dataType, effectIndex, newData) => {
        const newStagedData = JSON.parse(JSON.stringify(stagedData));
        if (dataType === 'ability') { newStagedData[itemIndex].ability_to_create = newData; }
        else if (dataType === 'effect') { newStagedData[itemIndex].effects_to_create[effectIndex] = newData; }
        setStagedData(newStagedData);
    };
    const handleClearAll = () => { setStagedData([]); addLog('info', 'Migration staging area has been cleared.'); };
    
    // --- UPGRADED COMMIT PROTOCOL ---
    const handleCommitAll = async () => {
        if (!db || stagedData.length === 0) { addLog('error', 'Commit failed: No data staged or database not connected.'); return; }
        addLog('special', `Initiating commit of ${stagedData.length} item(s) to UKB...`);
        const batch = writeBatch(db);
        let effectCount = 0; let abilityCount = 0;

        stagedData.forEach(item => {
            let abilityToCommit = null;
            
            // Check for the legacy wrapped structure for perks
            if (item.ability_to_create) {
                abilityToCommit = item.ability_to_create;
            } 
            // Assume flat structure for direct data (like attribute bonuses) if the legacy one isn't found
            else if (item.ability_id) { 
                abilityToCommit = item;
            }

            // If we found an ability to commit (either nested or flat)
            if (abilityToCommit && abilityToCommit.ability_id) {
                let targetCollection = 'abilities'; // Default collection
                if (abilityToCommit.type === 'ATTRIBUTE_BONUS') {
                    targetCollection = 'attribute_bonuses';
                }
                
                const abilityRef = doc(db, targetCollection, abilityToCommit.ability_id);
                batch.set(abilityRef, abilityToCommit, { merge: true });
                abilityCount++;
            }

            // Effects logic remains the same, as it's only expected with the wrapped structure
            if (item.effects_to_create && Array.isArray(item.effects_to_create)) {
                item.effects_to_create.forEach(effect => {
                    if (effect.effect_id) {
                        const effectRef = doc(db, 'effects', effect.effect_id);
                        batch.set(effectRef, effect, { merge: true });
                        effectCount++;
                    }
                });
            }
        });

        try {
            await batch.commit();
            addLog('success', `Commit successful: ${abilityCount} ability(s) and ${effectCount} effect(s) saved to UKB.`);
            handleClearAll();
        } catch (e) { addLog('error', `Error committing to UKB: ${e.message}`); }
    };
    
    // Defensive: ensure stagedData is always an array
    const safeStagedData = Array.isArray(stagedData) ? stagedData : [];
    return (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-amber-500/50">
            <h2 className="text-2xl font-semibold text-amber-300 mb-4 text-center">Migration Workshop</h2>
            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-8">
                {safeStagedData.length > 0 ? (
                    safeStagedData.map((item, itemIndex) => (
                        <div key={itemIndex} className="bg-gray-800/50 p-4 rounded-lg border border-gray-600 space-y-4">
                            <h3 className="text-xl font-semibold text-amber-400">Staged Item #{itemIndex + 1}: {item.original_perk?.name || item.name || 'Untitled'}</h3>
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                <h4 className="text-lg font-semibold text-emerald-300 mb-2 border-b border-emerald-500/50 pb-1">Proposed Ability</h4>
                                <MigrationForm
                                    schema={UKB_SCHEMAS.abilities}
                                    initialData={item.ability_to_create || item}
                                    formId={`ability-${itemIndex}`}
                                    allEffects={Array.isArray(item.effects_to_create) ? [...item.effects_to_create.map(e => e.effect_id), ...(item.ability_to_create?.effects_to_apply || [])].filter((v, i, a) => a.indexOf(v) === i) : []}
                                    onDataChange={(newData) => handleDataChange(itemIndex, 'ability', null, newData)}
                                    onOpenOverrideModal={onOpenOverrideModal}
                                    perkId={item.original_perk?.id || item.ability_id || ''}
                                    fieldPathPrefix="ability"
                                    schemaName="abilities"
                                />
                            </div>
                            {item.effects_to_create && (
                                <div>
                                    <h4 className="text-lg font-semibold text-sky-300 mb-2 mt-4 border-b border-sky-500/50 pb-1">Proposed Effects</h4>
                                    <div className="space-y-4">
                                        {Array.isArray(item.effects_to_create) && item.effects_to_create.length > 0 ? (
                                            item.effects_to_create.map((effect, effectIndex) => (
                                                 <div key={effectIndex} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                                     <MigrationForm
                                                         schema={UKB_SCHEMAS.effects}
                                                         initialData={effect}
                                                         formId={`effect-${itemIndex}-${effectIndex}`}
                                                         onDataChange={(newData) => handleDataChange(itemIndex, 'effect', effectIndex, newData)}
                                                         onOpenOverrideModal={onOpenOverrideModal}
                                                         perkId={item.original_perk?.id || ''}
                                                         fieldPathPrefix={`effect.${effectIndex}`}
                                                         schemaName="effects"
                                                    />
                                                 </div>
                                            ))
                                        ) : ( <p className="text-gray-500 italic">No effects were generated for this item.</p> )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : ( <p className="text-center text-gray-400"> The workshop is empty. Run the Deconstructor in The Forge to stage items for verification. </p> )}
            </div>
            {safeStagedData.length > 0 && (
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <button onClick={handleCommitAll} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition"> Approve & Commit All ({safeStagedData.length}) </button>
                    <button onClick={handleClearAll} className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 px-6 rounded-lg text-lg transition"> Reject and Clear All ({safeStagedData.length}) </button>
                </div>
            )}
        </div>
    );
}

// --- MAIN APP COMPONENT ---
function App() {
    const [activeTab, setActiveTab] = useState('admin');
    const [logs, setLogs] = useState([]);
    const [db, setDb] = useState(null);
    const [stagedData, setStagedData] = useState([]);
    const [apiKey, setApiKey] = useState('');
    const [prompts, setPrompts] = useState([]);
    const [selectedPromptId, setSelectedPromptId] = useState('');
    const [activePromptContent, setActivePromptContent] = useState('');
    const [isLogExpanded, setIsLogExpanded] = useState(false);
    const [overrideRules, setOverrideRules] = useState({});
    const [schemaExtensions, setSchemaExtensions] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [covenant, setCovenant] = useState('Covenant text not yet generated.');

    const addLog = useCallback((type, message) => {
        const timestamp = new Date().toLocaleTimeString();
        const typeClasses = { success: 'text-emerald-400', error: 'text-red-400', info: 'text-gray-400', special: 'text-amber-400', system: 'text-purple-400'};
        setLogs(prevLogs => [...prevLogs, { timestamp, message, typeClass: typeClasses[type] || typeClasses.info }]);
    }, []);
    
    const fetchPrompts = useCallback(async (firestore) => {
        if (!firestore) return;
        addLog('info', 'Refreshing prompt library...');
        try {
            const querySnapshot = await getDocs(collection(firestore, 'prompts'));
            const promptsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            promptsData.sort((a, b) => {
                const aTime = a.timestamp?.toMillis() || 0;
                const bTime = b.timestamp?.toMillis() || 0;
                if (bTime !== aTime) return bTime - aTime;
                return (b.name || '').localeCompare(a.name || '');
            });
            
            setPrompts(promptsData);

            if (promptsData.length > 0) {
                const latestPrompt = promptsData[0];
                setSelectedPromptId(latestPrompt.id);
                setActivePromptContent(latestPrompt.content);
                addLog('success', `Prompt library refreshed. Auto-selected "${latestPrompt.name}".`);
            } else { 
                addLog('warning', 'Prompt library is empty.');
                setSelectedPromptId('');
                setActivePromptContent('');
            }
        } catch (error) {
            addLog('error', `Failed to refresh prompts: ${error.message}`);
        }
    }, [addLog]);
    
    const fetchSchemaExtensions = useCallback(async (firestore) => {
        if (!firestore) return;
        addLog('info', 'Refreshing Living Dictionary...');
        try {
            const querySnapshot = await getDocs(collection(firestore, 'ukb_schema_extensions'));
            const extensions = {};
            querySnapshot.forEach(doc => {
                extensions[doc.id] = doc.data().values || [];
            });
            setSchemaExtensions(extensions);
            addLog('success', 'Living Dictionary is up to date.');
        } catch (error) {
            addLog('error', `Failed to refresh Living Dictionary: ${error.message}`);
        }
    }, [addLog]);


    useEffect(() => {
        const savedApiKey = localStorage.getItem('geminiApiKey');
        if (savedApiKey) { setApiKey(savedApiKey); addLog('info', 'Gemini API Key loaded from memory.'); }
    }, [addLog]);

    useEffect(() => {
        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        setDb(firestore);
        addLog('success', 'Firebase UKB connection established.');

        const fetchAllData = async () => {
            try {
                addLog('info', 'Fetching all operational data from UKB...');
                const [overridesSnap, extensionsSnap] = await Promise.all([
                    getDocs(collection(firestore, 'exception_overrides')),
                    getDocs(collection(firestore, 'ukb_schema_extensions'))
                ]);

                await fetchPrompts(firestore); // Initial prompt fetch

                const rules = {};
                overridesSnap.forEach(doc => { rules[doc.id] = doc.data(); });
                setOverrideRules(rules);
                if (Object.keys(rules).length > 0) addLog('success', `Loaded ${Object.keys(rules).length} override rule(s).`);
                
                const extensions = {};
                extensionsSnap.forEach(doc => { extensions[doc.id] = doc.data().values || []; });
                setSchemaExtensions(extensions);
                if (Object.keys(extensions).length > 0) addLog('success', `Loaded ${Object.values(extensions).flat().length} custom schema values.`);

                addLog('special', 'All operational data loaded.');
            } catch (error) {
                console.error("Error fetching all data:", error);
                addLog('error', `Failed to fetch operational data: ${error.message}`);
            }
        };
        fetchAllData();
    }, [addLog, fetchPrompts]);

    const handleApiKeyChange = (e) => {
        setApiKey(e.target.value);
        localStorage.setItem('geminiApiKey', e.target.value);
    };

    const handleSchemaChange = useCallback(async () => {
        if (!db) return;
        await fetchSchemaExtensions(db);
    }, [db, fetchSchemaExtensions]);

    const handleOpenOverrideModal = (perkId, fieldPath, fieldLabel, fieldKey, schemaName) => {
        setModalData({ perkId, fieldPath, fieldLabel, fieldKey, schemaName });
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setModalData(null);
    };

    const handleModalSubmit = async (newValue) => {
        if (!modalData) return;
        const { perkId, fieldPath, fieldKey, schemaName } = modalData;
        await handleCreateOverride(perkId, fieldPath, newValue);

        const standardOptions = UKB_SCHEMAS[schemaName]?.[fieldKey]?.options || [];
        const customOptions = schemaExtensions[fieldKey] || [];
        addLog('special', `New custom value "${newValue}" detected. Adding to Living Dictionary...`);
        try {
            const extensionRef = doc(db, 'ukb_schema_extensions', fieldKey);
            const docSnap = await getDoc(extensionRef);
            if (docSnap.exists()) {
                await updateDoc(extensionRef, { values: arrayUnion(newValue) });
            } else {
                await setDoc(extensionRef, { values: [newValue] });
            }
            addLog('success', `Added "${newValue}" to the Living Dictionary.`);
            await handleSchemaChange();
        } catch (error) {
            addLog('error', `Failed to add new custom value: ${error.message}`);
        }
        handleModalClose();
    };

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
        if (!db) { addLog('error', 'Database not connected.'); return; }
        const newPromptName = prompt('Enter a name for this new prompt version:');
        if (newPromptName && activePromptContent) {
            try {
                await addDoc(collection(db, 'prompts'), { name: newPromptName, content: activePromptContent, timestamp: new Date(), });
                addLog('success', `New prompt version "${newPromptName}" saved.`);
                await fetchPrompts(db); // Refresh the prompt list
            } catch (error) { addLog('error', `Failed to save new prompt: ${error.message}`); }
        }
    };

    const handleDeletePrompt = async () => {
        if (!db || !selectedPromptId) return;
        const promptToDelete = prompts.find(p => p.id === selectedPromptId);
        if (!promptToDelete) return;

        if (window.confirm(`Are you sure you want to permanently delete the prompt "${promptToDelete.name}"? This action cannot be undone.`)) {
            addLog('special', `Deleting prompt "${promptToDelete.name}"...`);
            try {
                await deleteDoc(doc(db, 'prompts', selectedPromptId));
                addLog('success', 'Prompt successfully deleted.');
                await fetchPrompts(db); // Refresh list and auto-select new latest
            } catch (error) {
                addLog('error', `Failed to delete prompt: ${error.message}`);
            }
        }
    };

    const handleCreateOverride = async (perkId, fieldToOverride, correctValue) => {
        if (!db) { addLog('error', 'DB not connected.'); return; }
        addLog('special', `Creating override rule for ${perkId}...`);
        try {
            const overrideRef = doc(db, 'exception_overrides', perkId);
            await setDoc(overrideRef, { [fieldToOverride]: correctValue }, { merge: true });
            addLog('success', `Override rule created for "${perkId}".`);
            setOverrideRules(prev => ({ ...prev, [perkId]: { ...prev[perkId], [fieldToOverride]: correctValue } }));
        } catch (error) { addLog('error', `Failed to create override: ${error.message}`); }
    };
    
    const handleClearSystemLog = () => {
        setLogs([]);
        addLog('info', 'System Log cleared by Captain.');
    };

    const deleteCollection = async (collectionName) => {
        if (!db) { addLog('error', 'Database not connected.'); return; }
        addLog('special', `Initiating full purge of "${collectionName}" collection...`);
        try {
            const querySnapshot = await getDocs(collection(db, collectionName));
            if (querySnapshot.empty) {
                addLog('info', `Collection '${collectionName}' is already empty.`);
                return;
            }
            const batch = writeBatch(db);
            querySnapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            addLog('success', `Successfully purged ${querySnapshot.size} document(s) from "${collectionName}".`);
        } catch(e) {
            addLog('error', `Failed to purge collection "${collectionName}": ${e.message}`);
        }
    };
    
    const handleClearUkb = () => {
        deleteCollection('abilities');
        deleteCollection('effects');
    };
    
    const handleClearArchive = () => {
        deleteCollection('raw_data_archive');
    };
    
    const handleBootstrapData = () => {
        addLog('error', 'Function "onBootstrapData" is not yet implemented.');
    };
    
    const handleGenerateCovenant = async () => {
        if (!db) { addLog('error', 'Database not connected.'); return; }
        addLog('special', 'Initiating Cold Storage Protocol...');
        
        const collectionsToBackup = ['abilities', 'effects', 'raw_data_archive', 'prompts', 'exception_overrides', 'ukb_schema_extensions'];
        const backupData = {
            metadata: {
                backupDate: new Date().toISOString(),
                version: "2.0"
            },
            data: {}
        };

        try {
            for (const collectionName of collectionsToBackup) {
                addLog('info', `Backing up '${collectionName}'...`);
                const querySnapshot = await getDocs(collection(db, collectionName));
                backupData.data[collectionName] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
            
            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toISOString().split('T')[0];
            a.download = `AIA_Backup_${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            addLog('success', 'Cold Storage backup successfully generated and download initiated.');

        } catch (error) {
            addLog('error', `Cold Storage backup failed: ${error.message}`);
        }
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
                            prompts={prompts}
                            selectedPromptId={selectedPromptId}
                            onPromptSelect={handlePromptSelect}
                            onPromptContentChange={handlePromptContentChange}
                            onSaveNewPrompt={handleSaveNewPromptVersion}
                            onDeletePrompt={handleDeletePrompt}
                        />;
            case 'migration':
                return <MigrationPanel stagedData={stagedData} setStagedData={setStagedData} addLog={addLog} db={db} onOpenOverrideModal={handleOpenOverrideModal} />;
            case 'admin':
                return <AdminPanel 
                            db={db} 
                            addLog={addLog}
                            UKB_SCHEMAS={UKB_SCHEMAS}
                            onSchemaChange={handleSchemaChange}
                            onClearUkb={handleClearUkb}
                            onClearArchive={handleClearArchive}
                            onBootstrapData={handleBootstrapData}
                            covenant={covenant}
                            onGenerateCovenant={handleGenerateCovenant}
                            onClearSystemLog={handleClearSystemLog}
                            prompts={prompts}
                            selectedPromptId={selectedPromptId}
                            activePromptContent={activePromptContent}
                            onPromptSelect={handlePromptSelect}
                            onPromptContentChange={handlePromptContentChange}
                            onSaveNewPrompt={handleSaveNewPromptVersion}
                        />;
            default: return null;
        }
    };

    const getModalOptions = () => {
        if (!modalData) return [];
        const { fieldKey, schemaName } = modalData;
        const standardOptions = UKB_SCHEMAS[schemaName]?.[fieldKey]?.options || [];
        const customOptions = schemaExtensions[fieldKey] || [];
        return [...new Set([...standardOptions, ...customOptions])];
    };

    return (
        <OverridesContext.Provider value={overrideRules}>
            <SchemaContext.Provider value={schemaExtensions}>
                <div className="bg-gray-900 text-gray-200 h-screen font-sans flex flex-col">
                    <OverrideModal 
                        isOpen={isModalOpen}
                        onClose={handleModalClose}
                        onSubmit={handleModalSubmit}
                        fieldLabel={modalData?.fieldLabel || ''}
                        allOptions={getModalOptions()}
                    />
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
                            <SystemLog logs={logs} isExpanded={isLogExpanded} setIsExpanded={setIsLogExpanded} />
                        </div>
                    </footer>
                </div>
            </SchemaContext.Provider>
        </OverridesContext.Provider>
    );
}

export default App;