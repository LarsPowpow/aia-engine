import React from 'react';

const PromptInjector = ({ 
    prompts, 
    selectedPromptId, 
    activePromptContent, 
    onPromptSelect, 
    onPromptContentChange, 
    onSaveNewPrompt 
}) => {

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700 col-span-1 lg:col-span-3">
            <h3 className="text-2xl font-semibold text-gray-300 mb-4">AI Prompt Engineering Workshop</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left Column: Controls */}
                <div className="md:col-span-1 space-y-4">
                    <div>
                        <label htmlFor="prompt-select" className="block text-sm font-medium text-gray-300 mb-1">
                            Select Prompt Version
                        </label>
                        <select
                            id="prompt-select"
                            value={selectedPromptId}
                            onChange={(e) => onPromptSelect(e.target.value)}
                            className="w-full bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            {prompts.map(prompt => (
                                <option key={prompt.id} value={prompt.id}>{prompt.name || prompt.id}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={onSaveNewPrompt}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                        Save as New Version
                    </button>
                     <div className="text-xs text-gray-500 pt-4">
                        <p>Here you can view, edit, and save new versions of the AI Deconstructor's core prompt. Changes saved here will be stored in the Firebase 'prompts' collection and will be used for all subsequent Deconstructor runs.</p>
                    </div>
                </div>

                {/* Right Column: Editor */}
                <div className="md:col-span-2">
                     <label htmlFor="prompt-editor" className="block text-sm font-medium text-gray-300 mb-1">
                        Prompt Content
                    </label>
                    <textarea
                        id="prompt-editor"
                        value={activePromptContent}
                        onChange={(e) => onPromptContentChange(e.target.value)}
                        className="w-full h-96 bg-gray-900 text-gray-300 p-4 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                        placeholder="The content of the selected prompt will be loaded here for editing..."
                    />
                </div>
            </div>
        </div>
    );
};

export default PromptInjector;