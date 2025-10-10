import React, { useState } from 'react';

// --- DECONSTRUCTOR BLUEPRINT ---
const DECONSTRUCTOR_BLUEPRINT = `You are a game data deconstruction engine. Your primary task is to analyze an item's description and create an array of one or more machine-readable Effect objects that represent its mechanics.

You MUST follow the input/output format and logic of the examples below. This is your blueprint.

**--- BLUEPRINT RULESET ---**
1.  **Output Format:** Your final output MUST be a single, valid JSON array of arrays (e.g., \`[[...], [...]]\`). Each inner array corresponds to one of the input items in the same order.
2.  **Multiple Effects:** If one item's description contains multiple distinct effects, its corresponding inner array in the output should contain multiple Effect objects.
3.  **Field Completion:** You MUST populate every relevant field for each Effect object based on the description. Use the provided ENUM values for 'type', 'application_trigger', 'target', and 'value_type'.
4.  **Specificity is Key:** For \`effect_id\`, create a unique, descriptive ID (e.g., PerkName_EffectType). For \`application_trigger\`, be specific (e.g., ON_CRITICAL_HIT, ON_HIT_WITH_WHIRLWIND).
5.  **Numerical Extraction:** Extract numbers, percentages, and durations accurately.
6.  **Fallback:** If a value for a dropdown field (like 'type' or 'target') cannot be determined with high confidence, use the string "NEEDS_REVIEW".
7.  **Handle Formulas:** If a value includes a variable like \`perkMultiplier\`, the entire formula MUST be returned as a string in the 'value' field (e.g., \`"value": "5 * perkMultiplier"\`). Do not attempt to calculate it.
8.  **Passive Triggers:** If a description provides a static bonus (e.g., "+10% damage", "Generate 15% more threat") without a conditional action (like 'on hit', 'on crit'), the \`application_trigger\` MUST be 'PASSIVE'.


**--- BLUEPRINT EXAMPLES ---**

**EXAMPLE 1: Heal with Multiplier**
* **INPUT:** \`[{ "name": "Mending Vortex", "description": "Every 2 hits with Vortex will heal you for \${5 * perkMultiplier}% of the base weapon damage." }]\`
* **CORRECT OUTPUT:** \`[[{ "effect_id": "MendingVortex_Heal", "name": "Mending Vortex Heal", "type": "HEAL", "application_trigger": "ON_HIT_WITH_VORTEX", "target": "SELF", "value_type": "WEAPON_DAMAGE_PCT", "value": "5 * perkMultiplier", "description": "Every 2 hits with Vortex will heal you for \${5 * perkMultiplier}% of the base weapon damage." }]]\`

**EXAMPLE 2: Stacking Buff on Hit**
* **INPUT:** \`[{ "name": "Fortifying Whirlwind", "description": "Hitting an enemy with Whirlwind grants Fortify, increasing damage absorption by 9.7% for 2s. (Max 5 stacks)" }]\`
* **CORRECT OUTPUT:** \`[[{ "effect_id": "FortifyingWhirlwind_Fortify", "name": "Fortifying Whirlwind", "type": "FORTIFY", "application_trigger": "ON_HIT_WITH_WHIRLWIND", "target": "SELF", "value_type": "PERCENTAGE", "value": 9.7, "duration_seconds": 2, "is_stackable": true, "max_stacks": 5, "description": "Hitting an enemy with Whirlwind grants Fortify, increasing damage absorption by 9.7% for 2s. (Max 5 stacks)" }]]\`

**EXAMPLE 3: Bleed on Crit with Cooldown**
* **INPUT:** \`[{ "name": "Keenly Jagged", "description": "On Critical Hit: cause a bleed that deals 10% weapon damage per second for 6s. (7s cooldown)" }]\`
* **CORRECT OUTPUT:** \`[[{ "effect_id": "KeenlyJagged_Bleed", "name": "Keenly Jagged Bleed", "type": "BLEED", "application_trigger": "ON_CRITICAL_HIT", "target": "TARGET", "value_type": "WEAPON_DAMAGE_PCT", "value": 10, "duration_seconds": 6, "description": "On Critical Hit: cause a bleed that deals 10% weapon damage per second for 6s. (7s cooldown)" }]]\`

**EXAMPLE 4: Passive Stat Bonus**
* **INPUT:** \`[{ "name": "Vicious", "description": "+11% critical damage." }]\`
* **CORRECT OUTPUT:** \`[[{ "effect_id": "Vicious_CritDamage", "name": "Vicious Crit Damage", "type": "DAMAGE", "application_trigger": "PASSIVE", "target": "SELF", "value_type": "PERCENTAGE", "value": 11, "description": "+11% critical damage." }]]\`

--- END OF BLUEPRINT ---

Now, using that exact blueprint as your guide, deconstruct the following items.`;


