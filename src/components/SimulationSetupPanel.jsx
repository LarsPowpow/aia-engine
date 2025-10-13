import React, { useState } from 'react';
import CombatantPanel from './CombatantPanel';

const SimulationSetupPanel = ({
  runSimulation,
  setCombatLog,
  addLog
}) => {
  // State for weaponType and attributes
  const [weaponType, setWeaponType] = useState('Sword');
  const [str, setStr] = useState(5);
  const [dex, setDex] = useState(5);
  const [int, setInt] = useState(5);
  const [foc, setFoc] = useState(5);
  const [con, setCon] = useState(5);

  const handleRunSimulation = () => {
    const attributes = {
      STR: Number(str),
      DEX: Number(dex),
      INT: Number(int),
      FOC: Number(foc),
      CON: Number(con)
    };
    const combatant = {
      id: 'player',
      name: 'Player',
      health: 1200,
      weaponType,
      attack_speed: 1.1,
      attributes
    };
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

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700 mb-6">
      <h3 className="text-2xl font-semibold text-gray-200 mb-4 text-center">The Armory</h3>
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
      <button
        onClick={handleRunSimulation}
        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition"
      >
        Run Simulation
      </button>
    </div>
  );
};

export default SimulationSetupPanel;
