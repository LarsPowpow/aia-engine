import React, { useState, useRef } from 'react';

const CombatLogPanel = ({ log }) => {
  const logContainerRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const getEntryColor = (entry) => {
    if (entry.toLowerCase().includes('attacks')) return 'text-gray-300';
    if (entry.toLowerCase().includes('defeated')) return 'text-red-400 font-bold';
    if (entry.toLowerCase().includes('start') || entry.toLowerCase().includes('end')) return 'text-cyan-400';
    return 'text-gray-400';
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Determine container classes based on the expanded state
  const containerClasses = isExpanded
    ? 'overflow-visible font-mono text-sm pr-2 bg-black/20 rounded' // Expanded state: let it grow freely
    : 'h-96 overflow-auto font-mono text-sm pr-2 resize min-h-[10rem] max-h-[50vh] bg-black/20 rounded'; // Collapsed state: fixed height, resizable

  return (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 mt-6">
      <div className="flex justify-between items-center mb-3 border-b border-gray-600 pb-2">
        <h3 className="text-xl font-semibold text-gray-300">Live Combat Log</h3>
        {/* --- NEW EXPAND/COLLAPSE BUTTON --- */}
        <button
          onClick={toggleExpand}
          className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-1 px-3 rounded-md transition"
          disabled={log.length === 0}
        >
          {isExpanded ? 'Collapse Log' : 'Expand to Full Log'}
        </button>
        {/* ---------------------------------- */}
      </div>
      
      <div ref={logContainerRef} className={containerClasses}>
        {log.length > 0 ? (
          log.map((entry, index) => (
            <p key={index} className={`whitespace-pre-wrap leading-relaxed ${getEntryColor(entry)}`}>
              {entry}
            </p>
          ))
        ) : (
          <p className="text-gray-500 italic text-center pt-16">Simulation has not been run. Press "Run Simulation" to begin.</p>
        )}
      </div>
    </div>
  );
};

export default CombatLogPanel;
