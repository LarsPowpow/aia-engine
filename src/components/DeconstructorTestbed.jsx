import React from 'react';

const DeconstructorTestbed = ({ apiKey, onApiKeyChange, addLog, cleanJson, setStagedData, setActiveTab }) => {

    const buildPrompt = (jsonData) => {
        // This is a simplified version of our Genesis Prompt
        return `
            You are an expert system designed to analyze game data for "New World." Your task is to deconstruct the following JSON data, which represents a list of in-game perks. For each perk, you must generate a structured JSON output that proposes a new "ability" and any necessary corresponding "effects."

            RULES:
            1.  **effect_id:** Must be a unique, descriptive, lowercase, snake_case string.
            2.  **ability_id:** Must be the original perk 'id' with a "_ability" suffix.
            3.  **Output Format:** Your response MUST be a single, valid JSON array of objects. Each object in the array represents a single perk that was processed and should contain the keys "original_perk", "ability_to_create", and "effects_to_create".
            4.  Analyze the 'description' field of each perk to infer its mechanics.

            Here is the JSON data to process:
            ${jsonData}
        `;
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

        addLog('info', `Deconstructor engaged. Contacting Gemini API with ${JSON.parse(cleanJson).length} items...`);

        const prompt = buildPrompt(cleanJson);
        // Using the EXACT verified endpoint from the AI Studio documentation
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                }),
            });

            if (!response.ok) {
                const errorBody = await response.json();
                console.error("API Error Response:", errorBody);
                throw new Error(`API request failed with status ${response.status}: ${errorBody.error.message}`);
            }

            const result = await response.json();
            
            if (!result.candidates || !result.candidates[0] || !result.candidates[0].content || !result.candidates[0].content.parts || !result.candidates[0].content.parts[0]) {
                console.error("Unexpected API response structure:", result);
                throw new Error("Invalid or unexpected response structure from Gemini API.");
            }

            const rawJsonText = result.candidates[0].content.parts[0].text;
            
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
            <h3 className="text-2xl font-semibold text-gray-300 mb-4">AI Deconstructor</h3>
            <div className="space-y-4">
                <div>
                    <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-1">
                        Gemini API Key (Set it and Forget it)
                    </label>
                    <input
                        type="password"
                        id="apiKey"
                        value={apiKey}
                        onChange={onApiKeyChange}
                        className="w-full bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                        placeholder="Enter your Gemini API Key once..."
                    />
                </div>
                <div>
                    <label htmlFor="cleanJsonInput" className="block text-sm font-medium text-gray-300 mb-1">
                        Clean JSON from Conveyor Belt
                    </label>
                     <textarea
                        id="cleanJsonInput"
                        readOnly
                        value={cleanJson}
                        className="w-full h-32 bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none font-mono text-xs"
                        placeholder="Data from the JSON Cleaner will appear here automatically..."
                    />
                </div>
                <button
                    onClick={handleDeconstruct}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                    Run AI Deconstructor
                </button>
            </div>
        </div>
    );
};

export default DeconstructorTestbed;