import React, { useState } from 'react';

const DeconstructorTestbed = ({ apiKey, onApiKeyChange, addLog, cleanJson, setStagedData, setActiveTab, activePromptContent }) => {
    const [promptToSend, setPromptToSend] = useState('');
    const [rawApiResponse, setRawApiResponse] = useState('');

    const buildPrompt = (promptTemplate, jsonData) => {
        // We will need to make sure the activePromptContent is not null before using replace
        if (!promptTemplate) {
            return '';
        }
        return promptTemplate.replace('{jsonData}', jsonData);
    };

    const handleDeconstruct = async () => {
        if (!apiKey) {
            addLog('error', 'API Key is missing. Cannot run the Deconstructor.');
            return;
        }
        if (!cleanJson) {
            addLog('error', 'No clean JSON data has been received from the Cleaner. Cannot run Deconstructor.');
            return;
        }
        if (!activePromptContent) {
            addLog('error', 'No AI prompt is loaded. Please select or create one in the Admin Panel.');
            return;
        }

        const currentPrompt = buildPrompt(activePromptContent, cleanJson);
        setPromptToSend(currentPrompt);
        setRawApiResponse('');

        addLog('info', `Deconstructor engaged. Contacting Gemini API with ${JSON.parse(cleanJson).length} items...`);

        // Using the EXACT verified endpoint AND model from the curl command
        const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

        try {
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
                console.error("API Error Response:", result);
                setRawApiResponse(JSON.stringify(result, null, 2));
                throw new Error(`API request failed with status ${response.status}: ${result.error.message}`);
            }

            if (!result.candidates || !result.candidates[0].content || !result.candidates[0].content.parts || !result.candidates[0].content.parts[0].text) {
                console.error("Unexpected API response structure:", result);
                setRawApiResponse(JSON.stringify(result, null, 2));
                throw new Error("Invalid or unexpected response structure from Gemini API.");
            }

            const rawJsonText = result.candidates[0].content.parts[0].text;
            setRawApiResponse(rawJsonText);

            const cleanedJsonText = rawJsonText.replace(/```json/g, '').replace(/```/g, '').trim();
            const deconstructedData = JSON.parse(cleanedJsonText);

            addLog('success', `Deconstruction complete. ${deconstructedData.length} items received from AI.`);
            setStagedData(deconstructedData);
            addLog('success', `Data has been delivered to the Migration Workshop for verification.`);
            setActiveTab('migration');
            addLog('info', 'Auto-pilot engaged. Navigating to Migration Staging.');

        } catch (error) {
            console.error("Deconstruction Error: ", error);
            addLog('error', `Deconstruction failed: ${error.message}`);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700">
            <h3 className="text-2xl font-semibold text-gray-300 mb-4">AI Deconstructor Workshop</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-1"> Gemini API Key (Set it and Forget it) </label>
                        <input type="password" id="apiKey" value={apiKey} onChange={onApiKeyChange} className="w-full bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm" placeholder="Enter your Gemini API Key once..." />
                    </div>
                    <div>
                        <label htmlFor="cleanJsonInput" className="block text-sm font-medium text-gray-300 mb-1"> Clean JSON from Conveyor Belt </label>
                         <textarea id="cleanJsonInput" readOnly value={cleanJson} className="w-full h-32 bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none font-mono text-xs" placeholder="Data from the JSON Cleaner will appear here automatically..." />
                    </div>
                    <button onClick={handleDeconstruct} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 shadow-md hover:shadow-lg"> Run AI Deconstructor </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="promptDisplay" className="block text-sm font-medium text-gray-300 mb-1"> Current Prompt (What we're sending) </label>
                        <textarea id="promptDisplay" readOnly value={promptToSend} className="w-full h-48 bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none font-mono text-xs" placeholder="The full prompt sent to the AI will appear here..." />
                    </div>
                     <div>
                        <label htmlFor="rawOutputDisplay" className="block text-sm font-medium text-gray-300 mb-1"> Raw AI Output (What we get back) </label>
                        <textarea id="rawOutputDisplay" readOnly value={rawApiResponse} className="w-full h-48 bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none font-mono text-xs" placeholder="The raw, unparsed response from the AI will appear here..." />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeconstructorTestbed;