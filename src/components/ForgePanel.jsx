import React, { useState } from 'react';

const ForgePanel = ({ addLog, setStagedData, setActiveTab }) => {
    const [deconstructorInput, setDeconstructorInput] = useState('');

    const handleDeconstruct = async () => {
        addLog('info', 'Initiating AI Deconstruction...');
        const rawJson = deconstructorInput.trim();

        if (!rawJson) {
            addLog('error', 'Deconstructor input is empty. Aborting.');
            return;
        }

        let items;
        try {
            items = JSON.parse(rawJson);
            if (!Array.isArray(items)) {
                throw new Error("Input must be a valid JSON array.");
            }
        } catch (e) {
            addLog('error', `Invalid JSON provided to Deconstructor: ${e.message}`);
            return;
        }
        
        addLog('special', `Deconstructing ${items.length} item(s)... This may take a moment.`);

        // This is a placeholder for the Gemini API call
        // In a real implementation, you would make the API call here.

        // Simulate a successful API response for workflow testing
        const mockApiResponse = items.map(item => ({
            original_perk: item,
            effects_to_create: [{
                effect_id: `${item.name.replace(/\s+/g, '')}_Effect`,
                name: `${item.name} Effect`,
                type: 'NEEDS_REVIEW',
                description: item.description
            }],
            ability_to_create: {
                ability_id: `Perk_${item.name.replace(/\s+/g, '')}`,
                name: item.name,
                type: 'PERK',
                description: item.description,
                effects_to_apply: [`${item.name.replace(/\s+/g, '')}_Effect`]
            }
        }));

        addLog('success', 'Deconstruction successful. Passing data to staging area.');
        setStagedData(mockApiResponse);
        setActiveTab('migration');
    };

    return (
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Manual Entry Panel */}
                <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
                    <h2 className="text-2xl font-semibold text-amber-300 mb-4">The Forge - Manual Entry (Legacy)</h2>
                    <p className="text-gray-500">Manual entry form will be rebuilt here.</p>
                </div>

                {/* AI Ingestion Panel */}
                <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700 space-y-4">
                    <h2 className="text-2xl font-semibold text-sky-300 mb-2">Project Scribe - AI Ingestion</h2>
                    <p className="text-gray-500">Image ingestion pending migration.</p>
                </div>
            </div>

            {/* Deconstructor Testbed */}
            <div className="mt-8 bg-gray-800 rounded-lg shadow-xl p-6 border border-cyan-500/50">
                <h2 className="text-2xl font-semibold text-cyan-300 mb-4">Deconstructor Testbed</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="deconstructorInput" className="block text-sm font-medium text-gray-400 mb-2">Raw Perk JSON Array:</label>
                        <textarea
                            id="deconstructorInput"
                            rows="6"
                            className="block w-full bg-gray-900 border-gray-600 rounded-md p-2 font-mono text-sm text-amber-300 focus:ring-cyan-500 focus:border-cyan-500"
                            placeholder="Paste the JSON array of perks here..."
                            value={deconstructorInput}
                            onChange={(e) => setDeconstructorInput(e.target.value)}
                        ></textarea>
                    </div>
                    <p className="text-sm text-gray-400">Run the AI Deconstructor on the provided JSON data. Results will appear in the Migration Staging area.</p>
                    <button
                        onClick={handleDeconstruct}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-5 rounded-lg text-lg transition"
                    >
                        Run AI Deconstructor
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgePanel;