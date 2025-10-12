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

    return (
        <div className="flex flex-col space-y-8">
            {/* --- STAGE 1: SCRIBE --- */}
            <ScribePanel
                onImageData={setRawJsonFromScribe}
                prompts={prompts}
                onPromptSelect={onPromptSelect}
                selectedPromptId={selectedPromptId}
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
            />

            {/* SystemLog removed from ForgePanel. Only global SystemLog remains. */}
        </div>
    );
};

export default ForgePanel;