import React, { useEffect, useState } from 'react';
import { fetchPerks } from '../lib/firebase/firestore.js';

const PerkLoadoutPanel = ({ equippedPerks, setEquippedPerks, firestore }) => {
  const [perks, setPerks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPerks() {
      setLoading(true);
      try {
        const data = await fetchPerks(firestore);
        setPerks(data);
      } catch (err) {
        console.error("Error fetching perks:", err);
        setPerks([]);
      }
      setLoading(false);
    }
    loadPerks();
  }, [firestore]);

  const handleToggle = (perkId) => {
    setEquippedPerks(prev => 
      prev.includes(perkId) ? prev.filter(id => id !== perkId) : [...prev, perkId]
    );
  };

  return (
    <div className="bg-slate-800/40 rounded-xl p-4 flex flex-col space-y-4 border border-slate-700 shadow-lg backdrop-blur-sm">
      <h2 className="text-lg font-bold text-green-400 border-b border-slate-600 pb-2 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h4a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
        Perk Loadout
      </h2>
      <div className="flex-grow overflow-auto custom-scrollbar pr-1" style={{maxHeight: '200px'}}>
        {loading ? (
          <div className="text-center text-slate-400 py-8">Loading perks...</div>
        ) : (
          <table className="min-w-full text-sm text-left">
            <thead className="bg-black/20 sticky top-0 backdrop-blur-sm z-10">
              <tr>
                <th className="p-2 font-semibold text-slate-300 w-1/4">Use</th>
                <th className="p-2 font-semibold text-slate-300">Name</th>
                <th className="p-2 font-semibold text-slate-300">Bucket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {perks.map(perk => (
                <tr key={perk.id} className="hover:bg-slate-700/50 transition-colors duration-150">
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                      checked={equippedPerks.includes(perk.id)}
                      onChange={() => handleToggle(perk.id)}
                    />
                  </td>
                  <td className="p-2 whitespace-nowrap">{perk.name}</td>
                  <td className="p-2 whitespace-nowrap text-slate-400">{perk.bucket || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PerkLoadoutPanel;

