import React from 'react';
import { collection, getDocs } from 'firebase/firestore';
import PromptInjector from './PromptInjector.jsx';
import SchemaGovernorPanel from './SchemaGovernorPanel.jsx';
import DangerZone from './DangerZone.jsx';
import ManualUpsertPanel from './ManualUpsertPanel.jsx';
import DataDeconPanel from './DataDeconPanel.jsx';
import PurgePanel from './PurgePanel.jsx';
// IMPORT: We now import our new data hygiene tool.
import DataHygienePanel from './DataHygienePanel.jsx';

const AdminPanel = ({ 
    onClearUkb, 
    onClearArchive, 
    onBootstrapData, 
    onClearSystemLog, 
    covenant, 
    onGenerateCovenant,
    db,
    prompts,
    selectedPromptId,
    activePromptContent,
    onPromptSelect,
    onPromptContentChange,
    onSaveNewPrompt,
    onDeletePrompt,
    addLog,
    UKB_SCHEMAS,
    onSchemaChange,
    onUpsertData,
    promptName,
    onPromptNameChange,
}) => {

    const handleBackupUkb = async () => {
        addLog({ message: 'UKB backup procedure initiated...', type: 'info', timestamp: new Date() });
        try {
            const sourcesRef = collection(db, 'ukb_sources_v2');
            const effectsRef = collection(db, 'ukb_effects_v2');

            const sourcesSnapshot = await getDocs(sourcesRef);
            const effectsSnapshot = await getDocs(effectsRef);

            const sourcesData = sourcesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const effectsData = effectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const backupData = {
                sources: sourcesData,
                effects: effectsData,
            };

            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            a.download = `UKB_BACKUP_${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            addLog({ message: `UKB backup successful. ${sourcesData.length} sources and ${effectsData.length} effects exported.`, type: 'success', timestamp: new Date() });

        } catch (error) {
            console.error("UKB Backup failed:", error);
            addLog({ message: `UKB Backup failed: ${error.message}`, type: 'error', timestamp: new Date() });
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* --- LEFT COLUMN (2/3 width) --- */}
            <div className="lg:col-span-2 flex flex-col space-y-8">
                <DataDeconPanel db={db} addLog={addLog} />
                <SchemaGovernorPanel
                    db={db}
                    addLog={addLog}
                    UKB_SCHEMAS={UKB_SCHEMAS}
                    onSchemaChange={onSchemaChange}
                />
                <PromptInjector 
                    db={db}
                    prompts={prompts}
                    selectedPromptId={selectedPromptId}
                    activePromptContent={activePromptContent}
                    onPromptSelect={onPromptSelect}
                    onPromptContentChange={onPromptContentChange}
                    onSaveNewPrompt={onSaveNewPrompt}
                    onDeletePrompt={onDeletePrompt}
                    addLog={addLog}
                    promptName={promptName}
                    onPromptNameChange={onPromptNameChange}
                /> 
                <ManualUpsertPanel
                    db={db}
                    addLog={addLog}
                    collections={[ 'runeglass', 'perks', 'weapon_mastery', 'game_constants', 'status_effects', 'attribute_bonuses', 'builds', 'effects', 'abilities', 'raw_data_archive' ]}
                    onUpsertData={onUpsertData}
                />
            </div>

            {/* --- RIGHT COLUMN (1/3 width) --- */}
            <div className="flex flex-col space-y-8">
                
                {/* INTEGRATION: Our new tool is added to the top of the right column. */}
                <DataHygienePanel db={db} addLog={addLog} />
                
                <PurgePanel db={db} addLog={addLog} />

                {/* System Administration Card */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700">
                    <h3 className="text-2xl font-semibold text-gray-300 mb-4">System Commands</h3>
                    <p className="text-sm text-gray-400 mb-6">Execute high-level system commands. Use with extreme caution.</p>

                    <div className="flex flex-col space-y-4">
                        {/* --- NEW BACKUP BUTTON --- */}
                        <button
                            onClick={handleBackupUkb}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded transition-colors duration-200 shadow-md hover:shadow-lg text-lg"
                        >
                            Backup UKB
                        </button>
                        <button
                            onClick={onBootstrapData}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors duration-200 shadow-md hover:shadow-lg text-lg"
                        >
                            Bootstrap UKB
                        </button>
                        <button
                            onClick={onClearSystemLog}
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded transition-colors duration-200 shadow-md hover:shadow-lg text-lg"
                        >
                            Clear System Log
                        </button>
                        
                        <DangerZone 
                            onClearUkb={onClearUkb}
                            onClearArchive={onClearArchive}
                            addLog={addLog}
                        />
                    </div>
                </div>

                {/* Covenant Viewer Card */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700 flex flex-col">
                    <h3 className="text-2xl font-semibold text-gray-300 mb-4">Operation: Secure the Covenant</h3>
                    <p className="text-sm text-gray-400 mb-4">Generate and display the Co-Pilot's core operational document.</p>
                    <button
                        onClick={onGenerateCovenant}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 mb-4 shadow-md hover:shadow-lg"
                    >
                        Generate Latest Covenant
                    </button>
                    <div className="bg-gray-900 rounded-md p-4 overflow-y-auto font-mono text-sm border border-gray-600 flex-grow">
                        <pre className="whitespace-pre-wrap text-gray-300">{covenant}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;