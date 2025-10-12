import React, { useState, useEffect, useCallback } from 'react';

const JSONCleaner = ({ addLog, onDataCleaned, initialData }) => {
    const [rawJson, setRawJson] = useState('');
    const [fieldsToExtract, setFieldsToExtract] = useState('perk_id, name, description, type, category, perk_bucket, exclusive_to');
    const [cleanedJson, setCleanedJson] = useState('');

    // --- UPGRADED REPAIR PROTOCOL ---
    const attemptJsonRepair = (jsonString, originalError) => {
        let repaired = jsonString.trim();
        // Final brute-force: If we have an error position, chop there and close
        if (originalError && /position (\d+)/.test(originalError.message)) {
            const match = originalError.message.match(/position (\d+)/);
            if (match) {
                const pos = parseInt(match[1], 10);
                let brute = repaired.substring(0, pos);
                brute = brute.replace(/,\s*$/, '');
                if (repaired.startsWith('[')) {
                    brute += ']';
                } else if (repaired.startsWith('{')) {
                    brute += '}';
                }
                try {
                    JSON.parse(brute);
                    addLog('warning', 'Repair Protocol: Brute-force chop at error position and close.');
                    return brute;
                } catch (e) { /* Give up */ }
            }
        }

        // Stage 1: Fix missing closing brace or bracket
        if ((repaired.startsWith('{') && !repaired.endsWith('}')) || (repaired.startsWith('[') && !repaired.endsWith(']'))) {
            repaired += repaired.startsWith('{') ? '}' : ']';
            try {
                JSON.parse(repaired);
                addLog('info', 'Repair Protocol: Fixed missing closing brace/bracket.');
                return repaired;
            } catch (e) { /* Fall through */ }
        }

        // Stage 2: Remove trailing commas
        repaired = repaired.replace(/,\s*([}\]])/g, '$1');
        try {
            JSON.parse(repaired);
            addLog('info', 'Repair Protocol: Removed trailing commas.');
            return repaired;
        } catch (e) { /* Fall through */ }

        // Stage 3: Replace single quotes with double quotes
        if (repaired.includes("'")) {
            const singleToDouble = repaired.replace(/'/g, '"');
            try {
                JSON.parse(singleToDouble);
                addLog('info', 'Repair Protocol: Replaced single quotes with double quotes.');
                return singleToDouble;
            } catch (e) { /* Fall through */ }
        }

        // Stage 4: Remove illegal control characters
        const controlCharFree = repaired.replace(/[\x00-\x1F\x7F]/g, '');
        try {
            JSON.parse(controlCharFree);
            addLog('info', 'Repair Protocol: Removed illegal control characters.');
            return controlCharFree;
        } catch (e) { /* Fall through */ }

        // Stage 5: Truncate at last valid closing brace/bracket
        const lastBrace = repaired.lastIndexOf('}');
        const lastBracket = repaired.lastIndexOf(']');
        const lastValid = Math.max(lastBrace, lastBracket);
        if (lastValid !== -1) {
            const truncated = repaired.substring(0, lastValid + 1);
            try {
                JSON.parse(truncated);
                addLog('warning', 'Repair Protocol: Truncated at last valid closing brace/bracket.');
                return truncated;
            } catch (e) { /* Fall through */ }
        }

        // Stage 6: Unterminated string (original plumber's fix)
        if (originalError && originalError.message.includes('Unterminated string')) {
            // Try to find the last valid quote and comma, then close the array
            const lastValidQuote = repaired.lastIndexOf('"');
            const lastValidComma = repaired.lastIndexOf(',"');
            let cutPoint = Math.max(lastValidQuote, lastValidComma);
            if (cutPoint !== -1) {
                // Try closing with ] or } depending on start
                let closing = repaired.startsWith('[') ? ']' : '}';
                let truncated = repaired.substring(0, cutPoint + 1);
                // Remove trailing comma if present
                truncated = truncated.replace(/,\s*$/, '');
                truncated += closing;
                try {
                    JSON.parse(truncated);
                    addLog('warning', 'Repair Protocol: Deep truncation for unterminated string.');
                    return truncated;
                } catch (e) { /* Fall through */ }
            }
            // If still failing, try to find the last valid closing brace/bracket and truncate there
            const lastBrace = repaired.lastIndexOf('}');
            const lastBracket = repaired.lastIndexOf(']');
            const lastValid = Math.max(lastBrace, lastBracket);
            if (lastValid !== -1) {
                const truncated = repaired.substring(0, lastValid + 1);
                try {
                    JSON.parse(truncated);
                    addLog('warning', 'Repair Protocol: Fallback truncation at last valid closing brace/bracket for unterminated string.');
                    return truncated;
                } catch (e) { /* Fall through */ }
            }
            // If still failing, forcibly close array/object and remove trailing comma
            if (repaired.startsWith('[')) {
                let forced = repaired.replace(/,\s*$/, '') + ']';
                try {
                    JSON.parse(forced);
                    addLog('warning', 'Repair Protocol: Forced array closure for unterminated string.');
                    return forced;
                } catch (e) { /* Fall through */ }
            } else if (repaired.startsWith('{')) {
                let forced = repaired.replace(/,\s*$/, '') + '}';
                try {
                    JSON.parse(forced);
                    addLog('warning', 'Repair Protocol: Forced object closure for unterminated string.');
                    return forced;
                } catch (e) { /* Fall through */ }
            }
        }

        // Stage 7: Try JSON5 (if available)
        try {
            // Dynamically import json5 if available
            if (window.JSON5) {
                const json5Parsed = window.JSON5.parse(jsonString);
                addLog('info', 'Repair Protocol: Parsed with JSON5.');
                return JSON.stringify(json5Parsed);
            }
        } catch (e) { /* Fall through */ }

        // Stage 8: Attempt to quote unquoted property names (very aggressive, last resort)
        // Improved regex: catches property names at line starts, after whitespace, and after braces/commas
        const quotedProps = repaired.replace(/([\{,\s\n\r]+)([A-Za-z0-9_\-]+)\s*:/g, '$1"$2":');
        if (quotedProps !== repaired) {
            try {
                JSON.parse(quotedProps);
                addLog('warning', 'Repair Protocol: Aggressively quoted unquoted property names (regex last resort).');
                return quotedProps;
            } catch (e) { /* Fall through */ }
        }

        // Final Stage: Forcibly close array if input is truncated and cannot be repaired
        if (repaired.startsWith('[') && !repaired.trim().endsWith(']')) {
            let forced = repaired.replace(/,\s*$/, '') + ']';
            try {
                JSON.parse(forced);
                addLog('warning', 'Repair Protocol: Forcibly closed array at end of input (last resort).');
                return forced;
            } catch (e) { /* Give up */ }
        }
        // If all else fails, return null
        return null;
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

    const processData = useCallback((dataToClean) => {
        if (!dataToClean) return;

        let parsedData;
        try {
            parsedData = JSON.parse(dataToClean);
        } catch (error) {
            // Debug: Show region around error position if available
            const posMatch = error.message.match(/position (\d+)/);
            if (posMatch) {
                const pos = parseInt(posMatch[1], 10);
                const contextStart = Math.max(0, pos - 40);
                const contextEnd = Math.min(dataToClean.length, pos + 40);
                const contextSnippet = dataToClean.substring(contextStart, contextEnd);
                addLog('error', `Context around error position ${pos}: ...${contextSnippet}...`);
            }
            const repairedJson = attemptJsonRepair(dataToClean, error); // Pass the error to the repair function
            if (repairedJson) {
                try {
                    parsedData = JSON.parse(repairedJson);
                } catch (e) {
                    // Try JSON5 as last resort
                    if (window.JSON5) {
                        try {
                            parsedData = window.JSON5.parse(dataToClean);
                            addLog('info', 'Repair Protocol: Parsed with JSON5 as last resort.');
                        } catch (json5e) {
                            addLog('error', `JSON5 parsing failed: ${json5e.message}`);
                            return;
                        }
                    } else {
                        addLog('error', `JSON cleaning failed: ${error.message}`);
                        return;
                    }
                }
            } else {
                // Try JSON5 as last resort
                if (window.JSON5) {
                    try {
                        parsedData = window.JSON5.parse(dataToClean);
                        addLog('info', 'Repair Protocol: Parsed with JSON5 as last resort.');
                    } catch (json5e) {
                        addLog('error', `JSON5 parsing failed: ${json5e.message}`);
                        return;
                    }
                } else {
                    addLog('error', `JSON cleaning failed: ${error.message}`);
                    return;
                }
            }
        }

        try {
            let dataToProcess = null;
            if (Array.isArray(parsedData)) {
                // Top-level array, process directly
                addLog('info', 'Input is a top-level array. Processing directly.');
                dataToProcess = parsedData;
            } else {
                dataToProcess = findArrayOfObjects(parsedData);
                if (!dataToProcess) {
                    if (typeof parsedData === 'object' && parsedData !== null) {
                        addLog('info', 'No array found. Assuming input is a single object.');
                        dataToProcess = [parsedData];
                    } else {
                        throw new Error("Auto-Finder could not locate an array of objects to process.");
                    }
                } else {
                    addLog('info', 'Auto-Finder located target data array.');
                }
            }

            // If fieldsToExtract is blank, passthru the cleaned data unchanged
            if (!fieldsToExtract.trim()) {
                const passthruJsonString = JSON.stringify(dataToProcess, null, 2);
                setCleanedJson(passthruJsonString);
                onDataCleaned(passthruJsonString);
                addLog('success', `Passthru: ${dataToProcess.length} item(s) processed unchanged.`);
                return;
            }

            const fields = fieldsToExtract.split(',').map(f => f.trim()).filter(Boolean);
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
    }, [addLog, onDataCleaned, fieldsToExtract]);

    useEffect(() => {
        if (initialData && initialData !== rawJson) {
            setRawJson(initialData);
        }
    }, [initialData, rawJson]);

    useEffect(() => {
        if (rawJson.trim() !== '') {
            processData(rawJson);
        }
    }, [rawJson, processData]);

    const handleManualCleanClick = () => {
        if (!rawJson) {
            addLog('error', 'Raw JSON input is empty.');
            return;
        }
        processData(rawJson);
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
                onClick={handleManualCleanClick}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 shadow-md hover:shadow-lg"
            >
                Clean Data
            </button>
        </div>
    );
};

export default JSONCleaner;