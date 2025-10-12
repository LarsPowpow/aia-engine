import React, { useRef, useEffect } from 'react';

const CombatLogPanel = ({ log }) => {
  const logEndRef = useRef(null);

  // Auto-scroll to the latest log entry
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  const getEntryColor = (entry) => {
    if (entry.toLowerCase().includes('attacks')) {
      return 'text-gray-300';
    }
    if (entry.toLowerCase().includes('defeated')) {
      return 'text-red-400 font-bold';
    }
    if (entry.toLowerCase().includes('start') || entry.toLowerCase().includes('end')) {
      return 'text-cyan-400';
    }
    return 'text-gray-400';
  };

  return (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 mt-6">
      <h3 className="text-xl font-semibold text-gray-300 mb-3 border-b border-gray-600 pb-2">Live Combat Log</h3>
      <div className="h-96 overflow-y-auto font-mono text-sm pr-2">
        {log.length > 0 ? (
          log.map((entry, index) => (
            <p key={index} className={`whitespace-pre-wrap leading-relaxed ${getEntryColor(entry)}`}>
              {entry}
            </p>
          ))
        ) : (
          <p className="text-gray-500 italic text-center pt-16">Simulation has not been run. Press "Run Gladiator Sim" to begin.</p>
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

export default CombatLogPanel;
