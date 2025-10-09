import { useState, useEffect, useCallback } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, writeBatch, doc } from "firebase/firestore";

// --- Firebase Configuration (Integrated) ---
const firebaseConfig = {
    apiKey: "AIzaSyARiZYDRmAPutSoq8_oiMu1f77Dx3iSM",
    authDomain: "aeternumintelligence.firebaseapp.com",
    projectId: "aeternumintelligence",
    storageBucket: "aeternumintelligence.appspot.com",
    messagingSenderId: "581680312893",
    appId: "1:581680312893:web:a7b8dfe93be5798fed2b8a",
    measurementId: "G-NF5TESZ9B4"
};
const COLLECTIONS = ['perks', 'weapon_mastery', 'game_constants', 'status_effects', 'attribute_bonuses', 'builds', 'effects', 'abilities'];

// --- UKB Schemas for Deconstruction ---
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

// --- ACTION: Deconstructor System Prompt (Final Upgrade) ---
const DECONSTRUCTOR_SYSTEM_PROMPT = `You are a precision data deconstruction engine for the game New World. Your mission is to analyze an array of raw item data (name, description, etc.) and deconstruct each item into two structured JSON objects: an 'Ability' object and an array of one or more 'Effect' objects.

CRITICAL DIRECTIVES:
1.  **Strict Schema Adherence:** You MUST conform perfectly to the provided JSON schemas for 'abilities' and 'effects'. Do not invent new fields.
2.  **No Improvisation:** Do not summarize, interpret, or add any information not explicitly present in the source description. Your role is translation, not creation.
3.  **Preserve Original Description:** The 'description' field in both the 'ability_to_create' and 'effects_to_create' objects MUST contain the original, full description text from the input.
4.  **Extract Cooldowns:** If the description mentions a cooldown, you MUST extract the numeric value and place it in the 'internal_cooldown_seconds' field of the 'ability_to_create' object.
5.  **Pure JSON Output:** Your response MUST be a single, valid JSON array. Each element in the array will correspond to an input item and MUST contain two keys: 'ability_to_create' and 'effects_to_create'. Do not include any other text, markdown, or explanations.
6.  **Effect ID Generation:** Generate a descriptive, snake_case 'effect_id' for each effect (e.g., 'Bleed_10_Pct_Weapon_Damage_6s').
7.  **Ability ID Generation:** Generate an 'ability_id' using the format 'Perk_ItemName' (e.g., 'Perk_KeenlyJagged').

EXAMPLE INPUT:
[
  { "name": "Refreshing Move", "description": "Light and Heavy attacks reduce your active weapon cooldowns by 2.5% (0.2s cooldown).", "perk_bucket": "Weapon.Melee.RefreshingMove" }
]

EXAMPLE OUTPUT:
[
  {
    "ability_to_create": {
      "ability_id": "Perk_RefreshingMove",
      "name": "Refreshing Move",
      "type": "PERK",
      "trigger": "ON_HIT",
      "effects_to_apply": ["Reduce_Weapon_Cooldowns_2_5_Pct"],
      "internal_cooldown_seconds": 0.2,
      "description": "Light and Heavy attacks reduce your active weapon cooldowns by 2.5% (0.2s cooldown)."
    },
    "effects_to_create": [
      {
        "effect_id": "Reduce_Weapon_Cooldowns_2_5_Pct",
        "name": "Cooldown Reduction",
        "type": "HASTE",
        "application_trigger": "ON_HIT",
        "target": "SELF",
        "value_type": "PERCENTAGE",
        "value": 0.025,
        "description": "Light and Heavy attacks reduce your active weapon cooldowns by 2.5% (0.2s cooldown)."
      }
    ]
  }
]`;


