// FILE: src/contexts/SchemaContext.jsx
import { createContext, useContext } from 'react';

/**
 * This context will hold the "Living Dictionary" - our collection of custom
 * schema extensions (e.g., custom 'type' or 'target' values).
 * It allows any component to access our evolving language without prop drilling.
 */
export const SchemaContext = createContext({});

/**
 * This is a custom hook that simplifies accessing the schema extensions.
 * Any component that needs the dictionary can simply call `const schemas = useSchema();`
 */
export const useSchema = () => useContext(SchemaContext);