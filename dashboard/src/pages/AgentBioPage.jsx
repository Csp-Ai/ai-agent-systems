import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AgentBioCard from '../components/AgentBioCard';

export default function AgentBioPage() {
  const { id } = useParams();
  const [agent, setAgent] = useState(null);
  const [profile, setProfile] = useState(null);
  const [log, setLog] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/agents/agent-metadata.json').then(r => r.json()),
      fetch('/agents/metadata/agent-profiles.json').then(r => r.json())
    ])
      .then(([meta, profiles]) => {
        setAgent(meta[id]);
        setProfile(profiles[id]);
      })
      .catch(() => {});
  }, [id]);

  const loadLog = () =>
    fetch(`/logs/agent-knowledge/${id}/latest.json`)
      .then(r => r.json())
      .then(setLog)
      .catch(() => setLog(null));

  if (!agent || !profile) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      <Link to="/agents" className="text-sm underline">
        ← Back
      </Link>
      <AgentBioCard agent={agent} profile={profile} onViewLatest={loadLog} />
      {log && (
        <pre className="bg-gray-800 text-gray-100 text-xs p-2 rounded whitespace-pre-wrap overflow-auto max-h-60">
          {JSON.stringify(log, null, 2)}
        </pre>
      )}
    </div>
  );
}
