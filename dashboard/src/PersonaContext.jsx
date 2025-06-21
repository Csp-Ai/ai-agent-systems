import { createContext, useContext, useEffect, useState } from 'react';

const PersonaContext = createContext({ role: null });

export function PersonaProvider({ children }) {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const uid = localStorage.getItem('uid');
    if (!uid) return;
    fetch(`/api/persona?uid=${uid}`)
      .then(res => res.json())
      .then(data => setRole(data.role))
      .catch(() => setRole(null));
  }, []);

  return (
    <PersonaContext.Provider value={{ role }}>
      {children}
    </PersonaContext.Provider>
  );
}

export const usePersona = () => useContext(PersonaContext);
