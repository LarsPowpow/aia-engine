import React, { useState } from 'react';
import Scribe from './Scribe.jsx';
import JSONCleaner from './JSONCleaner.jsx';

// The DeconstructorTestbed is now a "dumb" component that receives props
const DeconstructorTestbed = ({ addLog, deconstructorInput, setDeconstructorInput, onRunDeconstructor, isDeconstructing }) => {
    return (
        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 space-y-4">
            <h2 className="text-2xl font-semibold text-cyan-300">Deconstructor Testbed</h2>
            <div>
                <label htmlFor="deconstructorInput" className="block text-sm font-medium text-gray-400 mb-2">Raw Perk JSON Array:</label>
                <textarea 
                    id="deconstructorInput" 
                    rows="5" 
                    className="block w-full bg-gray-900 border-gray-600 rounded-md p-2 font-mono text-sm text-amber-300" 
                    placeholder="Paste the JSON array of perks here..."
                    value={deconstructorInput}
                    onChange={(e) => setDeconstructorInput(e.target.value)}
                />
            </div>
            <p className="text-sm text-gray-400">Run the AI Deconstructor on the provided JSON data. Results will appear in the Migration Staging area.</p>
            <button 
                onClick={onRunDeconstructor}
                disabled={isDeconstructing || !deconstructorInput}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-5 rounded-lg text-lg transition disabled:opacity-50 disabled:cursor-wait"
            >
                {isDeconstructing ? 'Deconstructing...' : 'Run AI Deconstructor'}
            </button>
        </div>
    );
};


