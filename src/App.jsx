import { runSimulation, loadUKBDocument } from './simulation/engine.js';
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
import MigrationPanel from "./components/MigrationPanel.jsx";
import { OverridesContext } from './contexts/OverridesContext.jsx';
import { SchemaContext } from './contexts/SchemaContext.jsx';


// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
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

// --- MAIN APP COMPONENT ---
function App() {
    // --- Prompt Name State ---
    const [promptName, setPromptName] = useState('');
    // --- Staged Data State ---
    const [stagedData, setStagedData] = useState([]);
    // --- Effects Manifest State ---
    const [effectsManifest, setEffectsManifest] = useState([]);
    // --- Log Expansion State ---
    const [isLogExpanded, setIsLogExpanded] = useState(false);
    // --- API Key State ---
    const [apiKey, setApiKey] = useState('');
    const [activeTab, setActiveTab] = useState('admin');
    const [logs, setLogs] = useState([]);
    const [db, setDb] = useState(null);
    const [overrideRules, setOverrideRules] = useState({});
    const [schemaExtensions, setSchemaExtensions] = useState({});
    // --- Modal State ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);
    // --- Covenant State ---
    const [covenant, setCovenant] = useState(null);
    // --- Prompts State ---
    const [prompts, setPrompts] = useState([]);
    // --- Selected Prompt State ---
    const [selectedPromptId, setSelectedPromptId] = useState('');
    // --- Active Prompt Content State ---
    const [activePromptContent, setActivePromptContent] = useState('');
    // --- Combat Simulator Test Button ---
    const handleRunSimulation = async () => {
        addLog('special', 'Running Combat Simulation v3.0 (Two-Actor)...');
        
        // Define two combatants with different stats
        const playerConfig = {
            id: 'player',
            name: 'Player',
            health: 1200,
            base_damage: 55,
            attack_speed: 1.1 // in seconds (e.g., a Sword)
        };

        const enemyConfig = {
            id: 'corrupted_swordsman',
            name: 'Corrupted Swordsman',
            health: 900,
            base_damage: 40,
            attack_speed: 1.3 // in seconds
        };
        
        addLog('info', `Simulating: ${playerConfig.name} vs ${enemyConfig.name}`);

        const combatLog = runSimulation(playerConfig, enemyConfig);

        console.log('--- COMBAT SIMULATION LOG (v3.0) ---');
        console.table(combatLog);
        console.log('--- END OF LOG ---');
        addLog('success', `Gladiator simulation complete. ${combatLog.length - 2} events logged to console.`);
    };
    // Removed stray addLog call

    // Modal open/close handlers
    const handleOpenOverrideModal = (data) => {
        setModalData(data);
        setIsModalOpen(true);
    };
    const handleModalClose = () => {
        setIsModalOpen(false);
        setModalData(null);
    };
    const handleModalSubmit = (result) => {
        // Handle modal submit logic here if needed
        setIsModalOpen(false);
        setModalData(null);
    };

    const addLog = useCallback((type, message) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prevLogs => [
            ...prevLogs,
            { type, message, timestamp }
        ]);
    }, []);
    
    // Removed stray addLog call
    const fetchPrompts = useCallback(async (firestore) => {
        if (!firestore) return;
        addLog('info', 'Refreshing prompt library...');
        try {
            const querySnapshot = await getDocs(collection(firestore, 'prompts'));
            const promptsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            promptsData.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
            setPrompts(promptsData);
            if (promptsData.length > 0) {
                const latestPrompt = promptsData[0];
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
        // ... (existing code unchanged)
    }, [addLog]);
    
    const fetchEffectsManifest = useCallback(async (firestore) => {
        if (!firestore) return;
        addLog('info', 'Harvesting Effects Manifest from UKB...');
        try {
            const querySnapshot = await getDocs(collection(firestore, 'effects'));
            const manifest = querySnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));
            setEffectsManifest(manifest);
            addLog('success', 'Deconstruction successful. AI analysis complete.');
            addLog('success', `Effects Manifest harvested. ${manifest.length} effects loaded.`);
        } catch (error) {
            addLog('error', `Failed to harvest Effects Manifest: ${error.message}`);
            addLog('error', `FATAL ERROR in Deconstructor: ${error.message}`);
        }
    }, [addLog]);


    useEffect(() => {
        const savedApiKey = localStorage.getItem('geminiApiKey');
        if (savedApiKey) { 
            setApiKey(savedApiKey); 
        } else {
            const envApiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (envApiKey) {
                setApiKey(envApiKey);
                addLog('info', 'Gemini API Key loaded from secure environment.');
            }
        }
    }, [addLog]);

    useEffect(() => {
        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        setDb(firestore);
        addLog('success', 'Firebase UKB connection established.');

        const fetchAllData = async () => {
            try {
                addLog('info', 'Fetching all operational data from UKB...');
                // setOverrideRules(rules); // Removed undefined 'rules' reference
                // if (Object.keys(rules).length > 0) addLog('success', `Loaded ${Object.keys(rules).length} override rule(s).`);
                await fetchPrompts(firestore);
                await fetchEffectsManifest(firestore);

                addLog('special', 'All operational data loaded.');
            } catch (error) {
                console.error("Error fetching all data:", error);
                addLog('error', `Failed to fetch operational data: ${error.message}`);
            }
        };
        fetchAllData();
    }, [addLog, fetchPrompts, fetchSchemaExtensions, fetchEffectsManifest]);
    
    const handleDeconstruct = async (prompt, jsonInput) => {
        addLog('info', `Deconstructor initiated. Injecting Effects Manifest...`);
        
        if (effectsManifest.length === 0) {
            addLog('error', 'Deconstructor Error: Effects Manifest is empty. Cannot proceed.');
            return JSON.stringify({ error: "Effects Manifest is empty." });
        }

        const manifestString = effectsManifest.map(e => `- ${e.name} (effect_id: ${e.id})`).join('\n');
        const finalPrompt = prompt.replace('{{EFFECTS_MANIFEST_PLACEHOLDER}}', manifestString);

        addLog('info', 'Manifest injected. Sending request to backend...');

        try {
            const response = await fetch('https://zany-barnacle-wrq99qjjvr4xcgg5v-3001.app.github.dev/deconstruct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: finalPrompt, jsonInput, apiKey })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (!data.result) {
                throw new Error('AI returned an empty response.');
            }
            addLog('success', 'Deconstruction successful. AI analysis complete.');
            return data.result;
        } catch (error) {
            console.error("DECONSTRUCTOR CRITICAL FAILURE:", error);
            addLog('error', `FATAL ERROR in Deconstructor: ${error.message}`);
            return JSON.stringify({
                "error": "Deconstructor call failed. See System Log for details.",
                "details": error.message
            }, null, 2);
        }
    };


    const handleApiKeyChange = (e) => {
        // ... (existing code unchanged)
    };

    const handleSchemaChange = useCallback(async () => {
        // ... (existing code unchanged)
    }, [db, fetchSchemaExtensions]);

    // Remove duplicate modal handler declarations
    // Use the modal handlers defined at the top of App()

    const handlePromptSelect = (promptId) => {
        setSelectedPromptId(promptId);
        const selected = prompts.find(p => p.id === promptId);
        setActivePromptContent(selected ? selected.content : '');
    };

    const handlePromptContentChange = (newContent) => {
        setActivePromptContent(newContent);
        // Optionally update the prompt in local state for immediate UI feedback
        setPrompts(prev => prev.map(p => p.id === selectedPromptId ? { ...p, content: newContent } : p));
    };

    const handleSaveNewPromptVersion = async () => {
        if (!db || !activePromptContent) {
            addLog('error', 'Cannot save: No database connection or prompt content.');
            return;
        }
        if (!promptName || promptName.trim() === '') {
            addLog('error', 'Please enter a name for your prompt before saving.');
            return;
        }
        try {
            const newPrompt = {
                name: promptName,
                content: activePromptContent,
                timestamp: new Date()
            };
            const docRef = await addDoc(collection(db, 'prompts'), newPrompt);
            addLog('success', `New prompt version saved as '${newPrompt.name}'.`);
            setPromptName('');
            await fetchPrompts(db);
            setSelectedPromptId(docRef.id);
        } catch (error) {
            addLog('error', `Failed to save new prompt: ${error.message}`);
        }
    };

    const handleDeletePrompt = async () => {
        if (!db || !selectedPromptId) {
            addLog('error', 'Cannot delete: No database connection or prompt selected.');
            return;
        }
        try {
            await deleteDoc(doc(db, 'prompts', selectedPromptId));
            addLog('success', `Prompt version deleted.`);
            await fetchPrompts(db);
            setSelectedPromptId(prompts.length > 1 ? prompts[0].id : '');
        } catch (error) {
            addLog('error', `Failed to delete prompt: ${error.message}`);
        }
    };

    const handleCreateOverride = async (perkId, fieldToOverride, correctValue) => {
        // ... (existing code unchanged)
    };
    
    const handleClearSystemLog = () => {
        // ... (existing code unchanged)
    };

    const deleteCollection = async (collectionName) => {
        // ... (existing code unchanged)
    };
    
    const handleClearUkb = () => {
        // ... (existing code unchanged)
    };
    
    const handleClearArchive = () => {
        // ... (existing code unchanged)
    };
    
    const handleBootstrapData = () => {
        // ... (existing code unchanged)
    };

    const handleUpsertData = async (collectionName, jsonData, onComplete) => {
        // ... (existing code unchanged)
    };
    
    const handleGenerateCovenant = async () => {
        // ... (existing code unchanged)
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'viewer': return <ViewerPage db={db} addLog={addLog} />;
            case 'forge':
                return <ForgePanel 
                            db={db} 
                            setStagedData={setStagedData} 
                            addLog={addLog} 
                            logs={logs}
                            isLogExpanded={isLogExpanded}
                            setIsLogExpanded={setIsLogExpanded}
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
                            promptName={promptName}
                            onPromptNameChange={setPromptName}
                            onDeconstruct={handleDeconstruct}
                        />;
            case 'migration':
                return <MigrationPanel 
                            stagedData={stagedData} 
                            setStagedData={setStagedData} 
                            addLog={addLog} 
                            db={db} 
                            effectsManifest={effectsManifest}
                            onOpenOverrideModal={handleOpenOverrideModal} 
                            UKB_SCHEMAS={UKB_SCHEMAS}
                        />;
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
                            onDeletePrompt={handleDeletePrompt}
                            promptName={promptName}
                            onPromptNameChange={setPromptName}
                            onUpsertData={handleUpsertData}
                            handleRunSimulation={handleRunSimulation}
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
                            <p className="text-center text-teal-600 text-sm">Cockpit v3.0</p>
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