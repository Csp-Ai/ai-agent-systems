import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export default function DevAgentLogSimulator() {
  if (process.env.NODE_ENV === 'production') return null;

  const [orgId, setOrgId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [agentId, setAgentId] = useState('');
  const [message, setMessage] = useState('');
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    const savedSession = localStorage.getItem('sessionId');
    if (savedSession) setSessionId(savedSession);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'agent-metadata'), snap => {
      setAgents(snap.docs.map(d => d.id));
    });
    return unsub;
  }, []);

  const pushLog = async () => {
    if (!orgId || !sessionId || !agentId || !message) return;
    await addDoc(collection(db, 'orgs', orgId, 'logs', sessionId), {
      agent: agentId,
      output: message,
      timestamp: new Date().toISOString(),
    });
    setMessage('');
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Org ID"
        value={orgId}
        onChange={e => setOrgId(e.target.value)}
        className="w-full p-1 rounded text-black"
      />
      <input
        type="text"
        placeholder="Session ID"
        value={sessionId}
        onChange={e => setSessionId(e.target.value)}
        className="w-full p-1 rounded text-black"
      />
      <select
        value={agentId}
        onChange={e => setAgentId(e.target.value)}
        className="w-full p-1 rounded text-black"
      >
        <option value="">Select agent</option>
        {agents.map(a => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        rows={3}
        className="w-full p-1 rounded text-black"
      />
      <button onClick={pushLog} className="bg-blue-500 text-white px-2 py-1 rounded">
        Push Log
      </button>
    </div>
  );
}
