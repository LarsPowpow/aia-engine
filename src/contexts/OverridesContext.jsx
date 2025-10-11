// FILE: src/contexts/OverridesContext.jsx
import { createContext, useContext } from 'react';

/**
 * This context will hold the "Book of Law" - our collection of override rules.
 * It allows any component in the application to access the rules without needing
 * them to be passed down manually through every level (prop drilling).
 */
export const OverridesContext = createContext({});

/**
 * This is a custom hook that simplifies accessing the override rules.
 * Any component that needs the rules can simply call `const overrides = useOverrides();`
 * This is a clean, modern React practice.
 */
export const useOverrides = () => useContext(OverridesContext);