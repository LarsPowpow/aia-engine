import React, { useState, useEffect } from 'react';

const PerkSelector = ({ allPerks = [], selectedPerks = [], onPerkAdd, onPerkRemove }) => {

  const [searchTerm, setSearchTerm] = useState('');

  // --- DIAGNOSTIC LOG: ADD THIS SECTION ---
  useEffect(() => {
    if (allPerks.length > 0) {
      console.log("Perk Manifest Loaded into Selector:", allPerks);
    }
  }, [allPerks]);
  // ------------------------------------

  const handleAdd = (perkId) => {
    if (perkId) {
      onPerkAdd(perkId);
      setSearchTerm(''); // Clear search after adding
    }
  };

  // Always show available perks to add, filtered by search if present
  const filteredPerks = searchTerm
    ? allPerks.filter(p => 
        !selectedPerks.includes(p.id) && 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allPerks.filter(p => !selectedPerks.includes(p.id));

  // Helper to render a perk item, used in both selected and search lists
  const renderPerkItem = (perk) => (
    <div className="flex justify-between items-center w-full">
      <span className="text-sm text-gray-300 truncate">{perk.name}</span>
      <span className="text-xs text-cyan-400 font-mono ml-2 flex-shrink-0">{perk.perk_bucket || 'N/A'}</span>
    </div>
  );

  return (
    <div>
      <h5 className="text-md font-semibold text-gray-400 mb-2">Perks</h5>
      <div className="bg-gray-800 p-2 rounded-md border border-gray-600 mb-2 min-h-[6rem]">
        {selectedPerks.length > 0 ? (
          selectedPerks.map(perkId => {
            const perk = allPerks.find(p => p.id === perkId);
            if (!perk) return null;
            return (
              <div key={perkId} className="flex justify-between items-center bg-gray-700/50 p-1.5 rounded mb-1">
                {renderPerkItem(perk)}
                <button 
                  onClick={() => onPerkRemove(perkId)}
                  className="text-red-500 hover:text-red-400 font-bold text-xs ml-2"
                >
                  [X]
                </button>
              </div>
            );
          })
        ) : (
          <p className="text-center text-xs text-gray-500 pt-4">No perks selected.</p>
        )}
      </div>
      <div className="relative">
        <input 
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="-- Search for a Perk --"
          className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <div className="absolute z-10 w-full bg-gray-800 border border-gray-600 rounded-b-md mt-1 max-h-48 overflow-y-auto">
          {filteredPerks.length > 0 ? filteredPerks.map(perk => (
            <div 
              key={perk.id}
              onClick={() => handleAdd(perk.id)}
              className="p-2 hover:bg-cyan-700 cursor-pointer"
            >
              {renderPerkItem(perk)}
            </div>
          )) : <p className="p-2 text-sm text-gray-500">No matching perks found.</p>}
        </div>
      </div>
    </div>
  );
};

export default PerkSelector;
