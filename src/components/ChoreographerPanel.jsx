import React from 'react';
import { combatChoreography } from '../simulation/choreography.js';

export default function ChoreographerPanel({ onRunChoreography }) {
  return (
    <div className="choreographer-panel">
      <h2>Combat Choreography</h2>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Action</th>
            <th>Weapon</th>
          </tr>
        </thead>
        <tbody>
          {combatChoreography.map((step, idx) => (
            <tr key={idx}>
              <td>{step.time}</td>
              <td>{step.action}</td>
              <td>{step.weapon}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={onRunChoreography} style={{ marginTop: '1em' }}>
        Run This Choreography
      </button>
    </div>
  );
}
