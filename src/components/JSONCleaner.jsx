// FILE: src/components/JSONCleaner.jsx
import React, { useState, useEffect } from 'react';

const JSONCleaner = ({ addLog, onDataCleaned, initialData }) => {
    const [rawJson, setRawJson] = useState('');
    const [fieldsToExtract, setFieldsToExtract] = useState('id, name, description, PerkType, ExclusiveLabels, condition');
    const [cleanedJson, setCleanedJson] = useState('');

    useEffect(() => {
        if (initialData) {
            setRawJson(initialData);
            if(initialData.trim() !== '') {
                handleCleanData(initialData);
            }
        } else {
            setRawJson('');
        }
    }, [initialData]);

    const attemptJsonRepair = (jsonString) => {
        let repaired = jsonString.trim();
        if ((repaired.startsWith('{') && !repaired.endsWith('}'))) {
            repaired += '}';
        }
        try {
            JSON.parse(repaired);
            return repaired;
        } catch (e) {
            return null; 
        }
    };

    const findArrayOfObjects = (obj) => {
        for (const key in obj) {
            if (Array.isArray(obj[key]) && obj[key].length > 0 && typeof obj[key][0] === 'object' && obj[key][0] !== null) {
                return obj[key];
            }
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                const result = findArrayOfObjects(obj[key]);
                if (result) return result;
            }
        }
        return null;
    };

    const handleCleanData = (dataToClean = rawJson) => {
        if (!dataToClean) {
            addLog('error', 'Raw JSON input is empty.');
            return;
        }

        let parsedData;
        try {
            parsedData = JSON.parse(dataToClean);
        } catch (error) {
            const repairedJson = attemptJsonRepair(dataToClean);
            if (repairedJson) {
                addLog('warning', 'Input JSON was malformed. Auto-repair successful.');
                parsedData = JSON.parse(repairedJson);
            } else {
                addLog('error', `JSON cleaning failed: ${error.message}`);
                return;
            }
        }

        try {
            let dataToProcess = findArrayOfObjects(parsedData);

            if (!dataToProcess) {
                if(typeof parsedData === 'object' && !Array.isArray(parsedData) && parsedData !== null){
                    addLog('info', 'No array found. Assuming input is a single object.');
                    dataToProcess = [parsedData];
                } else {
                    throw new Error("Auto-Finder could not locate an array of objects to process.");
                }
            } else {
                 addLog('info', 'Auto-Finder located target data array.');
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

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                <div className="flex flex-col">
                    <textarea
                        id="rawJson"
                        value={rawJson}
                        onChange={(e) => setRawJson(e.target.value)}
                        className="w-full flex-grow bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                        placeholder="Paste your large, messy JSON object here, or use Project Scribe to auto-populate."
                    />
                </div>
                <div className="flex flex-col">
                    <textarea
                        id="cleanedJson"
                        readOnly
                        value={cleanedJson}
                        className="w-full flex-grow bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none font-mono text-xs"
                        placeholder="Clean, Deconstructor-ready JSON will appear here..."
                    />
                </div>
            </div>
            <div>
                <label htmlFor="fieldsToExtract" className="block text-sm font-medium text-gray-300 mb-1">
                    Fields to Extract (comma-separated)
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
            <button
                onClick={() => handleCleanData()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 shadow-md hover:shadow-lg"
            >
                Clean Data
            </button>
        </div>
    );
};

export default JSONCleaner;