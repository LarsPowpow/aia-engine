// FILE: src/components/DeconstructorTestbed.jsx
import React, { useState } from 'react';
import { useOverrides } from '../contexts/OverridesContext';

// --- SEALED ENGINE PROTOCOL: ACTIVE ---
const callGeminiApi = async (prompt, apiKey) => {
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey,
        },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    const result = await response.json();

    if (!response.ok) {
        const errorDetails = result.error ? result.error.message : `HTTP error! status: ${response.status}`;
        throw new Error(errorDetails);
    }
    
    const rawJsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJsonText) {
        throw new Error("No content received from AI.");
    }

    return rawJsonText;
};
// --- END OF SEALED COMPONENT ---

const DeconstructorTestbed = ({ 
    apiKey, 
    onApiKeyChange, 
    addLog, 
    cleanJson, 
    setStagedData, 
    setActiveTab, 
    activePromptContent,
    prompts,
    selectedPromptId,
    onPromptSelect,
    onPromptContentChange,
    onSaveNewPrompt,
    // --- NEW: Delete functionality ---
    onDeletePrompt
}) => {
    const [promptToSend, setPromptToSend] = useState('');
    const [rawApiResponse, setRawApiResponse] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const overrideRules = useOverrides();

    const buildPrompt = (promptTemplate, jsonData, chunkData, currentOverrideRules) => {
        if (!promptTemplate) return '';
        const safeChunkData = Array.isArray(chunkData) ? chunkData : [];
        const relevantOverrides = safeChunkData
            .map(perk => {
                const perkId = perk.id;
                if (currentOverrideRules && currentOverrideRules[perkId]) {
                    return { perkId, rules: currentOverrideRules[perkId] };
                }
                return null;
            })
            .filter(Boolean);

        let overrideBlock = '';
        if (relevantOverrides.length > 0) {
            overrideBlock += "IMPORTANT: THE CAPTAIN HAS ISSUED THE FOLLOWING OVERRIDE DIRECTIVES...\n\n";
            relevantOverrides.forEach(override => {
                overrideBlock += `--- FOR PERK_ID "${override.perkId}" ---\n`;
                Object.entries(override.rules).forEach(([field, value]) => {
                    overrideBlock += `- The field "${field}" MUST be set to exactly: "${value}"\n`;
                });
                overrideBlock += '\n';
            });
            overrideBlock += "--- END OF OVERRIDE DIRECTIVES. ---\n\n";
        }
        const promptWithOverrides = overrideBlock + promptTemplate;
        return promptWithOverrides.replace('{jsonData}', jsonData);
    };

    const attemptJsonCompletion = (text) => {
        let repairedText = text.trim();
        if (repairedText.startsWith('[') && !repairedText.endsWith(']')) {
            const lastBraceIndex = repairedText.lastIndexOf('}');
            if (lastBraceIndex !== -1) {
                repairedText = repairedText.substring(0, lastBraceIndex + 1) + '\n]\n';
                try {
                    JSON.parse(repairedText);
                    return repairedText;
                } catch (e) { return null; }
            }
        }
        return null;
    };

    const handleDeconstruct = async () => {
        if (isProcessing) return;
        if (!apiKey) { addLog('error', 'API Key is missing.'); return; }
        if (!cleanJson) { addLog('error', 'No clean JSON from Cleaner.'); return; }
        if (!activePromptContent) { addLog('error', 'No AI prompt is loaded.'); return; }

        setIsProcessing(true);
        setPromptToSend('');
        setRawApiResponse('');

        const allItems = JSON.parse(cleanJson);
        const chunkSize = 10;
        const chunks = [];
        for (let i = 0; i < allItems.length; i += chunkSize) {
            chunks.push(allItems.slice(i, i + chunkSize));
        }

        addLog('special', `Deconstructor engaged. Processing ${allItems.length} items in ${chunks.length} batches.`);
        
        const allDeconstructedData = [];

        try {
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const chunkJsonData = JSON.stringify(chunk, null, 2);
                const currentPrompt = buildPrompt(activePromptContent, chunkJsonData, chunk, overrideRules);

                addLog('info', `Processing batch ${i + 1} of ${chunks.length}...`);
                setPromptToSend(prev => prev + `--- BATCH ${i+1} ---\n` + currentPrompt + `\n\n`);
                
                const rawJsonText = await callGeminiApi(currentPrompt, apiKey);
                
                setRawApiResponse(prev => prev + `--- BATCH ${i+1} RESPONSE ---\n` + rawJsonText + `\n\n`);

                let deconstructedChunk;
                let cleanedJsonText = rawJsonText.replace(/```json/g, '').replace(/```/g, '').trim();

                try {
                    deconstructedChunk = JSON.parse(cleanedJsonText);
                } catch (parseError) {
                    addLog('warning', `Batch ${i + 1}: Initial parse failed. Engaging Auto-Completer...`);
                    const repairedJson = attemptJsonCompletion(cleanedJsonText);
                    if (repairedJson) {
                        addLog('success', `Batch ${i + 1}: Auto-Completer successful.`);
                        deconstructedChunk = JSON.parse(repairedJson);
                    } else {
                        throw new Error(`Auto-Completer failed. ${parseError.message}`);
                    }
                }
                
                allDeconstructedData.push(...deconstructedChunk);
                addLog('success', `Batch ${i + 1} complete. ${deconstructedChunk.length} items processed.`);
            }

            addLog('special', `All batches complete. Total items deconstructed: ${allDeconstructedData.length}.`);
            setStagedData(allDeconstructedData);
            addLog('success', `Data delivered to Migration Workshop.`);
            setActiveTab('migration');
            addLog('info', 'Auto-pilot to Migration Staging.');

        } catch (error) {
            console.error("Deconstruction Error: ", error);
            addLog('error', `Deconstruction failed: ${error.message}`);
            setRawApiResponse(prev => prev + `--- ERROR ---\n` + error.message + `\n\n`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700">
            <h3 className="text-2xl font-semibold text-gray-300 mb-4">AI Deconstructor Workshop</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4 flex flex-col">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-1"> Gemini API Key </label>
                            <input type="password" id="apiKey" value={apiKey} onChange={onApiKeyChange} className="w-full bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm" placeholder="Enter your Gemini API Key..." />
                        </div>
                        <div>
                            <label htmlFor="prompt-select" className="block text-sm font-medium text-gray-300 mb-1"> Select Prompt Version </label>
                            <select
                                id="prompt-select"
                                value={selectedPromptId}
                                onChange={(e) => onPromptSelect(e.target.value)}
                                className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                disabled={isProcessing}
                            >
                                <option value="">-- Select a Prompt --</option>
                                {(Array.isArray(prompts) ? prompts : []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col flex-grow">
                        <label htmlFor="cleanJsonInput" className="block text-sm font-medium text-gray-300 mb-1"> Clean JSON from Conveyor Belt </label>
                        <textarea id="cleanJsonInput" readOnly value={cleanJson} className="w-full h-full min-h-[150px] flex-grow bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none font-mono text-xs" placeholder="Data from the JSON Cleaner will appear here automatically..." />
                    </div>
                    <button onClick={handleDeconstruct} disabled={isProcessing} className={`w-full font-bold py-3 px-4 rounded transition-colors duration-200 shadow-md hover:shadow-lg text-lg ${isProcessing ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                        {isProcessing ? 'Processing Batches...' : 'Run AI Deconstructor'}
                    </button>
                </div>
                <div className="space-y-4 flex flex-col">
                     <div className="flex flex-col flex-grow">
                        <label htmlFor="promptContent" className="block text-sm font-medium text-gray-300 mb-1">Prompt Content</label>
                        <textarea
                            id="promptContent"
                            value={activePromptContent}
                            onChange={(e) => onPromptContentChange(e.target.value)}
                            className="w-full flex-grow bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                            placeholder="Select a prompt to view/edit its content..."
                            disabled={isProcessing}
                        />
                    </div>
                    <button 
                        onClick={onSaveNewPrompt} 
                        disabled={isProcessing}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                        Save as New Version
                    </button>
                    <button 
                        onClick={onDeletePrompt} 
                        disabled={isProcessing || !selectedPromptId}
                        className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 shadow-md hover:shadow-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        Delete Selected Prompt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeconstructorTestbed;