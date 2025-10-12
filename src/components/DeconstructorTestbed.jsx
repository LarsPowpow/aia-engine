import React, { useState, useEffect } from 'react';

const DeconstructorTestbed = ({ 
    prompts, 
    onScribe, // Expecting a function to handle Scribe logic
    onDeconstruct, // Expecting a function to handle Deconstructor logic
    addLog 
}) => {
    const [selectedScribePromptId, setSelectedScribePromptId] = useState('');
    const [selectedDeconstructorPromptId, setSelectedDeconstructorPromptId] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [rawJson, setRawJson] = useState('');
    const [fieldsToExtract, setFieldsToExtract] = useState('perk_id, name, description');
    const [cleanJson, setCleanJson] = useState('');
    const [finalJson, setFinalJson] = useState('');
    const [activeScribePrompt, setActiveScribePrompt] = useState('');
    const [activeDeconstructorPrompt, setActiveDeconstructorPrompt] = useState('');

    useEffect(() => {
        if (prompts && prompts.length > 0) {
            const initialPromptId = prompts[0].id;
            setSelectedScribePromptId(initialPromptId);
            setSelectedDeconstructorPromptId(initialPromptId);
            setActiveScribePrompt(prompts[0].content);
            setActiveDeconstructorPrompt(prompts[0].content);
        }
    }, [prompts]);

    const handleScribePromptSelect = (e) => {
        const promptId = e.target.value;
        setSelectedScribePromptId(promptId);
        const selected = prompts.find(p => p.id === promptId);
        setActiveScribePrompt(selected ? selected.content : '');
    };

    const handleDeconstructorPromptSelect = (e) => {
        const promptId = e.target.value;
        setSelectedDeconstructorPromptId(promptId);
        const selected = prompts.find(p => p.id === promptId);
        setActiveDeconstructorPrompt(selected ? selected.content : '');
    };
    
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            addLog(`Image "${file.name}" loaded for Scribe.`);
        }
    };

    const handleRunScribe = async () => {
        if (!imageFile || !activeScribePrompt) {
            addLog("Scribe Error: An image and a Scribe prompt are required.");
            return;
        }
        addLog("Initiating Project Scribe...");
        const result = await onScribe(activeScribePrompt, imageFile);
        setRawJson(result);
        addLog("Scribe finished. Raw JSON populated.");
    };

    // Placeholder for Carwash logic
    const handleClean = () => {
        addLog("Initiating Carwash...");
        try {
            // This is a simplified cleaner. A real one would be more complex.
            const dirty = JSON.parse(rawJson.replace(/```json\n?|\n?```/g, ''));
            const keys = fieldsToExtract.split(',').map(k => k.trim());
            const cleaned = dirty.map(item => {
                const newItem = {};
                keys.forEach(key => {
                    if (item.hasOwnProperty(key)) {
                        newItem[key] = item[key];
                    }
                });
                return newItem;
            });
            const cleanedString = JSON.stringify(cleaned, null, 2);
            setCleanJson(cleanedString);
            addLog("Carwash complete. Clean JSON is ready for the Deconstructor.");
        } catch (e) {
            addLog(`Carwash Error: Failed to parse or clean JSON. ${e.message}`);
        }
    };
    
    const handleRunDeconstructor = async () => {
        try {
            console.log('Deconstructor Button Clicked');
            console.log('cleanJson:', cleanJson);
            console.log('activeDeconstructorPrompt:', activeDeconstructorPrompt);
            if (!cleanJson || !activeDeconstructorPrompt) {
                addLog("Deconstructor Error: Clean JSON and a Deconstructor prompt are required.");
                return;
            }
            addLog("Initiating AI Deconstructor...");
            const result = await onDeconstruct(activeDeconstructorPrompt, cleanJson);
            setFinalJson(result);
            addLog("Deconstructor finished. Final JSON is ready for migration.");
        } catch (e) {
            addLog(`Deconstructor Error: ${e.message || e}`);
            console.error('Deconstructor Error:', e);
        }
    };


    return (
        <div className="space-y-8">
            {/* Project Scribe - AI OCR */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700">
                <h3 className="text-2xl font-semibold text-sky-300 mb-4">1. Project Scribe - AI OCR</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Select Scribe Prompt:</label>
                        <select value={selectedScribePromptId} onChange={handleScribePromptSelect} className="w-full bg-gray-900 text-white border border-gray-600 rounded-md p-2">
                            {prompts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Provide Image:</label>
                        <input type="file" onChange={handleImageUpload} accept="image/*" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"/>
                    </div>
                </div>
                 <button onClick={handleRunScribe} className="mt-4 w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-md">Run Scribe</button>
            </div>

            {/* Carwash - Data Cleaner */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700">
                <h3 className="text-2xl font-semibold text-yellow-300 mb-4">2. Carwash - Data Cleaner</h3>
                <textarea value={rawJson} onChange={(e) => setRawJson(e.target.value)} rows="8" className="w-full bg-gray-900 text-white font-mono text-sm border border-gray-600 rounded-md p-2" placeholder="Paste your large, messy JSON object here, or use Project Scribe to auto-populate."></textarea>
                <div className="my-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Fields to Extract (comma-separated):</label>
                    <input type="text" value={fieldsToExtract} onChange={(e) => setFieldsToExtract(e.target.value)} className="w-full bg-gray-900 text-white font-mono text-sm border border-gray-600 rounded-md p-2" />
                </div>
                <button onClick={handleClean} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md">Clean</button>
            </div>

            {/* AI Deconstructor Workshop */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700">
                <h3 className="text-2xl font-semibold text-emerald-300 mb-4">3. AI Deconstructor Workshop</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Select Deconstructor Prompt:</label>
                    <select value={selectedDeconstructorPromptId} onChange={handleDeconstructorPromptSelect} className="w-full bg-gray-900 text-white border border-gray-600 rounded-md p-2">
                        {prompts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <textarea value={cleanJson} onChange={(e) => setCleanJson(e.target.value)} rows="8" className="mt-4 w-full bg-gray-900 text-white font-mono text-sm border border-gray-600 rounded-md p-2" placeholder="Clean JSON from Carwash will appear here."></textarea>
                 <button onClick={handleRunDeconstructor} className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-md">Run Deconstructor</button>
                 <textarea value={finalJson} readOnly rows="8" className="mt-4 w-full bg-black text-lime-400 font-mono text-sm border border-gray-600 rounded-md p-2" placeholder="Final, enriched JSON will appear here."></textarea>
            </div>
        </div>
    );
};

export default DeconstructorTestbed;