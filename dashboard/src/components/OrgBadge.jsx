import React from 'react';

export default function OrgBadge({ code }) {
  if (!code) return null;
  return (
    <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
      {code}
    </span>
  );
}
