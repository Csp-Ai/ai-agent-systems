import React from 'react';

export default function Sidebar({ items = [], current, onSelect }) {
  return (
    <aside className="w-40 bg-gray-200 dark:bg-gray-800 p-4 space-y-2 flex-shrink-0">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={`block w-full text-left px-2 py-1 rounded text-sm ${
            current === item.id
              ? 'bg-gray-300 dark:bg-gray-700'
              : 'hover:bg-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          {item.label}
        </button>
      ))}
    </aside>
  );
}
