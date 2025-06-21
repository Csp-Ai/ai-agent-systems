import { useState } from 'react';
import { motion } from 'framer-motion';

export default function AgentBioCard({ agent, profile, onViewLatest }) {
  const [refreshing, setRefreshing] = useState(false);

  const handle = async () => {
    setRefreshing(true);
    await (onViewLatest && onViewLatest());
    setRefreshing(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded shadow p-4 space-y-3">
      <div className="flex items-center gap-4">
        <img
          src={`https://robohash.org/${agent.id}.png?size=80x80`}
          alt="avatar"
          className="w-20 h-20 rounded-full"
        />
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{agent.name || agent.id}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {profile.phdField}, {profile.university}
          </p>
        </div>
        {refreshing && (
          <motion.span
            className="text-xs bg-green-600 text-white px-2 py-1 rounded"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          >
            Active Thinker
          </motion.span>
        )}
      </div>
      <div className="text-sm space-y-1">
        <div>
          <b>Thesis:</b> {profile.thesisTitle}
        </div>
        <div>
          <b>Domains:</b> {profile.coreKnowledgeDomains.join(', ')}
        </div>
      </div>
      <button
        onClick={handle}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded"
      >
        View Latest Learnings
      </button>
    </div>
  );
}
