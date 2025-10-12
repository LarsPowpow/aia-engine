import React from 'react';
import PerkSelector from './PerkSelector';

const CombatantPanel = ({
  title,
  attributes = {},
  onAttributeChange,
  allPerks = [],
  selectedPerks = [],
  onPerkAdd,
  onPerkRemove
}) => {
  const attributeFields = [
    { key: 'str', label: 'STR' },
    { key: 'dex', label: 'DEX' },
    { key: 'int', label: 'INT' },
    { key: 'foc', label: 'FOC' },
    { key: 'con', label: 'CON' },
  ];

  return (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex-grow">
      <h4 className="text-lg font-semibold text-gray-300 mb-4">{title}</h4>
      {/* --- ATTRIBUTE MATRIX --- */}
      <div className="mb-4">
        <h5 className="text-md font-semibold text-gray-400 mb-2">Attributes</h5>
        <div className="grid grid-cols-5 gap-2">
          {attributeFields.map(({ key, label }) => (
            <div key={key}>
              <label htmlFor={`${title}-${key}`} className="block text-center text-xs font-medium text-gray-500">{label}</label>
              <input
                type="number"
                id={`${title}-${key}`}
                name={key}
                value={attributes[key] || ''}
                onChange={onAttributeChange}
                className="w-full bg-gray-800 text-center text-white p-2 mt-1 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          ))}
        </div>
      </div>
      {/* ------------------------ */}
      <div className="space-y-2 mt-4 border-t border-gray-700 pt-4">
        <p className="text-sm text-gray-500">Build Selector: [Coming Soon]</p>
        {/* --- INTEGRATED PERK SELECTOR --- */}
        <PerkSelector
          allPerks={allPerks}
          selectedPerks={selectedPerks}
          onPerkAdd={onPerkAdd}
          onPerkRemove={onPerkRemove}
        />
        {/* -------------------------------- */}
        <p className="text-sm text-gray-500">Armor Perks: [Coming Soon]</p>
        <p className="text-sm text-gray-500">Jewelry Perks: [Coming Soon]</p>
      </div>
    </div>
  );
};

export default CombatantPanel;
