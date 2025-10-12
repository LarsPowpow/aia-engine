import React, { useState } from 'react';
import CombatLogPanel from './CombatLogPanel';
import SimulationSetupPanel from './SimulationSetupPanel';
import { runSimulation } from '../simulation/engine.js';

const CombatSimulatorPage = ({ addLog }) => {
  const [combatLog, setCombatLog] = useState([]);
  
  const [combatantA, setCombatantA] = useState({
    id: 'player',
    name: 'Player',
    health: 1200,
    base_damage: 55,
    attack_speed: 1.1,
    attributes: { str: 5, dex: 5, int: 5, foc: 5, con: 5 },
    perks: []
  });

  const [combatantB, setCombatantB] = useState({
    id: 'dummy',
    name: 'Target Dummy',
    health: 5000,
    base_damage: 0,
    attack_speed: 999,
    attributes: { str: 0, dex: 0, int: 0, foc: 0, con: 0 },
    perks: []
  });

  // Example perk manifest (replace with real data source)
  const allPerks = [
    { id: 'perk1', name: 'Keen Edge', perk_bucket: 'Weapon' },
    { id: 'perk2', name: 'Fortified', perk_bucket: 'Armor' },
    { id: 'perk3', name: 'Arcane Focus', perk_bucket: 'Jewelry' }
  ];

  // Handlers for Combatant A
  const handlePerkAddA = (perkId) => {
    setCombatantA(prev => ({ ...prev, perks: [...prev.perks, perkId] }));
  };
  const handlePerkRemoveA = (perkId) => {
    setCombatantA(prev => ({ ...prev, perks: prev.perks.filter(id => id !== perkId) }));
  };

  // Handlers for Combatant B
  const handlePerkAddB = (perkId) => {
    setCombatantB(prev => ({ ...prev, perks: [...prev.perks, perkId] }));
  };
  const handlePerkRemoveB = (perkId) => {
    setCombatantB(prev => ({ ...prev, perks: prev.perks.filter(id => id !== perkId) }));
  };

  const handleRunSimulation = () => {
    addLog('special', `Running simulation with ${combatantA.attributes.str} STR...`);
    // This now uses the live state from the UI
    const logOutput = runSimulation(combatantA, combatantB); 
    setCombatLog(logOutput);
    addLog('success', `Simulation complete. Results displayed in the Arena.`);
  };

  const handleClearLog = () => {
    setCombatLog([]);
    addLog('info', 'Combat Log cleared.');
  }

  return (
    <div>
      <SimulationSetupPanel 
        combatantA={combatantA}
        setCombatantA={setCombatantA}
        combatantB={combatantB}
        setCombatantB={setCombatantB}
        allPerks={allPerks}
        selectedPerksA={combatantA.perks}
        onPerkAddA={handlePerkAddA}
        onPerkRemoveA={handlePerkRemoveA}
        selectedPerksB={combatantB.perks}
        onPerkAddB={handlePerkAddB}
        onPerkRemoveB={handlePerkRemoveB}
      />
      
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-cyan-500/50">
        <h2 className="text-2xl font-semibold text-cyan-300 mb-4 text-center">The Arena</h2>
        
        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-gray-300 mb-2">Simulation Controls</h3>
          <p className="text-sm text-gray-400 mb-4">
            Configure your build in The Armory, then run the simulation.
          </p>
          {/* --- UPGRADED CONTROLS --- */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleRunSimulation}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition"
            >
              Run Simulation
            </button>
            <button
              onClick={handleClearLog}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition"
            >
              Clear Log
            </button>
          </div>
          {/* ------------------------- */}
        </div>

        <CombatLogPanel log={combatLog} />
      </div>
    </div>
  );
};

export default CombatSimulatorPage;
