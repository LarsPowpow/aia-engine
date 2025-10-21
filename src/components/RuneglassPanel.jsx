import React from 'react';

const RuneglassPanel = ({ equippedRuneglass, setEquippedRuneglass, runeglassOptions }) => {
    const [nameFilter, setNameFilter] = React.useState('');

    // Multi-select: equippedRuneglass is now an array
    const handleToggle = (runeglass) => {
        setEquippedRuneglass(prev => {
            const ids = (prev || []).map(rg => rg.id);
            if (ids.includes(runeglass.id)) {
                // Deselect
                return prev.filter(rg => rg.id !== runeglass.id);
            } else {
                // Select
                return [...(prev || []), runeglass];
            }
        });
    };

    const filteredRuneglass = React.useMemo(() => {
        if (!Array.isArray(runeglassOptions)) return [];
        return runeglassOptions.filter(rg => {
            return (rg.name || rg.label || '').toLowerCase().includes(nameFilter.toLowerCase());
        });
    }, [runeglassOptions, nameFilter]);

    const renderContent = () => {
        if (!runeglassOptions) {
            return <div className="text-center text-slate-400 py-8">Loading runeglass options...</div>;
        }
        if (runeglassOptions.length === 0) {
            return <div className="text-center text-slate-500 py-8">No implemented runeglass found.</div>;
        }
        return (
            <table className="min-w-full text-sm text-left">
                <thead className="bg-black/20 sticky top-0 backdrop-blur-sm z-10">
                    <tr>
                        <th className="p-2 font-semibold text-slate-300 w-1/6">Use</th>
                        <th className="p-2 font-semibold text-slate-300">Name</th>
                    </tr>
                    <tr>
                        <th className="p-2"></th>
                        <th className="p-2">
                            <input
                                type="text"
                                placeholder="Search Name..."
                                value={nameFilter}
                                onChange={(e) => setNameFilter(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-600 rounded-md px-2 py-1 text-xs text-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                            />
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                    {filteredRuneglass.map(option => (
                        <tr key={option.id} className="hover:bg-slate-700/50 transition-colors duration-150">
                            <td className="p-2 text-center">
                                <input
                                    type="checkbox"
                                    className="form-checkbox h-4 w-4 bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                                    checked={(equippedRuneglass || []).some(rg => rg.id === option.id)}
                                    onChange={() => handleToggle(option)}
                                />
                            </td>
                            <td className="p-2 whitespace-nowrap">{option.label || option.name || <span className="text-red-400 italic">Missing Name</span>}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    return (
        <div className="bg-slate-800/40 rounded-xl p-4 flex flex-col space-y-4 border border-slate-700 shadow-lg backdrop-blur-sm">
            <h2 className="text-lg font-bold text-slate-100 border-b border-slate-600 pb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-cyan-400"><circle cx="12" cy="12" r="9.5" /><circle cx="12" cy="12" r="4" /></svg>
                Runeglass Socketing
            </h2>
            <div className="flex-grow overflow-auto custom-scrollbar pr-1 h-48">
                {renderContent()}
            </div>
        </div>
    );
};

export default RuneglassPanel;
