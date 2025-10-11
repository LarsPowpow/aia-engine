// FILE: src/components/AdminPanel.jsx
import React from 'react';
import PromptInjector from './PromptInjector.jsx';
import SchemaGovernorPanel from './SchemaGovernorPanel.jsx';
import DangerZone from './DangerZone.jsx'; // Import the new component

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
    addLog,
    UKB_SCHEMAS,
    onSchemaChange
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* --- LEFT COLUMN (2/3 width) --- */}
            <div className="lg:col-span-2 flex flex-col space-y-8">
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
                    addLog={addLog}
                /> 
            </div>

            {/* --- RIGHT COLUMN (1/3 width) --- */}
            <div className="flex flex-col space-y-8">
                {/* System Administration Card */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700">
                    <h3 className="text-2xl font-semibold text-gray-300 mb-4">System Commands</h3>
                    <p className="text-sm text-gray-400 mb-6">Execute high-level system commands. Use with extreme caution.</p>

                    <div className="flex flex-col space-y-4">
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
                        
                        {/* Install the new Danger Zone component */}
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