import { useState } from 'react';

function ForgeForm({ schema, onSubmit, collectionName }) {
  const [formData, setFormData] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, collectionName);
    // Optional: clear form after submission
    // setFormData({}); 
  };

  if (!schema) {
    return <p className="text-gray-500">Please select an object type to begin.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {Object.entries(schema).map(([key, field]) => {
        const inputId = `forge-${key}`;

        if (field.type === 'textarea') {
          return (
            <div key={key}>
              <label htmlFor={inputId} className="block text-sm font-medium text-gray-300">{field.label || key}</label>
              <textarea
                id={inputId}
                name={key}
                rows={3}
                onChange={handleChange}
                className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          );
        }

        if (field.type === 'select') {
          return (
            <div key={key}>
              <label htmlFor={inputId} className="block text-sm font-medium text-gray-300">{field.label || key}</label>
              <select
                id={inputId}
                name={key}
                onChange={handleChange}
                className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="">-- Select --</option>
                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          );
        }

        // Default to text input
        return (
          <div key={key}>
            <label htmlFor={inputId} className="block text-sm font-medium text-gray-300">{field.label || key}</label>
            <input
              type={field.type || 'text'}
              id={inputId}
              name={key}
              required={field.required}
              onChange={handleChange}
              className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        );
      })}
      <button type="submit" className="mt-6 w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition">
        Forge Object
      </button>
    </form>
  );
}

export default ForgeForm;