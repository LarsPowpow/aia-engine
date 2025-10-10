import React from 'react';

const InspectorModal = ({ isOpen, onClose }) => {
  // If the modal is not open, render nothing.
  if (!isOpen) {
    return null;
  }

  return (
    // The modal backdrop, which covers the entire screen. Clicking it will close the modal.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70"
      onClick={onClose}
    >
      {/* The modal panel itself. stopPropagation prevents clicks inside the panel from closing it. */}
      <div
        className="bg-gray-800 border border-sky-500/50 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-2xl font-semibold text-sky-300">
            Object Inspector
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
            {/* Full JSON data will be rendered here in Phase 4 */}
            Data will appear here...
          </pre>
        </div>
      </div>
    </div>
  );
};

export default InspectorModal;
