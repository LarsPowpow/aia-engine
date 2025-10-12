
import React, { useState } from 'react';
import JSONCleaner from './JSONCleaner.jsx';
import DeconstructorTestbed from './DeconstructorTestbed.jsx';
import ScribePanel from './ScribePanel.jsx';
import SystemLog from './SystemLog.jsx';

const ForgePanel = ({
    db,
    addLog,
    logs,
    isLogExpanded,
    setIsLogExpanded,
    apiKey,
    onApiKeyChange,
    setStagedData,
    setActiveTab,
    activePromptContent,
    prompts,
    selectedPromptId,
    onPromptSelect,
    onPromptContentChange,
    onSaveNewPrompt,
    onDeletePrompt,
    onDeconstruct,
    onScribe
}) => {
    const [rawJsonFromScribe, setRawJsonFromScribe] = useState('');
    const [cleanJsonForDeconstructor, setCleanJsonForDeconstructor] = useState('');
    const [selectedScribePromptId, setSelectedScribePromptId] = useState(() => {
        const saved = localStorage.getItem('selectedScribePromptId');
        return saved || (prompts && prompts.length > 0 ? prompts[0].id : '');
    });
    const [selectedDeconstructorPromptId, setSelectedDeconstructorPromptId] = useState(() => {
        const saved = localStorage.getItem('selectedDeconstructorPromptId');
        return saved || '';
    });

    // Update selectedScribePromptId if prompts change and no prompt is selected
    React.useEffect(() => {
        if ((!selectedScribePromptId || !prompts.find(p => p.id === selectedScribePromptId)) && prompts && prompts.length > 0) {
            setSelectedScribePromptId(prompts[0].id);
        }
    }, [prompts]);

    // Persist Scribe selection
    React.useEffect(() => {
        if (selectedScribePromptId) {
            localStorage.setItem('selectedScribePromptId', selectedScribePromptId);
        }
    }, [selectedScribePromptId]);

    // Persist Deconstructor selection
    React.useEffect(() => {
        if (selectedDeconstructorPromptId) {
            localStorage.setItem('selectedDeconstructorPromptId', selectedDeconstructorPromptId);
        }
    }, [selectedDeconstructorPromptId]);

    return (
        <div className="flex flex-col space-y-8">
            {/* --- STAGE 1: SCRIBE --- */}
            <ScribePanel
                onImageData={setRawJsonFromScribe}
                prompts={prompts}
                onPromptSelect={setSelectedScribePromptId}
                selectedPromptId={selectedScribePromptId}
                addLog={addLog}
                apiKey={apiKey}
                onScribe={onScribe}
            />

            {/* --- STAGE 2: CARWASH --- */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700">
                <h3 className="text-2xl font-semibold text-yellow-300 mb-4">2. Carwash - Data Cleaner</h3>
                <JSONCleaner
                    addLog={addLog}
                    onDataCleaned={setCleanJsonForDeconstructor}
                    initialData={rawJsonFromScribe}
                />
            </div>

            {/* --- STAGE 3: DECONSTRUCTOR --- */}
            <DeconstructorTestbed
                addLog={addLog}
                prompts={prompts}
                cleanJson={cleanJsonForDeconstructor}
                setStagedData={setStagedData}
                setActiveTab={setActiveTab}
                onDeconstruct={onDeconstruct}
                selectedPromptId={selectedDeconstructorPromptId}
                onPromptSelect={setSelectedDeconstructorPromptId}
            />

            {/* SystemLog removed from ForgePanel. Only global SystemLog remains. */}
        </div>
    );
};

export default ForgePanel;