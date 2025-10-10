import React, { useState } from 'react';

const JSONCleaner = ({ onCleanComplete }) => {
    const [rawJson, setRawJson] = useState('');
    const [dataPathPreset, setDataPathPreset] = useState('data');
    const [customDataPath, setCustomDataPath] = useState('');
    const [fieldsToExtract, setFieldsToExtract] = useState('id, name, description, PerkType, ExclusiveLabels, condition');
    const [cleanedJson, setCleanedJson] = useState('');
    const [error, setError] = useState('');

    const handleCleanData = () => {
        try {
            // 1. Clear old state
            setError('');
            setCleanedJson('');

            // 2. Parse Raw JSON
            if (!rawJson.trim()) {
                throw new Error("Raw JSON input cannot be empty.");
            }
            const parsedJson = JSON.parse(rawJson);

            let targetData;

            // 3. Determine and Access Data
            if (dataPathPreset === 'ROOT') {
                targetData = parsedJson;
            } else {
                const path = dataPathPreset === 'Custom...' ? customDataPath : dataPathPreset;
                if (!path) {
                    throw new Error("Data path must be specified.");
                }
                const getDataFromPath = (obj, pathStr) => {
                    return pathStr.split('.').reduce((acc, part) => acc && acc[part], obj);
                };
                targetData = getDataFromPath(parsedJson, path);
            }

            // 5. Validate Target Data
            if (targetData === undefined || targetData === null) {
                const pathForError = dataPathPreset === 'Custom...' ? customDataPath : dataPathPreset;
                throw new Error(`Data path "${pathForError}" not found in JSON object.`);
            }

            // 6. Normalize to Array
            if (!Array.isArray(targetData)) {
                targetData = [targetData];
            }

            // 7. Extract Fields
            const keysToExtract = fieldsToExtract.split(',').map(key => key.trim()).filter(Boolean);
            if (keysToExtract.length === 0) {
                throw new Error("Please specify at least one field to extract.");
            }

            // 8. Map and Pick
            const cleanedData = targetData.map(item => {
                const newItem = {};
                keysToExtract.forEach(key => {
                    if (item[key] !== undefined) {
                        newItem[key] = item[key];
                    }
                });
                return newItem;
            });
            
            // 9. Set Output
            setCleanedJson(JSON.stringify(cleanedData, null, 2));

        } catch (e) {
            // Handle any errors
            setError(e.message);
        }
    };

    const handleSendToDeconstructor = () => {
        if (onCleanComplete && cleanedJson) {
            onCleanComplete(cleanedJson);
        }
    };

    return (
        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 space-y-6">
            <h2 className="text-2xl font-semibold text-purple-300 mb-2">Operation: Carwash - JSON Cleaner</h2>
            
            {/* Section 1: Inputs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Raw JSON Input */}
                <div className="flex flex-col space-y-2">
                    <label htmlFor="rawJson" className="text-sm font-medium text-gray-300">1. Paste Raw JSON</label>
                    <textarea
                        id="rawJson"
                        value={rawJson}
                        onChange={(e) => setRawJson(e.target.value)}
                        className="w-full h-48 bg-gray-900 rounded-md p-3 font-mono text-sm border border-gray-600 text-amber-300 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Paste your large, messy JSON object here..."
                    />
                </div>

                {/* Controls */}
                <div className="space-y-4">
                    <div>
                        <label htmlFor="dataPathPreset" className="text-sm font-medium text-gray-300">2. Select Data Path</label>
                        <select
                            id="dataPathPreset"
                            value={dataPathPreset}
                            onChange={(e) => setDataPathPreset(e.target.value)}
                            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="ROOT">[Root Array]</option>
                            <option value="data">data</option>
                            <option value="results">results</option>
                            <option value="Custom...">Custom...</option>
                        </select>
                    </div>

                    {dataPathPreset === 'Custom...' && (
                        <div>
                            <label htmlFor="customDataPath" className="text-sm font-medium text-gray-300">Custom Data Path</label>
                            <input
                                type="text"
                                id="customDataPath"
                                value={customDataPath}
                                onChange={(e) => setCustomDataPath(e.target.value)}
                                className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                                placeholder="e.g., response.data.perks"
                            />
                        </div>
                    )}

                    <div>
                        <label htmlFor="fieldsToExtract" className="text-sm font-medium text-gray-300">3. Fields to Extract (comma-separated)</label>
                        <input
                            type="text"
                            id="fieldsToExtract"
                            value={fieldsToExtract}
                            onChange={(e) => setFieldsToExtract(e.target.value)}
                            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>
                </div>
            </div>

            {/* Section 2: Actions */}
            <div>
                <button
                    onClick={handleCleanData}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!rawJson}
                >
                    Clean Data
                </button>
            </div>

            {/* Section 3: Output */}
            <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                    <label htmlFor="cleanedJson" className="text-sm font-medium text-gray-300">Cleaned JSON Output</label>
                    <button
                        onClick={handleSendToDeconstructor}
                        disabled={!cleanedJson}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Send to Deconstructor
                    </button>
                </div>
                <textarea
                    id="cleanedJson"
                    readOnly
                    value={cleanedJson}
                    className="w-full h-48 bg-gray-900 rounded-md p-3 font-mono text-sm border border-gray-600 text-sky-300"
                    placeholder="Clean, Deconstructor-ready JSON will appear here..."
                />
                {error && (
                    <div className="p-3 bg-red-900/50 border border-red-500/50 text-red-300 text-sm rounded-md">
                        <strong>Error:</strong> {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default JSONCleaner;

