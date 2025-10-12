import React, { useState } from 'react';
import CombatLogPanel from './CombatLogPanel';
import SimulationSetupPanel from './SimulationSetupPanel';

const CombatSimulatorPage = ({ handleRunSimulation, addLog }) => {
  const [combatLog, setCombatLog] = useState([]);
  const [combatantA, setCombatantA] = useState({ attributes: {} });
  const [combatantB, setCombatantB] = useState({ attributes: {} });

  const runAndDisplaySimulation = () => {
    const logOutput = handleRunSimulation();
    setCombatLog(logOutput);
  };

  return (
    <div>
      <SimulationSetupPanel 
        combatantA={combatantA} 
        combatantB={combatantB} 
        setCombatantA={setCombatantA} 
        setCombatantB={setCombatantB} 
      />
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-cyan-500/50">
        <h2 className="text-2xl font-semibold text-cyan-300 mb-4 text-center">The Arena</h2>
        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-gray-300 mb-2">Gladiator Simulation</h3>
          <p className="text-sm text-gray-400 mb-4">
            Run the pre-scripted battle and view the results in the Live Combat Log below.
          </p>
          <button
            onClick={runAndDisplaySimulation}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition"
          >
            Run Simulation
          </button>
        </div>
        <CombatLogPanel log={combatLog} />
      </div>
    </div>
  );
};

export default CombatSimulatorPage;
