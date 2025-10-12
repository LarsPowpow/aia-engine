import React, { useState } from 'react';
import CombatLogPanel from './CombatLogPanel';
import SimulationSetupPanel from './SimulationSetupPanel';

const CombatSimulatorPage = ({ handleRunSimulation, addLog }) => {
  const [combatLog, setCombatLog] = useState([]);
  // --- ADD STATE FOR COMBATANTS ---
  const [combatantA, setCombatantA] = useState({
    id: 'player',
    name: 'Player',
    health: 1200,
    base_damage: 55,
    attack_speed: 1.1,
    attributes: { str: 5, dex: 5, int: 5, foc: 5, con: 5 }
  });

  const [combatantB, setCombatantB] = useState({
    id: 'dummy',
    name: 'Target Dummy',
    health: 5000,
    base_damage: 0,
    attack_speed: 999, // Effectively won't attack
    attributes: { str: 0, dex: 0, int: 0, foc: 0, con: 0 }
  });
  // --------------------------------

  const runAndDisplaySimulation = () => {
    // Pass the state-managed combatants to the simulation
    const logOutput = handleRunSimulation(combatantA, combatantB); 
    setCombatLog(logOutput);
  };

  return (
    <div>
      <SimulationSetupPanel 
        combatantA={combatantA}
        setCombatantA={setCombatantA}
        combatantB={combatantB}
        setCombatantB={setCombatantB}
      />
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-cyan-500/50">
        <h2 className="text-2xl font-semibold text-cyan-300 mb-4 text-center">The Arena</h2>
        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-gray-300 mb-2">Gladiator Simulation</h3>
          <p className="text-sm text-gray-400 mb-4">
            Configure your build in The Armory above, then run the simulation.
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