const ForgePanel = ({ setStagedData, addLog, setActiveTab }) => {
    const [deconstructorInput, setDeconstructorInput] = useState('');
    const [isDeconstructing, setIsDeconstructing] = useState(false);

    const handleCleanComplete = (cleanedData) => {
        setDeconstructorInput(cleanedData);
        addLog('success', 'Data successfully sent from Carwash to Deconstructor.');
    };

    // --- AI COMMAND PROTOCOL ---
    async function callDeconstructorAPI(itemsToDeconstruct) {
        addLog('info', `Deconstructing ${itemsToDeconstruct.length} item(s)... This may take a moment.`);
        const userApiKey = sessionStorage.getItem('geminiApiKey');
        if (!userApiKey) {
            addLog('error', 'Deconstructor Failure: API Key is not set in System Administration.');
            return null;
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${userApiKey}`;
        const systemInstructions = `You are a game data deconstruction engine. Your primary task is to analyze an item's description and create an array of one or more machine-readable Effect objects that represent its mechanics. You MUST follow the input/output format and logic of the examples in this blueprint.
        
        **--- BLUEPRINT RULESET ---**
        1.  **Output Format:** Your final output MUST be a single, valid JSON array of arrays (e.g., \`[[...], [...]]\`). Each inner array corresponds to one of the input items in the same order.
        2.  **Multiple Effects:** If one item's description contains multiple distinct effects, its corresponding inner array in the output should contain multiple Effect objects.
        3.  **Field Completion:** You MUST populate every relevant field for each Effect object based on the description.
        4.  **Specificity is Key:** For \`effect_id\`, create a unique, descriptive ID (e.g., PerkName_EffectType). For \`application_trigger\`, be specific (e.g., ON_CRITICAL_HIT, ON_HIT_WITH_WHIRLWIND).
        5.  **Numerical Extraction:** Extract numbers, percentages, and durations accurately.
        6.  **Fallback:** If a value for a dropdown field (like 'type' or 'target') cannot be determined with high confidence, use the string "NEEDS_REVIEW".
        7.  **Handle Formulas:** If a value includes a variable like \`perkMultiplier\`, the entire formula MUST be returned as a string in the 'value' field (e.g., \`"value": "5 * perkMultiplier"\`). Do not attempt to calculate it.
        8.  **Passive Triggers:** If a description provides a static bonus (e.g., "+10% damage") without a conditional action, the \`application_trigger\` MUST be 'PASSIVE'.

        **--- BLUEPRINT EXAMPLES ---**
        * **INPUT 1:** \`[{ "name": "Mending Vortex", "description": "Every 2 hits with Vortex will heal you for \${5 * perkMultiplier}% of the base weapon damage." }]\`
        * **OUTPUT 1:** \`[[{ "effect_id": "MendingVortex_Heal", "name": "Mending Vortex Heal", "type": "HEAL", "application_trigger": "ON_HIT_WITH_VORTEX", "target": "SELF", "value_type": "WEAPON_DAMAGE_PCT", "value": "5 * perkMultiplier", "description": "..." }]]\`
        * **INPUT 2:** \`[{ "name": "Keenly Jagged", "description": "On Critical Hit: cause a bleed that deals 10% weapon damage per second for 6s. (7s cooldown)" }]\`
        * **OUTPUT 2:** \`[[{ "effect_id": "KeenlyJagged_Bleed", "name": "Keenly Jagged Bleed", "type": "BLEED", "application_trigger": "ON_CRITICAL_HIT", "target": "TARGET", "value_type": "WEAPON_DAMAGE_PCT", "value": 10, "duration_seconds": 6, "description": "..." }]]\`
        
        --- END OF BLUEPRINT ---`;

        const userPrompt = `Deconstruct the following items according to your mission briefing:\n\n${JSON.stringify(itemsToDeconstruct, null, 2)}`;

        const payload = {
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: {
                parts: [{ text: systemInstructions }]
            },
            generationConfig: { responseMimeType: "application/json" }
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody}`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates[0].content.parts[0].text) {
                const jsonText = result.candidates[0].content.parts[0].text;
                const strippedText = jsonText.replace(/^```json\s*/, '').replace(/```$/, '');
                return JSON.parse(strippedText);
            } else {
                 if (result.candidates && result.candidates[0].finishReason === 'SAFETY') {
                    throw new Error("Content blocked by API safety filters.");
                }
                console.error("Unexpected API response structure:", result);
                throw new Error("No valid content returned from API.");
            }
        } catch (e) {
            addLog('error', `Deconstructor AI Error: ${e.message}`);
            return null;
        }
    }

    // --- FINAL PHASE: CONNECT PIPELINE ---
    const handleRunDeconstructor = async () => {
        setIsDeconstructing(true);
        addLog('special', 'Ignition sequence start. Running AI Deconstructor...');
        try {
            const items = JSON.parse(deconstructorInput);
            if (!Array.isArray(items)) {
                throw new Error("Deconstructor input must be a valid JSON array.");
            }

            const effectsByItem = await callDeconstructorAPI(items);

            if (effectsByItem && Array.isArray(effectsByItem) && effectsByItem.length === items.length) {
                addLog('success', `Deconstructor finished. AI returned ${effectsByItem.flat().length} total effect(s).`);
                
                const finalStagedData = items.map((item, index) => {
                    const effects = effectsByItem[index] || [];
                    const ability = {
                        ability_id: item.id || `Perk_${item.name.replace(/\s+/g, '')}`,
                        name: item.name,
                        type: 'PERK', // Defaulting to PERK for now
                        trigger: effects.length > 0 ? effects[0].application_trigger : 'PASSIVE',
                        effects_to_apply: effects.map(e => e.effect_id),
                        description: item.description
                    };
                    return {
                        original_perk: item,
                        effects_to_create: effects,
                        ability_to_create: ability
                    };
                });
                
                setStagedData(finalStagedData);
                setActiveTab('migration');

            } else {
                throw new Error("AI Deconstruction failed or returned mismatched data. Check logs for details.");
            }

        } catch (e) {
            addLog('error', `Deconstructor operation failed: ${e.message}`);
        } finally {
            setIsDeconstructing(false);
        }
    };

    return (
        <div className="space-y-8">
            <JSONCleaner onCleanComplete={handleCleanComplete} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Scribe setStagedData={setStagedData} addLog={addLog} setActiveTab={setActiveTab} />
                <DeconstructorTestbed 
                    addLog={addLog} 
                    deconstructorInput={deconstructorInput}
                    setDeconstructorInput={setDeconstructorInput} 
                    onRunDeconstructor={handleRunDeconstructor}
                    isDeconstructing={isDeconstructing}
                />
            </div>
        </div>
    );
};

export default ForgePanel;

