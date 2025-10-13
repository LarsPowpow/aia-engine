import React from 'react';

export default function CommandBar({ onRunSimulation, onClearLog }) {
  return (
    <div className="flex items-center justify-between bg-gray-900 border border-gray-700 rounded-lg p-3 mb-4 shadow-md">
      <button
        onClick={onRunSimulation}
        className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition duration-300 shadow-cyan-600/20 mr-2"
      >
        Run Simulation
      </button>
      <button
        onClick={onClearLog}
        className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-2 px-6 rounded-lg transition duration-300 border border-gray-600"
      >
        Clear Log
      </button>
    </div>
  );
}
