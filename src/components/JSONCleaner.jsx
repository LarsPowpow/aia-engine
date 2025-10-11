import React, { useState } from 'react';

const JSONCleaner = ({ addLog, onDataCleaned }) => {
    const [rawJson, setRawJson] = useState('');
    const [dataPath, setDataPath] = useState('data');
    const [fieldsToExtract, setFieldsToExtract] = useState('id, name, description, PerkType, ExclusiveLabels, condition');
    const [cleanedJson, setCleanedJson] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleCleanData = () => {
        if (!rawJson) {
            addLog('error', 'Raw JSON input is empty.');
            return;
        }

        try {
            const parsedData = JSON.parse(rawJson);
            const dataArray = dataPath.split('.').reduce((o, i) => o[i], parsedData);

            if (!Array.isArray(dataArray)) {
                addLog('error', 'The specified data path does not lead to an array.');
                return;
            }

            const fields = fieldsToExtract.split(',').map(f => f.trim());
            const cleanedArray = dataArray.map(item => {
                const newItem = {};
                fields.forEach(field => {
                    if (item.hasOwnProperty(field)) {
                        newItem[field] = item[field];
                    }
                });
                return newItem;
            });

            const cleanedJsonString = JSON.stringify(cleanedArray, null, 2);
            setCleanedJson(cleanedJsonString);
            onDataCleaned(cleanedJsonString); // <-- Placing goods on the conveyor belt
            addLog('success', `JSON cleaned successfully. ${cleanedArray.length} items processed.`);

        } catch (error) {
            addLog('error', `JSON cleaning failed: ${error.message}`);
        }
    };

    const handleSendData = () => {
        // This button's functionality will be replaced by our conveyor belt.
        // For now, we'll just log a message.
        setIsSending(true);
        addLog('info', 'Data has been sent to the conveyor belt automatically.');
        setTimeout(() => setIsSending(false), 1500);
    };


    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">1. Paste Raw JSON</label>
                    <textarea
                        value={rawJson}
                        onChange={(e) => setRawJson(e.target.value)}
                        placeholder="Paste your large, messy JSON object here..."
                        className="w-full h-48 bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                    />
                </div>
                 <button
                    onClick={handleCleanData}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                    Clean Data
                </button>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">2. Select Data Path</label>
                    <select 
                        value={dataPath} 
                        onChange={(e) => setDataPath(e.target.value)}
                        className="w-full bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="data">data</option>
                        <option value="Perks">Perks</option>
                        <option value="">(root array)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">3. Fields to Extract (comma-separated)</label>
                    <input
                        type="text"
                        value={fieldsToExtract}
                        onChange={(e) => setFieldsToExtract(e.target.value)}
                        className="w-full bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                    />
                </div>
                 <div className="h-48 relative">
                    <textarea
                        value={cleanedJson}
                        readOnly
                        placeholder="Clean, Deconstructor-ready JSON will appear here..."
                        className="w-full h-full bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 font-mono text-xs"
                    />
                    <button 
                        onClick={handleSendData}
                        disabled={!cleanedJson || isSending}
                        className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm transition-all disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                       {isSending ? 'Sent!' : 'Send to Deconstructor'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JSONCleaner;