import React from 'react';

const RuneglassPanel = ({ equippedRuneglass, setEquippedRuneglass, runeglassOptions }) => {
    
    const handleSelect = (runeglass) => {
        // If the same one is clicked, deselect it. Otherwise, select the new one.
        if (equippedRuneglass?.id === runeglass.id) {
            setEquippedRuneglass(null);
        } else {
            setEquippedRuneglass(runeglass);
        }
    };

    const renderContent = () => {
        if (!runeglassOptions) {
            return <div className="text-center text-slate-400 py-8">Loading runeglass options...</div>;
        }
        if (runeglassOptions.length === 0) {
            return <div className="text-center text-slate-500 py-8">No implemented runeglass found.</div>;
        }
        return (
            <div className="flex flex-col space-y-2">
                {runeglassOptions.map(option => (
                    <button 
                        key={option.id}
                        onClick={() => handleSelect(option)}
                        className={`w-full text-left p-2 rounded-md transition border-2 ${
                            equippedRuneglass?.id === option.id 
                            ? 'bg-cyan-800/50 border-cyan-500 ring-2 ring-cyan-500/50' 
                            : 'bg-slate-700/50 hover:bg-slate-700 border-transparent'
                        }`}
                    >
                        <p className="font-semibold">{option.name}</p>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="bg-slate-800/40 rounded-xl p-4 flex flex-col space-y-4 border border-slate-700 shadow-lg backdrop-blur-sm">
            <h2 className="text-lg font-bold text-slate-100 border-b border-slate-600 pb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-cyan-400"><path d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5 9.5 9.5 0 0 1-9.5 9.5 9.5 9.5 0 0 1-9.5-9.5A9.5 9.5 0 0 1 12 2.5' Z" /><path d="M12 16a4 4 0 0 0 4-4 4 4 0 0 0-4-4 4 4 0 0 0-4 4 4 4 0 0 0 4 4Z" /></svg>
                Runeglass Socketing
            </h2>
            {renderContent()}
        </div>
    );
};

export default RuneglassPanel;
