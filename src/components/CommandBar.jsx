import React from 'react';

const CommandBar = ({ onRunSimulation, onClearLog, isPrimary }) => {
  if (isPrimary) {
    // Primary Command Bar (Top of page)
    return (
      <div className="flex items-center justify-center bg-gray-900/50 border border-gray-700 rounded-lg p-2 gap-4 shadow-lg">
        <button
          onClick={onRunSimulation}
          className="w-full max-w-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transform hover:scale-105"
        >
          Run Simulation
        </button>
        <button
          onClick={onClearLog}
          className="bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-3 px-6 rounded-lg transition duration-200 border border-gray-600 hover:border-gray-500"
        >
          Clear Log
        </button>
      </div>
    );
  }

  // Secondary Command Bar (in Control Console scroll)
  return (
    <div className="flex items-center justify-between bg-gray-900/70 border border-gray-700 rounded-lg p-2 gap-2 shadow-md">
      <button
        onClick={onRunSimulation}
        className="w-1/2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md transition duration-200"
      >
        Run
      </button>
      <button
        onClick={onClearLog}
        className="w-1/2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-2 px-4 rounded-md transition duration-200 border border-gray-600"
      >
        Clear
      </button>
    </div>
  );
};

export default CommandBar;

