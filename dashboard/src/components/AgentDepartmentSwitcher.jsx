import { useEffect, useState } from 'react';

export default function AgentDepartmentSwitcher({ value, onChange }) {
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetch('/agents/agent-catalog.json')
      .then(res => res.json())
      .then(data => setDepartments(Object.keys(data)))
      .catch(() => setDepartments([]));
  }, []);

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="border px-2 py-1 rounded bg-white dark:bg-gray-800">
      {departments.map(dep => (
        <option key={dep} value={dep}>
          {dep.charAt(0).toUpperCase() + dep.slice(1)}
        </option>
      ))}
    </select>
  );
}
