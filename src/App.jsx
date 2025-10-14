import { useState, useEffect, useCallback } from 'react';
import { db } from './services/firebase';
import { collection, getDocs, addDoc, doc, deleteDoc } from 'firebase/firestore';

// Component Imports
import ViewerPage from './components/ViewerPage.jsx';
import TabNavigation from './components/TabNavigation.jsx';
import SystemLog from './components/SystemLog.jsx';
import ForgePanel from './components/ForgePanel.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import OverrideModal from './components/OverrideModal.jsx';
import MigrationPanel from "./components/MigrationPanel.jsx";
import CombatSimulatorPage from './components/CombatSimulatorPage.jsx';
import { OverridesContext } from './contexts/OverridesContext.jsx';
import { SchemaContext } from './contexts/SchemaContext.jsx';


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
    const [promptName, setPromptName] = useState('');
    const [stagedData, setStagedData] = useState([]);
    const [effectsManifest, setEffectsManifest] = useState([]);
    const [isLogExpanded, setIsLogExpanded] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [activeTab, setActiveTab] = useState('combat_simulator');
    const [logs, setLogs] = useState([]);
    const [overrideRules, setOverrideRules] = useState({});
    const [schemaExtensions, setSchemaExtensions] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [covenant, setCovenant] = useState(null);
    const [prompts, setPrompts] = useState([]);
    const [selectedPromptId, setSelectedPromptId] = useState('');
    const [activePromptContent, setActivePromptContent] = useState('');

    const addLog = useCallback((logEntry) => {
        const timestamp = new Date().toLocaleTimeString();
        // Ensure logEntry is an object with type and message
        if (typeof logEntry === 'object' && logEntry.message) {
             setLogs(prevLogs => [
                ...prevLogs,
                { ...logEntry, timestamp }
            ]);
        } else if (typeof logEntry === 'string') { // Legacy support for simple string messages
             setLogs(prevLogs => [
                ...prevLogs,
                { type: 'info', message: logEntry, timestamp }
            ]);
        }
    }, []);
    
    const fetchPrompts = useCallback(async () => {
        addLog({ type: 'info', message: 'Refreshing prompt library...' });
        try {
            const querySnapshot = await getDocs(collection(db, 'prompts'));
            const promptsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            promptsData.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
            setPrompts(promptsData);
            if (promptsData.length > 0) {
                const latestPrompt = promptsData[0];
                setSelectedPromptId(latestPrompt.id); // Auto-select the latest
                setActivePromptContent(latestPrompt.content);
                addLog({ type: 'success', message: `Prompt library refreshed. Auto-selected "${latestPrompt.name}".` });
            } else {
                addLog({ type: 'warning', message: 'Prompt library is empty.' });
                setSelectedPromptId('');
                setActivePromptContent('');
            }
        } catch (error) {
            addLog({ type: 'error', message: `Failed to refresh prompts: ${error.message}` });
        }
    }, [addLog]);
    
    const fetchEffectsManifest = useCallback(async () => {
        addLog({ type: 'info', message: 'Harvesting Effects Manifest from UKB...' });
        try {
            const querySnapshot = await getDocs(collection(db, 'ukb_effects_v2')); // <-- Corrected collection name
            const manifest = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEffectsManifest(manifest);
            addLog({ type: 'success', message: `Effects Manifest harvested. ${manifest.length} effects loaded.` });
        } catch (error) {
            addLog({ type: 'error', message: `Failed to harvest Effects Manifest: ${error.message}` });
        }
    }, [addLog]);

    // --- CORRECTED useEffect to prevent infinite loop ---
    useEffect(() => {
        const fetchAllData = async () => {
            addLog({ type: 'info', message: 'Fetching all operational data from UKB...' });
            await fetchPrompts();
            await fetchEffectsManifest();
            addLog({ type: 'special', message: 'All operational data loaded.' });
        };
        fetchAllData();
    }, [addLog]); // Only re-run if addLog function itself changes (which it won't)


    useEffect(() => {
        const savedApiKey = localStorage.getItem('geminiApiKey');
        if (savedApiKey) { 
            setApiKey(savedApiKey); 
        } else {
            const envApiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (envApiKey) {
                setApiKey(envApiKey);
                addLog({ type: 'info', message: 'Gemini API Key loaded from secure environment.' });
            }
        }
    }, [addLog]);

    const handleDeconstruct = async (prompt, jsonInput) => {
        addLog({ type: 'info', message: 'Deconstructor initiated...' });
        const finalPrompt = prompt.replace('{{EFFECTS_MANIFEST_PLACEHOLDER}}', JSON.stringify(effectsManifest, null, 2));
        addLog({ type: 'info', message: 'Sending request to backend...' });
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
            if (!data.result) throw new Error('AI returned an empty response.');
            addLog({ type: 'success', message: 'Deconstruction successful. AI analysis complete.' });
            return data.result;
        } catch (error) {
            addLog({ type: 'error', message: `FATAL ERROR in Deconstructor: ${error.message}` });
            return JSON.stringify({ error: "Deconstructor call failed.", details: error.message }, null, 2);
        }
    };
    
    const handleSaveNewPromptVersion = async () => {
        if (!db || !activePromptContent) return addLog({ type: 'error', message: 'Cannot save: No DB connection or prompt content.'});
        if (!promptName.trim()) return addLog({ type: 'error', message: 'Please enter a name for the prompt.'});
        try {
            const newPrompt = { name: promptName, content: activePromptContent, timestamp: new Date() };
            const docRef = await addDoc(collection(db, 'prompts'), newPrompt);
            addLog({ type: 'success', message: `New prompt version saved as '${newPrompt.name}'.`});
            setPromptName('');
            await fetchPrompts();
            setSelectedPromptId(docRef.id);
        } catch (error) {
            addLog({ type: 'error', message: `Failed to save new prompt: ${error.message}`});
        }
    };
    
    const handleDeletePrompt = async () => {
        if (!db || !selectedPromptId) return addLog({ type: 'error', message: 'Cannot delete: No DB or prompt selected.'});
        try {
            await deleteDoc(doc(db, 'prompts', selectedPromptId));
            addLog({ type: 'success', message: `Prompt version deleted.`});
            await fetchPrompts();
        } catch (error) {
            addLog({ type: 'error', message: `Failed to delete prompt: ${error.message}`});
        }
    };
    
    const renderContent = () => {
        switch (activeTab) {
            case 'viewer': return <ViewerPage db={db} addLog={addLog} />;
            case 'forge': return <ForgePanel onDeconstruct={handleDeconstruct} addLog={addLog} />;
            case 'migration': return <MigrationPanel addLog={addLog} db={db} />;
            case 'combat_simulator': return <CombatSimulatorPage addLog={addLog} />;
            case 'admin': return (
                <AdminPanel 
                    db={db} 
                    addLog={addLog} 
                    prompts={prompts} 
                    selectedPromptId={selectedPromptId} 
                    activePromptContent={activePromptContent} 
                    onPromptSelect={setSelectedPromptId} 
                    onPromptContentChange={setActivePromptContent} 
                    onSaveNewPrompt={handleSaveNewPromptVersion} 
                    onDeletePrompt={handleDeletePrompt} 
                    promptName={promptName} 
                    onPromptNameChange={setPromptName} 
                />
            );
            default: return null;
        }
    };

    return (
        <div className="bg-gray-900 text-gray-200 h-screen font-sans flex flex-row">
            <div className="flex-grow flex flex-col h-screen overflow-y-hidden">
                <header className="bg-gray-800 border-b border-gray-700 p-4 shadow-lg flex-shrink-0">
                    <div className="w-full max-w-screen-2xl mx-auto">
                        <h1 className="text-3xl font-bold text-center text-teal-400 tracking-wider">Aeternum Intelligence Agency</h1>
                        <p className="text-center text-teal-600 text-sm">Cockpit v3.0</p>
                    </div>
                </header>
                <div className="w-full max-w-screen-2xl mx-auto flex-grow overflow-hidden flex flex-col">
                    <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
                    <main className="flex-grow p-4 md:p-8 overflow-y-auto">
                        {renderContent()}
                    </main>
                </div>
            </div>
            <SystemLog logs={logs} isSysLogOpen={isLogExpanded} setIsSysLogOpen={setIsLogExpanded} />
        </div>
    );
}

export default App;