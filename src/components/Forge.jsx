import { useState } from 'react';

const OBJECT_TYPES = ['perks', 'abilities', 'effects'];

function Forge({ logMessage }) {
  const [selectedType, setSelectedType] = useState('');

  // The component is now a simple, styled form fragment
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="forge-select" className="block text-sm font-medium text-slate-300 mb-2">1. Select Object Type to Forge</label>
        <select
          id="forge-select"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="block w-full bg-slate-800 border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
        >
          <option value="">-- Select Object Type --</option>
          {OBJECT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>

      {!selectedType && (
        <p className="text-slate-500 text-sm pt-2">Please select an object type to begin.</p>
      )}
      
      {/* Future form elements for the Forge will go here */}

    </div>
  );
}

export default Forge;