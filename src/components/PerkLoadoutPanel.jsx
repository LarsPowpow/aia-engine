import React, { useMemo, useState } from 'react';

// --- Main Component ---
const PerkLoadoutPanel = ({ equippedPerks, setEquippedPerks, perkOptions }) => {
  const [nameFilter, setNameFilter] = useState('');
  const [bucketFilter, setBucketFilter] = useState('');

  const uniqueBuckets = useMemo(() => {
    if (!perkOptions || perkOptions.length === 0) return [];
    const buckets = new Set(perkOptions.map(p => p.perk_bucket || 'None').filter(Boolean));
    return ['All Buckets', ...Array.from(buckets).sort()];
  }, [perkOptions]);

  const filteredPerks = useMemo(() => {
    if (!perkOptions) return [];
    return perkOptions.filter(perk => {
      const nameMatch = (perk.name || '').toLowerCase().includes(nameFilter.toLowerCase());
      const bucketValue = perk.perk_bucket || 'None';
      const bucketMatch = bucketFilter === 'All Buckets' || bucketFilter === '' || bucketValue === bucketFilter;
      return nameMatch && bucketMatch;
    });
  }, [perkOptions, nameFilter, bucketFilter]);

  const handleToggle = (perk) => {
    const isEquipped = equippedPerks.some(p => p.id === perk.id);
    if (isEquipped) {
      setEquippedPerks(prev => prev.filter(p => p.id !== perk.id));
    } else {
      setEquippedPerks(prev => [...prev, perk]);
    }
  };

  const renderContent = () => {
    if (!perkOptions) {
      return <div className="text-center text-slate-400 py-8">Loading perks...</div>;
    }
    if (perkOptions.length === 0) {
        return <div className="text-center text-slate-500 py-8">No perks found.</div>;
    }
    return (
      <table className="min-w-full text-sm text-left">
        <thead className="bg-black/20 sticky top-0 backdrop-blur-sm z-10">
          <tr>
            <th className="p-2 font-semibold text-slate-300 w-1/6">Use</th>
            <th className="p-2 font-semibold text-slate-300">
              <input
                type="text"
                placeholder="Search Name..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-600 rounded-md px-2 py-1 text-xs text-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </th>
            <th className="p-2 font-semibold text-slate-300">
              <select
                value={bucketFilter}
                onChange={(e) => setBucketFilter(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-600 rounded-md px-2 py-1 text-xs text-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
              >
                {uniqueBuckets.map(bucket => (
                  <option key={bucket} value={bucket}>{bucket}</option>
                ))}
              </select>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {filteredPerks.map(perk => (
            <tr key={perk.id} className="hover:bg-slate-700/50 transition-colors duration-150">
              <td className="p-2 text-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                  checked={equippedPerks.some(p => p.id === perk.id)}
                  onChange={() => handleToggle(perk)}
                />
              </td>
              <td className="p-2 whitespace-nowrap">{perk.name || <span className="text-red-400 italic">Missing Name</span>}</td>
              <td className="p-2 whitespace-nowrap text-slate-400">{perk.perk_bucket || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="bg-slate-800/40 rounded-xl p-4 flex flex-col space-y-4 border border-slate-700 shadow-lg backdrop-blur-sm">
      <h2 className="text-lg font-bold text-green-400 border-b border-slate-600 pb-2 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h4a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
        Perk Loadout
      </h2>
      <div className="flex-grow overflow-auto custom-scrollbar pr-1 h-48">
        {renderContent()}
      </div>
    </div>
  );
};

export default PerkLoadoutPanel;
