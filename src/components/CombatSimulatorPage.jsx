import React, { useState } from 'react';
import CombatLogPanel from './CombatLogPanel';
import SimulationSetupPanel from './SimulationSetupPanel';
import { runSimulation } from '../simulation/engine.js';
import { calculateWeaponDamage } from '../simulation/formulas.js';

const CombatSimulatorPage = ({ addLog }) => {
  const [combatLog, setCombatLog] = useState([]);

  // --- TEMPORARY CONTROL PANEL STATE ---
  const [weaponType, setWeaponType] = useState('Sword');
  const [str, setStr] = useState(5);
  const [dex, setDex] = useState(5);
  const [int, setInt] = useState(5);
  const [foc, setFoc] = useState(5);
  const [con, setCon] = useState(5);

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
    // Assemble attributes object
    const attributes = {
      STR: Number(str),
      DEX: Number(dex),
      INT: Number(int),
      FOC: Number(foc),
      CON: Number(con)
    };
    // Assemble combatant object
    const combatant = {
      id: 'player',
      name: 'Player',
      health: 1200,
      weaponType,
      attack_speed: 1.1,
      attributes
    };
    // Dummy target
    const target = {
      id: 'dummy',
      name: 'Target Dummy',
      health: 5000,
      weaponType: 'Sword',
      attack_speed: 999,
      attributes: { STR: 0, DEX: 0, INT: 0, FOC: 0, CON: 0 }
    };
    addLog('special', `Running simulation for ${combatant.name} (${weaponType}) with attributes: ${JSON.stringify(attributes)}`);
    const logOutput = runSimulation(combatant, target);
    setCombatLog(logOutput);
    addLog('success', `Simulation complete. Results displayed in the Arena.`);
  };

  const handleClearLog = () => {
    setCombatLog([]);
    addLog('info', 'Combat Log cleared.');
  }

  // --- VALIDATION TEST BUTTON ---
  const handleTestClick = () => {
    const testAttributes = { STR: 332, DEX: 36, FOC: 60 };
    const swordDamage = calculateWeaponDamage('Sword', testAttributes);
    const flailDamage = calculateWeaponDamage('Flail', testAttributes);
    console.log('--- VALIDATION TEST ---');
    console.log('SWORD Damage:', swordDamage, '| EXPECTED: 1371');
    console.log('FLAIL Damage:', flailDamage, '| EXPECTED: 1479');
  };

  return (
    <div>
      {/* --- TEMPORARY CONTROL PANEL --- */}
      <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 mb-6">
        <h3 className="text-lg font-semibold text-cyan-300 mb-4">Captain's Test Cockpit</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">Weapon Type</label>
            <select value={weaponType} onChange={e => setWeaponType(e.target.value)} className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600">
              <option value="Sword">Sword</option>
              <option value="Flail">Flail</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2 mb-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">STR</label>
            <input type="number" value={str} onChange={e => setStr(e.target.value)} className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">DEX</label>
            <input type="number" value={dex} onChange={e => setDex(e.target.value)} className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">INT</label>
            <input type="number" value={int} onChange={e => setInt(e.target.value)} className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">FOC</label>
            <input type="number" value={foc} onChange={e => setFoc(e.target.value)} className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">CON</label>
            <input type="number" value={con} onChange={e => setCon(e.target.value)} className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600" />
          </div>
        </div>
      </div>
      {/* --- END TEMPORARY CONTROL PANEL --- */}
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
            <button
              onClick={handleTestClick}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition"
            >
              Run Validation Test
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