// --- API CALLER UTILITY ---
const callScribeAPI = async (base64ImageData, systemInstructions, userPrompt, addLog, isDeconstruction = false) => {
    const userApiKey = sessionStorage.getItem('geminiApiKey');
    if (!userApiKey) {
        addLog('error', 'Scribe/Deconstructor Failure: API Key is not set.');
        return null;
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${userApiKey}`;

    const parts = isDeconstruction
        ? [{ text: userPrompt }]
        : [{ text: userPrompt }, { inlineData: { mimeType: "image/png", data: base64ImageData } }];

    const payload = {
        contents: [{ parts: parts }],
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

        if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
            const jsonText = result.candidates[0].content.parts[0].text;
            try {
                return JSON.parse(jsonText);
            } catch (e) {
                addLog("special", "Direct JSON parse failed, attempting to extract from markdown.");
                const strippedText = jsonText.replace(/^```json\s*/, '').replace(/```$/, '');
                const jsonMatch = strippedText.match(/(\[.*\]|\{.*\})/s);
                if (jsonMatch && jsonMatch[0]) {
                    return JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error("Failed to extract valid JSON from the API response.");
                }
            }
        } else {
            if (result.candidates && result.candidates[0].finishReason === 'SAFETY') {
                throw new Error("Content blocked by API safety filters.");
            }
            console.error("Unexpected API response structure:", result);
            throw new Error("No valid content returned from API.");
        }
    } catch (e) {
        addLog('error', `AI Error: ${e.message}`);
        return null;
    }
};


// --- FORGE PANEL COMPONENT ---
const ForgePanel = ({ setStagedData, addLog, setActiveTab }) => {
    const [deconstructorInput, setDeconstructorInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [scribeStatus, setScribeStatus] = useState('Click here and press Ctrl+V');

    const handleDeconstruction = async (items) => {
        setIsProcessing(true);
        addLog('special', `Deconstructing ${items.length} item(s)... This may take a moment.`);
        const userPrompt = `Deconstruct the following items according to your mission briefing:\n\n${JSON.stringify(items, null, 2)}`;
        const effectsByItem = await callScribeAPI(null, DECONSTRUCTOR_BLUEPRINT, userPrompt, addLog, true);

        if (effectsByItem && Array.isArray(effectsByItem) && effectsByItem.length > 0) {
            const newStagedData = items.map((item, index) => {
                const effects = effectsByItem[index] || [];
                const ability = {
                    ability_id: item.id || `Perk_${(item.name || '').replace(/\s+/g, '')}`,
                    name: item.name,
                    type: 'PERK',
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
            setStagedData(newStagedData);
            addLog('success', `Deconstruction successful. Passing ${newStagedData.length} item(s) to staging area.`);
            setActiveTab('migration');
        } else {
            addLog('error', `Failed to deconstruct items. The AI did not return a valid array of arrays.`);
        }
        setIsProcessing(false);
    };

    const runDeconstructor = async () => {
        if (!deconstructorInput.trim()) {
            addLog('error', 'Deconstructor input is empty.');
            return;
        }
        try {
            const items = JSON.parse(deconstructorInput);
            if (!Array.isArray(items)) throw new Error("Input must be a valid JSON array.");
            await handleDeconstruction(items);
        } catch (e) {
            addLog('error', `Invalid JSON provided to Deconstructor: ${e.message}`);
        }
    };

    const processImage = async (blob) => {
        if (!blob) return;

        setIsProcessing(true);
        setScribeStatus('Analyzing... Please wait.');

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64ImageData = event.target.result.split(',')[1];
            const systemInstructions = `You are an expert data entry assistant for the game New World. Your task is to analyze an image of a tooltip or list of tooltips and extract the name and description for each item into a structured JSON object.`;
            const userPrompt = `For each item in the image, extract its 'name' and 'description'. Return a single JSON array containing all the extracted objects. If there is only one object, still return it inside an array.`;

            try {
                const resultArray = await callScribeAPI(base64ImageData, systemInstructions, userPrompt, addLog);
                if (resultArray && resultArray.length > 0) {
                    await handleDeconstruction(resultArray);
                } else {
                    addLog('error', 'Scribe could not find any items to deconstruct in the image.');
                }
            } catch (e) {
                addLog('error', `Error processing image: ${e}`);
            } finally {
                setIsProcessing(false);
                setScribeStatus('Click here and press Ctrl+V');
            }
        };
        reader.readAsDataURL(blob);
    };

    const handlePaste = (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (const item of items) {
            if (item.type.indexOf('image') === 0) {
                const blob = item.getAsFile();
                processImage(blob);
                break;
            }
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            processImage(file);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
                <h2 className="text-2xl font-semibold text-cyan-300 mb-4">Deconstructor Testbed</h2>
                <div className="mb-4">
                    <label htmlFor="deconstructorInput" className="block text-sm font-medium text-gray-400 mb-2">Raw Perk JSON Array:</label>
                    <textarea
                        id="deconstructorInput"
                        rows="8"
                        className="block w-full bg-gray-900 border-gray-600 rounded-md p-2 font-mono text-sm text-amber-300"
                        placeholder="Paste the JSON array of perks here..."
                        value={deconstructorInput}
                        onChange={(e) => setDeconstructorInput(e.target.value)}
                        disabled={isProcessing}
                    />
                </div>
                <p className="text-sm text-gray-400 mb-2">Run the AI Deconstructor on the provided JSON data. Results will appear in the Migration Staging area.</p>
                <button
                    onClick={runDeconstructor}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-5 rounded-lg text-lg transition disabled:bg-cyan-800/50 disabled:cursor-wait"
                    disabled={isProcessing}
                >
                    {isProcessing ? 'Processing...' : 'Run AI Deconstructor'}
                </button>
            </div>
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700 space-y-4">
                <h2 className="text-2xl font-semibold text-sky-300 mb-2">Project Scribe - AI Ingestion</h2>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Provide Image:</label>
                    <div
                        id="scribe-paste-zone"
                        onPaste={handlePaste}
                        className={`border-2 dashed rounded-lg p-8 text-center cursor-pointer transition-all ${isProcessing ? 'border-amber-500 bg-gray-900/50 cursor-wait' : 'border-gray-600 hover:border-sky-500 hover:bg-gray-700/50'}`}
                    >
                        <p className="text-gray-400">{scribeStatus}</p>
                    </div>
                    <div className="text-center text-sm text-gray-500 my-2">OR</div>
                    <input type="file" id="scribeFileUpload" className="hidden" accept="image/png, image/jpeg, image/gif, image/webp" onChange={handleFileUpload} disabled={isProcessing} />
                    <button
                        id="scribeUploadBtn"
                        onClick={() => document.getElementById('scribeFileUpload').click()}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-800 disabled:cursor-wait"
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Processing...' : 'Upload Image File'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgePanel;
