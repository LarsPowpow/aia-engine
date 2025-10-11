import React, { useState } from 'react';

const DeconstructorTestbed = ({ apiKey, onApiKeyChange, addLog, cleanJson, setStagedData, setActiveTab, activePromptContent }) => {
    const [promptToSend, setPromptToSend] = useState('');
    const [rawApiResponse, setRawApiResponse] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const buildPrompt = (promptTemplate, jsonData) => {
        if (!promptTemplate) return '';
        return promptTemplate.replace('{jsonData}', jsonData);
    };

    const attemptJsonCompletion = (text) => {
        let repairedText = text.trim();
        if (repairedText.startsWith('[') && !repairedText.endsWith(']')) {
            const lastBraceIndex = repairedText.lastIndexOf('}');
            if (lastBraceIndex !== -1) {
                repairedText = repairedText.substring(0, lastBraceIndex + 1);
                repairedText += '\n]\n';
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

        addLog('special', `Deconstructor engaged. Processing ${allItems.length} items in ${chunks.length} batches of ${chunkSize}.`);
        
        const allDeconstructedData = [];
        const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

        try {
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const chunkJsonData = JSON.stringify(chunk, null, 2);
                const currentPrompt = buildPrompt(activePromptContent, chunkJsonData);
                
                addLog('info', `Processing batch ${i + 1} of ${chunks.length} (${chunk.length} items)...`);
                setPromptToSend(prev => prev + `--- BATCH ${i+1} ---\n` + currentPrompt + `\n\n`);

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-goog-api-key': apiKey,
                    },
                    body: JSON.stringify({ contents: [{ parts: [{ text: currentPrompt }] }] }),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(`Batch ${i + 1} failed: ${result.error.message}`);
                }
                
                let rawJsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!rawJsonText) {
                    throw new Error(`Batch ${i + 1} failed: No content received from AI.`);
                }

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
                        throw new Error(`Batch ${i + 1}: Auto-Completer failed. ${parseError.message}`);
                    }
                }
                
                allDeconstructedData.push(...deconstructedChunk);
                addLog('success', `Batch ${i + 1} complete. ${deconstructedChunk.length} items processed.`);
            }

            addLog('special', `All batches complete. Total items deconstructed: ${allDeconstructedData.length}.`);
            setStagedData(allDeconstructedData);
            addLog('success', `Data has been delivered to the Migration Workshop for verification.`);
            setActiveTab('migration');
            addLog('info', 'Auto-pilot engaged. Navigating to Migration Staging.');

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
                <div className="space-y-4">
                    <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-1"> Gemini API Key </label>
                        <input type="password" id="apiKey" value={apiKey} onChange={onApiKeyChange} className="w-full bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm" placeholder="Enter your Gemini API Key once..." />
                    </div>
                    <div>
                        <label htmlFor="cleanJsonInput" className="block text-sm font-medium text-gray-300 mb-1"> Clean JSON from Conveyor Belt </label>
                         <textarea id="cleanJsonInput" readOnly value={cleanJson} className="w-full h-32 bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none font-mono text-xs" placeholder="Data from the JSON Cleaner will appear here automatically..." />
                    </div>
                    <button onClick={handleDeconstruct} disabled={isProcessing} className={`w-full font-bold py-2 px-4 rounded transition-colors duration-200 shadow-md hover:shadow-lg ${isProcessing ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                        {isProcessing ? 'Processing Batches...' : 'Run AI Deconstructor'}
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="promptDisplay" className="block text-sm font-medium text-gray-300 mb-1"> Current Prompt Sent </label>
                        <textarea id="promptDisplay" readOnly value={promptToSend} className="w-full h-48 bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none font-mono text-xs" placeholder="The full prompt sent to the AI will appear here..." />
                    </div>
                     <div>
                        <label htmlFor="rawOutputDisplay" className="block text-sm font-medium text-gray-300 mb-1"> Raw AI Output Received </label>
                        <textarea id="rawOutputDisplay" readOnly value={rawApiResponse} className="w-full h-48 bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none font-mono text-xs" placeholder="The raw, unparsed response(s) from the AI will appear here..." />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeconstructorTestbed;