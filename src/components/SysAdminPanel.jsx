import React from 'react';
import PromptInjector from './PromptInjector.jsx';
import ManualUpsertPanel from './ManualUpsertPanel.jsx';

const SysAdminPanel = ({
    db,
    prompts,
    selectedPromptId,
    activePromptContent,
    onPromptSelect,
    onPromptContentChange,
    onSaveNewPrompt,
    onDeletePrompt,
    addLog,
    promptName,
    onPromptNameChange,
    onUpsertData,
}) => {
  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">System Administration</h2>
      <div className="space-y-8">
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
            collections={[ 'ukb_sources_v2', 'ukb_effects_v2' ]}
            onUpsertData={onUpsertData}
        />
      </div>
    </div>
  );
};

export default SysAdminPanel;