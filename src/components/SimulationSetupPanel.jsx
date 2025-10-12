import React from 'react';
import CombatantPanel from './CombatantPanel';

const SimulationSetupPanel = ({
  combatantA,
  combatantB,
  setCombatantA,
  setCombatantB,
  allPerks = [],
  selectedPerksA = [],
  onPerkAddA,
  onPerkRemoveA,
  selectedPerksB = [],
  onPerkAddB,
  onPerkRemoveB
}) => {
  const handleAttributeChange = (setter) => (e) => {
    const { name, value } = e.target;
    setter(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [name]: parseInt(value, 10) || 0
      }
    }));
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700 mb-6">
      <h3 className="text-2xl font-semibold text-gray-200 mb-4 text-center">The Armory</h3>
      <div className="flex flex-col md:flex-row gap-6">
        <CombatantPanel 
          title="Combatant A: Your Build" 
          attributes={combatantA.attributes}
          onAttributeChange={handleAttributeChange(setCombatantA)}
          allPerks={allPerks}
          selectedPerks={selectedPerksA}
          onPerkAdd={onPerkAddA}
          onPerkRemove={onPerkRemoveA}
        />
        <CombatantPanel 
          title="Combatant B: Target" 
          attributes={combatantB.attributes}
          onAttributeChange={handleAttributeChange(setCombatantB)}
          allPerks={allPerks}
          selectedPerks={selectedPerksB}
          onPerkAdd={onPerkAddB}
          onPerkRemove={onPerkRemoveB}
        />
      </div>
    </div>
  );
};

export default SimulationSetupPanel;
