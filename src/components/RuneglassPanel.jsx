import React from 'react';

// For now, we will hard-code the Runeglass perks we need for our tests.
const availableRuneglassPerks = [
    {
        id: 'perkid_runeglassgem_crueladd_melee',
        name: 'Runeglass of Punishing Malachite (Weapon)',
    },
    // Future runeglass types can be added here for testing.
];

const RuneglassPanel = ({ equippedPerks, setEquippedPerks }) => {
    
    const equippedRuneglass = equippedPerks.find(p => availableRuneglassPerks.some(rg => rg.id === p.id));

    const handleEquip = (perkToEquip) => {
        // First, remove any other runeglass perks to prevent conflicts
        const filteredPerks = equippedPerks.filter(p => !availableRuneglassPerks.some(rg => rg.id === p.id));
        setEquippedPerks([...filteredPerks, perkToEquip]);
    };

    const handleRemove = () => {
        const filteredPerks = equippedPerks.filter(p => !availableRuneglassPerks.some(rg => rg.id === p.id));
        setEquippedPerks(filteredPerks);
    };

    return (
        <div className="bg-slate-800/40 rounded-xl p-4 flex flex-col space-y-4 border border-slate-700 shadow-lg backdrop-blur-sm">
            <h2 className="text-lg font-bold text-slate-100 border-b border-slate-600 pb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-cyan-400"><path d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5 9.5 9.5 0 0 1-9.5 9.5 9.5 9.5 0 0 1-9.5-9.5A9.5 9.5 0 0 1 12 2.5' Z" /><path d="M12 16a4 4 0 0 0 4-4 4 4 0 0 0-4-4 4 4 0 0 0-4 4 4 4 0 0 0 4 4Z" /></svg>
                Runeglass Socketing
            </h2>

            {equippedRuneglass ? (
                <div className="bg-slate-900/50 p-3 rounded-lg border border-cyan-500/30">
                    <p className="text-sm text-slate-400 mb-2">Currently Socketed:</p>
                    <div className="flex justify-between items-center">
                        <p className="font-semibold text-white">{equippedRuneglass.name}</p>
                        <button onClick={handleRemove} className="px-3 py-1 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-md">
                            Remove
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-4 text-slate-500 italic">No Runeglass socketed.</div>
            )}

            <div className="flex flex-col space-y-2">
                {availableRuneglassPerks.map(perk => (
                    <button 
                        key={perk.id}
                        onClick={() => handleEquip(perk)}
                        disabled={equippedRuneglass?.id === perk.id}
                        className="w-full text-left p-2 rounded-md bg-slate-700/50 hover:bg-slate-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition"
                    >
                        <p className="font-semibold">{perk.name}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default RuneglassPanel;