// --- COMPONENT: SystemLog ---
function SystemLog({ logs = [] }) {
    return (
        <div className="mt-8 bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
            <h3 className="text-2xl font-semibold text-gray-300 mb-4">System Log</h3>
            <div className="bg-gray-900 h-48 rounded-md p-4 overflow-y-auto font-mono text-sm border border-gray-600">
                {logs.map((log, index) => (
                    <p key={index}>
                        <span className="text-gray-500">{log.timestamp}</span>
                        <span className={log.typeClass}>&nbsp;&nbsp;{log.message}</span>
                    </p>
                ))}
            </div>
        </div>
    );
}

// --- COMPONENT: TabNavigation ---
function TabNavigation({ activeTab, setActiveTab }) {
    const tabs = [
        { id: 'viewer', label: 'UKB Viewer' },
        { id: 'forge', label: 'The Forge' },
        { id: 'migration', label: 'Migration Staging' },
        { id: 'admin', label: 'System Administration' },
    ];

    const getTabClassName = (tabId) => {
        const isActive = activeTab === tabId;
        let classes = 'py-2 px-5 cursor-pointer border-b-2 font-medium transition-colors duration-200 ';
        if (isActive) {
            if (tabId === 'admin') classes += 'border-red-500 text-red-400';
            else if (tabId === 'migration') classes += 'border-amber-500 text-amber-400';
            else classes += 'border-emerald-400 text-emerald-400';
        } else {
            classes += 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500';
        }
        return classes;
    };

    return (
        <div className="mb-8 border-b border-gray-700 flex justify-center">
            {tabs.map((tab) => (
                <div
                    key={tab.id}
                    className={getTabClassName(tab.id)}
                    onClick={() => setActiveTab(tab.id)}
                >
                    {tab.label}
                </div>
            ))}
        </div>
    );
}

