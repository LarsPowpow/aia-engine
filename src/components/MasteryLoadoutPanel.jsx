import React from 'react';
// Import the new, dedicated mastery fetching function
import { fetchAllMasteries } from '../lib/firebase/firestore.js';

// --- Custom Hook for Mastery Data Fetching ---
const useMasteries = () => {
  const [masteries, setMasteries] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const abortController = new AbortController();

    async function loadMasteries() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAllMasteries();
        if (!abortController.signal.aborted) {
          // Sort masteries alphabetically by name
          const sortedData = data.sort((a, b) => 
            (a.name || 'Unnamed Mastery').localeCompare(b.name || 'Unnamed Mastery')
          );
          setMasteries(sortedData);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error("Failed to load masteries:", err);
          setError("Failed to load masteries from UKB.");
          setMasteries([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }
    
    loadMasteries();

    return () => {
      abortController.abort();
    };
  }, []);

  return { masteries, loading, error };
};


// --- Main Component ---
// This now functions as an interactive selector.
const MasteryLoadoutPanel = ({ equippedMasteries, setEquippedMasteries }) => {
  const { masteries, loading, error } = useMasteries();
  const [nameFilter, setNameFilter] = React.useState('');

  const handleToggle = (mastery) => {
    const isEquipped = equippedMasteries.some(m => m.id === mastery.id);
    if (isEquipped) {
      setEquippedMasteries(prev => prev.filter(m => m.id !== mastery.id));
    } else {
      setEquippedMasteries(prev => [...prev, mastery]);
    }
  };

  const filteredMasteries = React.useMemo(() => {
    return masteries.filter(mastery => {
      return (mastery.name || '').toLowerCase().includes(nameFilter.toLowerCase());
    });
  }, [masteries, nameFilter]);

  const renderContent = () => {
    if (loading) {
      return <div className="text-center text-slate-400 py-8">Loading masteries from UKB...</div>;
    }
    if (error) {
      return <div className="text-center text-red-400 py-8">{error}</div>;
    }
    if (masteries.length === 0) {
        return <div className="text-center text-slate-500 py-8">No masteries found in UKB.</div>;
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
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {filteredMasteries.map(mastery => (
            <tr key={mastery.id} className="hover:bg-slate-700/50 transition-colors duration-150">
              <td className="p-2 text-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                  checked={equippedMasteries.some(m => m.id === mastery.id)}
                  onChange={() => handleToggle(mastery)}
                />
              </td>
              <td className="p-2 whitespace-nowrap">{mastery.name || <span className="text-red-400 italic">Missing Name</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="bg-slate-800/40 rounded-xl p-4 flex flex-col space-y-4 border border-slate-700 shadow-lg backdrop-blur-sm">
      <h2 className="text-lg font-bold text-yellow-400 border-b border-slate-600 pb-2 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h.01a1 1 0 100-2H10zm3 0a1 1 0 000 2h.01a1 1 0 100-2H13z" clipRule="evenodd" />
        </svg>
        Mastery Loadout
      </h2>
      <div className="flex-grow overflow-auto custom-scrollbar pr-1" style={{maxHeight: '200px'}}>
        {renderContent()}
      </div>
    </div>
  );
};

export default MasteryLoadoutPanel;