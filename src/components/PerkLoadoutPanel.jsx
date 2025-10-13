import React, { useEffect, useState } from 'react';
import { fetchPerks } from '../lib/firebase/firestore';

const PerkLoadoutPanel = ({ equippedPerks, setEquippedPerks, firestore }) => {
  const [perks, setPerks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPerks() {
      setLoading(true);
      try {
        const data = await fetchPerks(firestore);
        setPerks(data);
      } catch (err) {
        setPerks([]);
      }
      setLoading(false);
    }
    loadPerks();
  }, [firestore]);

  const handleToggle = (perk) => {
    if (equippedPerks.some(p => p.id === perk.id)) {
      setEquippedPerks(equippedPerks.filter(p => p.id !== perk.id));
    } else {
      setEquippedPerks([...equippedPerks, perk]);
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">Perk Loadout</h2>
      {loading ? (
        <div className="text-gray-400">Loading perks...</div>
      ) : (
        <table className="min-w-full text-sm text-left">
          <thead className="bg-black/40">
            <tr>
              <th className="p-2 font-semibold">Select</th>
              <th className="p-2 font-semibold">Name</th>
              <th className="p-2 font-semibold">Perk Bucket</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {perks.map(perk => (
              <tr key={perk.id}>
                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={equippedPerks.some(p => p.id === perk.id)}
                    onChange={() => handleToggle(perk)}
                  />
                </td>
                <td className="p-2">{perk.name}</td>
                <td className="p-2">{perk.bucket || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PerkLoadoutPanel;
