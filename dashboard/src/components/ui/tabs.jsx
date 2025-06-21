import { createContext, useContext, useState } from 'react';

const TabsContext = createContext();

export function Tabs({ defaultValue, children }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      {children}
    </TabsContext.Provider>
  );
}

export function TabsList({ children }) {
  return <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">{children}</div>;
}

export function TabsTrigger({ value, children }) {
  const { value: active, setValue } = useContext(TabsContext);
  const activeCls = active === value ? 'border-blue-600 text-blue-600' : 'border-transparent';
  return (
    <button className={`px-3 py-1 -mb-px border-b-2 ${activeCls}`} onClick={() => setValue(value)}>
      {children}
    </button>
  );
}

export function TabsContent({ value, children }) {
  const { value: active } = useContext(TabsContext);
  if (active !== value) return null;
  return <div>{children}</div>;
}
