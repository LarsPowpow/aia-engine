// FILE: src/components/OverrideModal.jsx
import React, { useState, useEffect } from 'react';

const OverrideModal = ({ isOpen, onClose, onSubmit, fieldLabel, allOptions = [] }) => {
    const [selectedValue, setSelectedValue] = useState('');
    const [newCustomValue, setNewCustomValue] = useState('');
    const [isAddingNew, setIsAddingNew] = useState(false);

    useEffect(() => {
        // Reset state when the modal is opened
        if (isOpen) {
            setSelectedValue('');
            setNewCustomValue('');
            setIsAddingNew(false);
        }
    }, [isOpen]);

    const handleSelectionChange = (e) => {
        const value = e.target.value;
        if (value === '--ADD_NEW--') {
            setIsAddingNew(true);
            setSelectedValue(value);
        } else {
            setIsAddingNew(false);
            setSelectedValue(value);
        }
    };

    const handleConfirm = () => {
        if (isAddingNew) {
            if (newCustomValue.trim()) {
                onSubmit(newCustomValue.trim());
            }
        } else {
            if (selectedValue) {
                onSubmit(selectedValue);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-purple-500/50 w-full max-w-md">
                <h2 className="text-xl font-semibold text-purple-300 mb-4">Create Override Rule</h2>
                <p className="text-gray-400 mb-2">You are creating a permanent override for the field:</p>
                <p className="text-amber-400 font-mono text-lg mb-6 bg-gray-900 p-2 rounded-md text-center">{fieldLabel}</p>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="type-select" className="block text-sm font-medium text-gray-300 mb-1">
                            Select an existing value or add a new one:
                        </label>
                        <select
                            id="type-select"
                            value={selectedValue}
                            onChange={handleSelectionChange}
                            className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">-- Select a value --</option>
                            {allOptions.sort().map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                            <option value="--ADD_NEW--" className="text-amber-400 font-bold">... Add New Custom Type ...</option>
                        </select>
                    </div>

                    {isAddingNew && (
                        <div>
                            <label htmlFor="new-type-input" className="block text-sm font-medium text-gray-300 mb-1">
                                New Custom Value:
                            </label>
                            <input
                                type="text"
                                id="new-type-input"
                                value={newCustomValue}
                                onChange={(e) => setNewCustomValue(e.target.value)}
                                className="w-full bg-gray-900 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                placeholder="e.g., UncappedDmgBoost"
                            />
                        </div>
                    )}
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isAddingNew ? !newCustomValue.trim() : !selectedValue}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        Confirm Override
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OverrideModal;