import { useState, useEffect, useCallback } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, writeBatch, doc } from "firebase/firestore";

// Component Imports
import ViewerPage from './components/ViewerPage';
import TabNavigation from './components/TabNavigation';
import SystemLog from './components/SystemLog';
import ForgePanel from './components/ForgePanel';
import AdminPanel from './components/AdminPanel';
// No longer importing MigrationPanel as it's defined internally

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

// --- COMPONENT: MigrationForm (Internal to App) ---
function MigrationForm({ schema, initialData, formId, onDataChange }) {
    const [formData, setFormData] = useState(initialData);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        const newFormData = { ...formData, [name]: newValue };
        setFormData(newFormData);
        onDataChange(newFormData);
    };

    // This is a simplified render logic; a real implementation would be more robust.
    return (
        <form id={formId} className="space-y-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(schema).map(([key, field]) => (
                    <div key={key} className={field.type === 'textarea' || field.type === 'multiselect' ? 'md:col-span-2 lg:col-span-3' : ''}>
                        <label className="block text-sm font-medium text-gray-300">{field.label || key}</label>
                        {/* Input rendering logic based on field.type would go here */}
                    </div>
                ))}
            </div>
        </form>
    );
}


// --- COMPONENT: MigrationPanel (Internal to App) ---
function MigrationPanel({ stagedData, setStagedData, addLog, db }) {

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
                    stagedData.map((item, index) => (
                        <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-4">
                            {/* Rendering logic for staged items */}
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
                    disabled={!stagedData || stagedData.length === 0}
                >
                    Approve & Commit All {stagedData && stagedData.length > 0 && `(${stagedData.length})`}
                </button>
                <button
                    onClick={handleClearAll}
                    className="w-full bg-amber-700/50 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                    disabled={!stagedData || stagedData.length === 0}
                >
                    Reject and Clear All {stagedData && stagedData.length > 0 && `(${stagedData.length})`}
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
                {/* <SystemLog logs={logs} /> */}
            </div>
        </div>
    );
}

export default App;

