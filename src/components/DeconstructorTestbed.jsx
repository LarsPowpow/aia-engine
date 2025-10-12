import React, { useState, useEffect } from 'react';

const DeconstructorTestbed = ({
    prompts,
    onDeconstruct,
    addLog,
    cleanJson,
    setStagedData,
    setActiveTab,
    effectsManifest,
    selectedPromptId,
    onPromptSelect
}) => {
    const [activeDeconstructorPrompt, setActiveDeconstructorPrompt] = useState('');
    const [finalJson, setFinalJson] = useState('');
    const [isLoading, setIsLoading] = useState(false); // <-- NEW: Loading state

    useEffect(() => {
        // Always set activeDeconstructorPrompt when selectedPromptId changes
        if (prompts && prompts.length > 0) {
            let promptId = selectedPromptId;
            if (!promptId) {
                const saved = localStorage.getItem('selectedDeconstructorPromptId');
                promptId = saved || prompts.find(p => p.name.includes("Enrichment"))?.id || prompts[0].id;
                onPromptSelect(promptId);
            }
            const selected = prompts.find(p => p.id === promptId);
            setActiveDeconstructorPrompt(selected ? selected.content : '');
        }
    }, [prompts, selectedPromptId, onPromptSelect]);

    // Persist Deconstructor selection
    useEffect(() => {
        if (selectedPromptId) {
            localStorage.setItem('selectedDeconstructorPromptId', selectedPromptId);
        }
    }, [selectedPromptId]);

    const handleDeconstructorPromptSelect = (e) => {
        const promptId = e.target.value;
        onPromptSelect(promptId);
        const selected = prompts.find(p => p.id === promptId);
        setActiveDeconstructorPrompt(selected ? selected.content : '');
    };

    const handleRunDeconstructor = async () => {
        try {
            // Diagnostic logging for cleanJson and activeDeconstructorPrompt
            addLog('info', `Diagnostic: cleanJson is${cleanJson ? '' : ' NOT'} set. Value: ${cleanJson ? cleanJson.substring(0, 100) : '[empty]'}`);
            addLog('info', `Diagnostic: activeDeconstructorPrompt is${activeDeconstructorPrompt ? '' : ' NOT'} set. Value: ${activeDeconstructorPrompt ? activeDeconstructorPrompt.substring(0, 100) : '[empty]'}`);
            if (!cleanJson || !activeDeconstructorPrompt) {
                addLog('error', "Deconstructor Error: Clean JSON from the Carwash and a Deconstructor prompt are required.");
                return;
            }
            setIsLoading(true);
            addLog('info', "Initiating AI Deconstructor... (This may take a moment)");
            const result = await onDeconstruct(activeDeconstructorPrompt, cleanJson);
            // Log type and value for debugging
            addLog('info', `Deconstructor result type: ${typeof result}`);
            if (typeof result === 'string') {
                addLog('info', `Deconstructor result string length: ${result.length}`);
            } else {
                addLog('info', `Deconstructor result value: ${JSON.stringify(result)}`);
            }
            if (!result || (typeof result === 'string' && result.trim() === '')) {
                addLog('error', 'Deconstructor returned empty result.');
            }
            setFinalJson(result);
            addLog('success', "Deconstructor finished. Final JSON is ready for migration.");
        } catch (e) {
            addLog('error', `Deconstructor UI Error: ${e.message || e}`);
            console.error('Deconstructor UI Error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendDataToMigration = () => {
        // ... (rest of the function is unchanged)
        if (!finalJson) {
            addLog('error', 'No final JSON to send to Migration.');
            return;
        }
        try {
            console.log('Deconstructor finalJson:', finalJson);
            let parsedData = JSON.parse(finalJson);
            console.log('Deconstructor parsedData:', parsedData);
            console.log('Deconstructor effectsManifest:', effectsManifest);
            if (!Array.isArray(parsedData)) {
                parsedData = [parsedData];
            }
            // Map perk data to ability schema, enrich effects_to_apply with full effect objects
            const mappedData = parsedData.map(item => {
                // Extract cooldown from description string
                let cooldown = item.internal_cooldown_seconds || item.internal_cooldown || item.cooldown || item.cooldown_seconds || 0;
                if (!cooldown && item.description) {
                    const match = item.description.match(/\((\d+)s cooldown\)/i);
                    if (match) {
                        cooldown = parseInt(match[1], 10);
                    }
                }
                // Always use effect IDs (strings) for effects_to_apply
                let effectIds = item.linked_effects || item.effects_to_apply || [];
                if (!Array.isArray(effectIds)) effectIds = [];
                const effectsToApply = effectIds;
                return {
                    ability_id: item.perk_id || item.ability_id || '',
                    name: item.name || '',
                    type: item.type || item.category || 'PERK',
                    trigger: item.trigger || item.perk_bucket || '',
                    effects_to_apply: effectsToApply,
                    prerequisites: item.prerequisites || [],
                    internal_cooldown_seconds: cooldown,
                    description: item.description || '',
                    category: item.category || '',
                    perk_bucket: item.perk_bucket || '',
                    exclusive_to: item.exclusive_to || '',
                    build_archetype: item.build_archetype || '',
                    synergy_notes: item.synergy_notes || '',
                    // Preserve any extra fields from the original item
                    ...item
                };
            });
            console.log('Deconstructor mappedData:', mappedData);
            setStagedData(mappedData);
            setActiveTab('migration'); // Fix: use correct tab id
            addLog('success', 'Enriched data has been sent to the Migration Staging Area.');
        } catch (e) {
            addLog('error', `Migration Send Error: Final JSON is not valid. ${e.message}`);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700">
            <h3 className="text-2xl font-semibold text-emerald-300 mb-4">3. AI Deconstructor Workshop</h3>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select Deconstructor Prompt:</label>
                <select value={selectedPromptId} onChange={handleDeconstructorPromptSelect} className="w-full bg-gray-900 text-white border border-gray-600 rounded-md p-2" disabled={isLoading}>
                    {Array.isArray(prompts) && prompts.length > 0
                        ? prompts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                        : <option value="">No prompts available</option>
                    }
                </select>
            </div>
            <textarea value={cleanJson} readOnly rows="8" className="mt-4 w-full bg-gray-700 text-gray-400 font-mono text-sm border border-gray-600 rounded-md p-2" placeholder="Clean JSON from Carwash will appear here."></textarea>
            <button 
                onClick={handleRunDeconstructor} 
                className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-wait"
                disabled={isLoading}
            >
                {isLoading ? 'Deconstructing...' : 'Run Deconstructor'}
            </button>
            <textarea value={finalJson} readOnly rows="8" className="mt-4 w-full bg-black text-lime-400 font-mono text-sm border border-gray-600 rounded-md p-2" placeholder="Final, enriched JSON will appear here."></textarea>
             <button
                onClick={handleSendDataToMigration}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition disabled:opacity-50"
                disabled={!finalJson || isLoading}
            >
                Send to Migration Staging Area
            </button>
        </div>
    );
};

export default DeconstructorTestbed;