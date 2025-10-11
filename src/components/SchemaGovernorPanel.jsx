// FILE: src/components/SchemaGovernorPanel.jsx
import React, { useState } from 'react';
import { useSchema } from '../contexts/SchemaContext';
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

const SchemaGovernorPanel = ({ db, addLog, UKB_SCHEMAS, onSchemaChange }) => {
    const schemaExtensions = useSchema();
    const [selectedField, setSelectedField] = useState('');
    const [newCustomValue, setNewCustomValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddValue = async () => {
        if (!db || !selectedField || !newCustomValue.trim()) return;
        setIsSubmitting(true);
        const fieldKey = selectedField.split('.')[1];
        addLog('special', `Adding "${newCustomValue}" to Living Dictionary for field "${fieldKey}"...`);
        try {
            const extensionRef = doc(db, 'ukb_schema_extensions', fieldKey);
            await updateDoc(extensionRef, {
                values: arrayUnion(newCustomValue.trim())
            });
            addLog('success', `Successfully added "${newCustomValue}" to the Living Dictionary.`);
            onSchemaChange(); // Trigger a refresh of the schema data in App.jsx
        } catch (error) {
            addLog('error', `Failed to add custom value: ${error.message}`);
        } finally {
            setNewCustomValue('');
            setIsSubmitting(false);
        }
    };

    const handleDeleteValue = async (valueToDelete) => {
        if (!db || !selectedField || !valueToDelete) return;
        if (!window.confirm(`Are you sure you want to permanently delete the custom value "${valueToDelete}"?`)) return;
        
        setIsSubmitting(true);
        const fieldKey = selectedField.split('.')[1];
        addLog('special', `Deleting "${valueToDelete}" from Living Dictionary for field "${fieldKey}"...`);
        try {
            const extensionRef = doc(db, 'ukb_schema_extensions', fieldKey);
            await updateDoc(extensionRef, {
                values: arrayRemove(valueToDelete)
            });
            addLog('success', `Successfully deleted "${valueToDelete}".`);
            onSchemaChange(); // Trigger a refresh
        } catch (error) {
            addLog('error', `Failed to delete custom value: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getGovernableFields = () => {
        const fields = [];
        for (const schemaName in UKB_SCHEMAS) {
            for (const fieldName in UKB_SCHEMAS[schemaName]) {
                const field = UKB_SCHEMAS[schemaName][fieldName];
                if (field.type === 'select') { // Only 'select' fields are governable
                     fields.push({
                        id: `${schemaName}.${fieldName}`,
                        label: `${schemaName.charAt(0).toUpperCase() + schemaName.slice(1)} - ${field.label}`
                    });
                }
            }
        }
        return fields;
    };
    
    const governableFields = getGovernableFields();
    const currentCustomValues = selectedField ? (schemaExtensions[selectedField.split('.')[1]] || []) : [];

    return (
        <div className="bg-gray-800/50 p-6 rounded-lg shadow-inner border border-sky-500/30">
            <h3 className="text-2xl font-semibold text-sky-300 mb-4 border-b border-sky-500/50 pb-2">Schema Governor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* --- CONTROL PANEL --- */}
                <div className="space-y-4">
                    <div>
                        <label htmlFor="schema-select" className="block text-sm font-medium text-gray-300 mb-1">
                            Select Schema Field to Govern
                        </label>
                        <select
                            id="schema-select"
                            value={selectedField}
                            onChange={(e) => setSelectedField(e.target.value)}
                            className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                            <option value="">-- Select a Field --</option>
                            {governableFields.map(field => (
                                <option key={field.id} value={field.id}>{field.label}</option>
                            ))}
                        </select>
                    </div>
                    {selectedField && (
                         <div>
                            <label htmlFor="new-value-input" className="block text-sm font-medium text-gray-300 mb-1">
                                Add New Custom Value
                            </label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    id="new-value-input"
                                    value={newCustomValue}
                                    onChange={(e) => setNewCustomValue(e.target.value)}
                                    disabled={isSubmitting}
                                    className="w-full bg-gray-900 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-700"
                                    placeholder="e.g., DebuffTransfer"
                                />
                                <button
                                    onClick={handleAddValue}
                                    disabled={!newCustomValue.trim() || isSubmitting}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? '...' : 'Add'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- DISPLAY PANEL --- */}
                <div className="bg-gray-900/50 p-4 rounded-md border border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-300 mb-2">
                        Custom Values for: <span className="text-amber-400 font-mono">{selectedField || '...'}</span>
                    </h4>
                    <div className="h-48 overflow-y-auto pr-2">
                        {selectedField ? (
                            currentCustomValues.length > 0 ? (
                                <ul className="space-y-2">
                                    {currentCustomValues.sort().map(value => (
                                        <li key={value} className="flex items-center justify-between bg-gray-800 p-2 rounded-md">
                                            <span className="font-mono text-gray-300">{value}</span>
                                            <button
                                                onClick={() => handleDeleteValue(value)}
                                                disabled={isSubmitting}
                                                className="text-red-500 hover:text-red-400 font-bold disabled:text-gray-500 disabled:cursor-not-allowed"
                                                title={`Delete ${value}`}
                                            >
                                                X
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 italic text-center mt-4">No custom values defined for this field.</p>
                            )
                        ) : (
                            <p className="text-gray-500 italic text-center mt-4">Select a field to view its custom values.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchemaGovernorPanel;