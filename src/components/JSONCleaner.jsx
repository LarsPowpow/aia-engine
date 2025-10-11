import React, { useState } from 'react';

const JSONCleaner = ({ addLog, onDataCleaned }) => {
    const [rawJson, setRawJson] = useState('');
    const [dataPath, setDataPath] = useState('data');
    const [fieldsToExtract, setFieldsToExtract] = useState('id, name, description, PerkType, ExclusiveLabels, condition');
    const [cleanedJson, setCleanedJson] = useState('');
    const [isSending, setIsSending] = useState(false);

    const attemptJsonRepair = (jsonString) => {
        let repaired = jsonString.trim();
        // Attempt to fix common issues like a missing closing brace/bracket
        if ((repaired.startsWith('{') && !repaired.endsWith('}')) || (repaired.startsWith('[') && !repaired.endsWith(']'))) {
            const openBraces = (repaired.match(/{/g) || []).length;
            const closeBraces = (repaired.match(/}/g) || []).length;
            if (openBraces > closeBraces) {
                repaired += '}'.repeat(openBraces - closeBraces);
            }
        }
        try {
            JSON.parse(repaired);
            return repaired;
        } catch (e) {
            return null; // Repair failed
        }
    };

    const handleCleanData = () => {
        if (!rawJson) {
            addLog('error', 'Raw JSON input is empty.');
            return;
        }

        let parsedData;
        try {
            parsedData = JSON.parse(rawJson);
        } catch (error) {
            const repairedJson = attemptJsonRepair(rawJson);
            if (repairedJson) {
                addLog('warning', 'Input JSON was malformed. Auto-repair successful.');
                parsedData = JSON.parse(repairedJson);
            } else {
                addLog('error', `JSON cleaning failed: ${error.message}`);
                return;
            }
        }

        try {
            // --- "SMART CLEANER" V2 PROTOCOL ---
            // Step 1: Always try to navigate to the dataPath first.
            const payload = dataPath ? dataPath.split('.').reduce((o, i) => o && o[i], parsedData) : parsedData;

            if (payload === undefined) {
                 throw new Error(`The specified data path "${dataPath}" does not exist in the provided JSON.`);
            }

            let dataToProcess;
            // Step 2: Now, check the shape of what we found.
            if (Array.isArray(payload)) {
                addLog('info', 'Payload is an array. Processing...');
                dataToProcess = payload;
            } else if (typeof payload === 'object' && payload !== null) {
                addLog('info', 'Payload is a single object. Wrapping it in an array for processing.');
                dataToProcess = [payload];
            } else {
                throw new Error("The data at the specified path is not a valid JSON object or array.");
            }
            // ------------------------------------

            if (!dataToProcess || dataToProcess.length === 0) {
                addLog('error', 'No processable data found.');
                return;
            }

            const fields = fieldsToExtract.split(',').map(f => f.trim());
            const cleanedArray = dataToProcess.map(item => {
                const newItem = {};
                fields.forEach(field => {
                    if (item && typeof item === 'object' && item.hasOwnProperty(field)) {
                        newItem[field] = item[field];
                    }
                });
                return newItem;
            });

            const cleanedJsonString = JSON.stringify(cleanedArray, null, 2);
            setCleanedJson(cleanedJsonString);
            onDataCleaned(cleanedJsonString);
            addLog('success', `JSON cleaned successfully. ${cleanedArray.length} item(s) processed.`);

        } catch (error) {
            addLog('error', `JSON cleaning failed: ${error.message}`);
        }
    };

    const handleSendData = () => {
        setIsSending(true);
        addLog('info', 'Data has been sent to the conveyor belt automatically.');
        setTimeout(() => setIsSending(false), 1500);
    };


    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div>
                    <label htmlFor="rawJson" className="block text-sm font-medium text-gray-300 mb-1">
                        1. Paste Raw JSON
                    </label>
                    <textarea
                        id="rawJson"
                        value={rawJson}
                        onChange={(e) => setRawJson(e.target.value)}
                        className="w-full h-48 bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                        placeholder="Paste your large, messy JSON object here..."
                    />
                </div>
                 <button
                    onClick={handleCleanData}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                    Clean Data
                </button>
            </div>
            <div className="space-y-4">
                <div>
                    <label htmlFor="dataPath" className="block text-sm font-medium text-gray-300 mb-1">
                        2. Select Data Path (if applicable)
                    </label>
                    <input
                        type="text"
                        id="dataPath"
                        value={dataPath}
                        onChange={(e) => setDataPath(e.target.value)}
                        className="w-full bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                        placeholder="e.g. data.items"
                    />
                </div>
                <div>
                    <label htmlFor="fieldsToExtract" className="block text-sm font-medium text-gray-300 mb-1">
                        3. Fields to Extract (comma-separated)
                    </label>
                    <input
                        type="text"
                        id="fieldsToExtract"
                        value={fieldsToExtract}
                        onChange={(e) => setFieldsToExtract(e.target.value)}
                        className="w-full bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                        placeholder="id, name, description, PerkType, ExclusiveLabels, condition"
                    />
                </div>
                 <div className="h-full flex flex-col">
                    <label htmlFor="cleanedJson" className="block text-sm font-medium text-gray-300 mb-1">
                        Cleaned JSON Output
                    </label>
                    <div className="relative flex-grow">
                        <textarea
                            id="cleanedJson"
                            readOnly
                            value={cleanedJson}
                            className="w-full h-full bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none font-mono text-xs"
                            placeholder="Clean, Deconstructor-ready JSON will appear here..."
                        />
                         <button 
                            onClick={handleSendData}
                            className={`absolute bottom-2 right-2 px-3 py-1 text-xs rounded transition-all duration-300 ${isSending ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        >
                           {isSending ? 'Sent!' : 'Send to Deconstructor'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JSONCleaner;