// --- COMPONENT: DataTable ---
function DataTable({ data }) {
    if (!data || data.length === 0) {
        return <p className="text-gray-500 p-4">No data to display for this collection.</p>;
    }
    const headers = Object.keys(data[0]).filter(key => !['description', 'long_description'].includes(key));
    return (
        <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700/50 sticky top-0">
                <tr>
                    {headers.map(header => (
                        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            {header.replace(/_/g, ' ')}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
                {data.map(item => (
                    <tr key={item.id} className="bg-gray-800 even:bg-gray-800/50 hover:bg-gray-700/50">
                        {headers.map(header => (
                            <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 truncate max-w-xs">
                                {String(item[header])}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

// --- COMPONENT: UKBViewerPanel ---
function UKBViewerPanel({ db, addLog }) {
    const [selectedCollection, setSelectedCollection] = useState('');
    const [collectionData, setCollectionData] = useState([]);

    useEffect(() => {
        if (!selectedCollection || !db) {
            setCollectionData([]);
            return;
        }
        addLog('info', `Subscribing to real-time updates for '${selectedCollection}'...`);
        const unsubscribe = onSnapshot(collection(db, selectedCollection), (querySnapshot) => {
            const data = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            setCollectionData(data);
            addLog('success', `Live Viewer updated. Displaying ${data.length} document(s) for '${selectedCollection}'.`);
        }, (error) => {
            addLog('error', `Error subscribing to '${selectedCollection}': ${error.message}`);
        });
        return () => unsubscribe();
    }, [selectedCollection, db, addLog]);

    return (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
            <h2 className="text-2xl font-semibold text-sky-300 mb-4">Live UKB Viewer</h2>
            <div className="mb-4">
                <label htmlFor="collectionSelectorViewer" className="block text-sm font-medium text-gray-400">Select Collection:</label>
                <select
                    id="collectionSelectorViewer"
                    className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                >
                    <option value="">-- Select a Collection --</option>
                    {COLLECTIONS.map(col => (
                        <option key={col} value={col}>{col}</option>
                    ))}
                </select>
            </div>
            <div id="dataViewer" className="flex-grow rounded-md overflow-auto border border-gray-600 min-h-[300px]">
                {collectionData.length > 0 ? (
                    <DataTable data={collectionData} />
                ) : (
                    <p className="text-gray-500 p-4">Please select a collection to view its data.</p>
                )}
            </div>
        </div>
    );
}

// --- COMPONENT: ForgePanel ---
function ForgePanel({ setStagedData, addLog, setActiveTab }) {
    const [selectedObjectType, setSelectedObjectType] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const callGeminiAPI = useCallback(async (userPrompt, systemPrompt, base64ImageData = null) => {
        const apiKey = sessionStorage.getItem('geminiApiKey');
        if (!apiKey) {
            throw new Error('Gemini API Key is not set. Please set it in the Admin Panel.');
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        
        const parts = [{ text: userPrompt }];
        if (base64ImageData) {
            parts.push({ inlineData: { mimeType: "image/png", data: base64ImageData } });
        }

        const payload = {
            contents: [{ parts }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { responseMimeType: "application/json" }
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates[0].content.parts[0].text) {
            const jsonText = result.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '');
            return JSON.parse(jsonText);
        } else {
            if (result.candidates && result.candidates[0].finishReason === 'SAFETY') {
                throw new Error("Content blocked by API safety filters.");
            }
            console.error("Unexpected API response:", result);
            throw new Error("No valid content returned from API.");
        }
    }, []);

    const processImage = useCallback(async (blob) => {
        if (!blob) return;
        if (!selectedObjectType) {
            addLog('error', 'Scribe Failure: Please select an object type first.');
            return;
        }
        setIsProcessing(true);
        addLog('special', 'Project Scribe activated. Analyzing image...');

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
            const base64ImageData = reader.result.split(',')[1];
            try {
                // --- STAGE 1: OCR ---
                const ocrPrompt = `For each item in the image, extract its 'name', 'description', and 'perk_bucket' if it is visible. The perk_bucket is usually small text below the description. Return a single JSON array containing all the extracted objects.`;
                const ocrSystemPrompt = `You are an expert data entry assistant for the game New World. Your task is to analyze an image of a tooltip or list of tooltips and extract the requested data into a structured JSON object.`;
                const rawItems = await callGeminiAPI(ocrPrompt, ocrSystemPrompt, base64ImageData);
                addLog('success', `Scribe OCR complete. Found ${rawItems.length} item(s). Now deconstructing...`);

                // --- STAGE 2: DECONSTRUCTION ---
                const deconstructorPrompt = JSON.stringify(rawItems);
                const deconstructedItems = await callGeminiAPI(deconstructorPrompt, DECONSTRUCTOR_SYSTEM_PROMPT);
                addLog('success', `Deconstruction complete. Staging ${deconstructedItems.length} item(s) for review.`);
                
                setStagedData(deconstructedItems);
                setActiveTab('migration');

            } catch (e) {
                addLog('error', `Data Refinery Error: ${e.message}`);
            } finally {
                setIsProcessing(false);
            }
        };
    }, [selectedObjectType, addLog, setStagedData, setActiveTab, callGeminiAPI]);

    const handlePaste = useCallback((e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                processImage(blob);
                break;
            }
        }
    }, [processImage]);
    
    useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [handlePaste]);


    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
                <h2 className="text-2xl font-semibold text-amber-300 mb-4">The Forge - Manual Entry</h2>
                <p className="text-gray-500">Manual entry form will be rebuilt here.</p>
            </div>
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700 space-y-4">
                <h2 className="text-2xl font-semibold text-sky-300 mb-2">Project Scribe - AI Ingestion</h2>
                <div>
                    <label htmlFor="collectionSelectorScribe" className="block text-sm font-medium text-gray-400 mb-2">1. Select Object Type to Ingest:</label>
                    <select
                        id="collectionSelectorScribe"
                        className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                        value={selectedObjectType}
                        onChange={(e) => setSelectedObjectType(e.target.value)}
                        disabled={isProcessing}
                    >
                        <option value="">-- Select Object Type --</option>
                        <option value="perks">perk</option>
                        <option value="weapon_mastery">weapon_mastery</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">2. Provide Image:</label>
                    <div className={`border-2 border-dashed p-8 text-center rounded-lg transition-colors duration-300 ${isProcessing ? 'cursor-wait bg-gray-700/50 border-amber-500' : 'cursor-pointer hover:bg-gray-700/50 hover:border-sky-400 border-gray-600'}`}>
                        <p className="text-gray-400">{isProcessing ? 'Processing... (this may take a moment)' : 'Click in this window and press Ctrl+V'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}


// --- COMPONENT: MigrationForm ---
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

// --- COMPONENT: MigrationPanel ---
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
            // Commit effects
            if (item.effects_to_create && Array.isArray(item.effects_to_create)) {
                item.effects_to_create.forEach(effect => {
                    if (effect.effect_id) {
                        const effectRef = doc(db, 'effects', effect.effect_id);
                        batch.set(effectRef, effect, { merge: true });
                        effectCount++;
                    }
                });
            }
            // Commit ability
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
        
        // Commit effects for the single item
        if (item.effects_to_create && Array.isArray(item.effects_to_create)) {
            item.effects_to_create.forEach(effect => {
                if (effect.effect_id) {
                    const effectRef = doc(db, 'effects', effect.effect_id);
                    batch.set(effectRef, effect, { merge: true });
                    effectCount++;
                }
            });
        }
        // Commit ability for the single item
        if (item.ability_to_create && item.ability_to_create.ability_id) {
            const abilityRef = doc(db, 'abilities', item.ability_to_create.ability_id);
            batch.set(abilityRef, item.ability_to_create, { merge: true });
            abilityCount++;
        }

        try {
            await batch.commit();
            addLog('success', `Surgical commit successful for '${item.ability_to_create.name}'.`);
            handleRemoveItem(index); // Remove the item from staging after successful commit
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
                    Reject and Clear
                </button>
            </div>
        </div>
    );
}


// --- COMPONENT: Ad,,inPanel ---
function AdminPanel({ addLog }) {
    const [apiKey, setApiKey] = useState('');
    const [status, setStatus] = useState({ text: 'API Key is not set.', color: 'text-gray-500' });
,
    useEffect(() => {
        const storedKey = sessionStorage.getItem('geminiApiKey');
        if (storedKey) {
            setApiKey(storedKey);
            setStatus({ text: 'API Key is loaded from session storage.', color: 'text-emerald-400' });
        }
    }, []);

    const handleSaveKey = () => {
        if (apiKey) {
            sessionStorage.setItem('geminiApiKey', apiKey);
            setStatus({ text: 'API Key saved for this session.', color: 'text-emerald-400' });
            addLog('success', 'Gemini API Key has been set for the session.');
        } else {
            sessionStorage.removeItem('geminiApiKey');
            setStatus({ text: 'API Key removed.', color: 'text-red-400' });
            addLog('info', 'Gemini API Key has been removed for the session.');
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-red-500/50 max-w-2xl mx-auto">
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-semibold text-yellow-300 mb-4">Gemini API Key</h2>
                    <p className="text-sm text-gray-400 mb-2">Enter your Gemini API key below. It will be stored securely in your browser for this session only.</p>
                    <div className="flex items-center space-x-2">
                        <input
                            type="password"
                            id="apiKeyInput"
                            className="block w-full bg-gray-900 border-gray-600 rounded-md p-2 font-mono text-sm text-amber-300 focus:ring-yellow-500 focus:border-yellow-500"
                            placeholder="Enter your Gemini API key..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        <button
                            onClick={handleSaveKey}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition"
                        >
                            Save Key
                        </button>
                    </div>
                    <p className={`text-xs mt-2 ${status.color}`}>{status.text}</p>
                </div>
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
                return <UKBViewerPanel db={db} addLog={addLog} />;
            case 'forge':
                return <ForgePanel setStagedData={setStagedData} addLog={addLog} setActiveTab={setActiveTab} />;
            case 'migration':
                return <MigrationPanel stagedData={stagedData} setStagedData={setStagedData} addLog={addLog} db={db} />;
            case 'admin':
                return <AdminPanel addLog={addLog} />;
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

