import React from 'react';

export default function InspectorPanel({ logEntry, combatantState, targetState, formulaBreakdown, onClose }) {
  return (
    <div className="bg-gray-900/90 fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white p-2"
          title="Close Inspector"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-white mb-4">Combat Inspector</h2>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-cyan-400 mb-2">Event Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-gray-400">Source:</span> <span className="text-white">{logEntry.source}</span></div>
            <div><span className="text-gray-400">Target:</span> <span className="text-white">{logEntry.target}</span></div>
            <div><span className="text-gray-400">Action:</span> <span className="text-white">{logEntry.action}</span></div>
            <div><span className="text-gray-400">Damage:</span> <span className="text-white">{logEntry.damage}</span></div>
            <div><span className="text-gray-400">Crit?:</span> <span className="text-yellow-400">{logEntry.isCrit ? 'YES' : 'no'}</span></div>
            <div><span className="text-gray-400">Effects Applied:</span> <span className="text-red-300">{logEntry.effectsApplied}</span></div>
          </div>
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-cyan-400 mb-2">Combatant State</h3>
          <pre className="bg-gray-700 rounded p-2 text-gray-200 text-xs overflow-x-auto">{JSON.stringify(combatantState, null, 2)}</pre>
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Target State</h3>
          <pre className="bg-gray-700 rounded p-2 text-gray-200 text-xs overflow-x-auto">{JSON.stringify(targetState, null, 2)}</pre>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">Grand Damage Formula Breakdown</h3>
          <pre className="bg-gray-700 rounded p-2 text-gray-200 text-xs overflow-x-auto">{formulaBreakdown}</pre>
        </div>
      </div>
    </div>
  );
}
