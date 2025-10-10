import React from 'react';

const InspectorModal = ({ isOpen, onClose, item }) => {
  // If the modal is not open, render nothing.
  if (!isOpen) {
    return null;
  }

  // Determine the title from the item's data, with fallbacks.
  const title = item ? `Inspector: ${item.name || item.ability_id || item.effect_id || item.id}` : 'Object Inspector';

  // Render the modal structure.
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 border border-sky-500/50 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-2xl font-semibold text-sky-300">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl leading-none"
          >
            &times;
          </button>
        </div>
        {/* Modal Body */}
        <div className="p-4 overflow-y-auto">
          <pre className="text-sky-300 whitespace-pre-wrap">
            {/* Render the formatted JSON if an item is selected, otherwise show a message. */}
            {item ? JSON.stringify(item, null, 2) : 'Awaiting data...'}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default InspectorModal;