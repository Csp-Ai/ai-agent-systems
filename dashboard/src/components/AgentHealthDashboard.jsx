import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { db } from '../firebase';
import { useOrg } from '../OrgContext';

function relativeTime(date) {
  if (!date) return '-';
  const ts = date instanceof Date ? date.getTime() : date.toDate ? date.toDate().getTime() : new Date(date).getTime();
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hrs ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function alignColor(score) {
  if (score >= 80) return 'text-green-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

async function notifySlack(agent) {
  const url = import.meta.env.VITE_SLACK_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `Agent ${agent} failed 3 times in a row` })
    });
  } catch {
    /* ignore */
  }
}

export default function AgentHealthDashboard() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { orgId } = useOrg();

  const fetchData = async () => {
    if (!orgId) return;
    setLoading(true);
    const snap = await getDocs(collection(db, 'orgs', orgId, 'agent-metadata'));
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = [];
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      let errorCount = 0;
      try {
        const logQ = query(
          collection(db, 'orgs', orgId, 'logs'),
          where('agent', '==', docSnap.id),
          where('timestamp', '>=', since)
        );
        const logSnap = await getDocs(logQ);
        errorCount = logSnap.docs.filter(d => d.data().error).length;

        const failQ = query(
          collection(db, 'orgs', orgId, 'logs'),
          where('agent', '==', docSnap.id),
          orderBy('timestamp', 'desc'),
          limit(3)
        );
        const failSnap = await getDocs(failQ);
        if (failSnap.docs.length === 3 && failSnap.docs.every(d => d.data().error)) {
          notifySlack(docSnap.id);
        }
      } catch {
        /* ignore */
      }
      result.push({ id: docSnap.id, ...data, errorCount });
    }
    setAgents(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [orgId]);

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <h2 className="text-2xl font-semibold text-white flex-1">Agent Health</h2>
        <button
          onClick={fetchData}
          className="flex items-center text-sm bg-slate-700 text-white px-3 py-1 rounded"
        >
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </button>
      </div>
      {loading ? (
        <div className="text-white">Loading...</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map(a => (
            <div key={a.id} className="bg-slate-800 rounded-xl p-4 text-white space-y-1">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{a.name || a.id}</div>
                <div className={a.status === 'online' ? 'text-green-400 flex items-center' : 'text-red-400 flex items-center'}>
                  {a.status === 'online' ? <CheckCircle className="w-4 h-4 mr-1" /> : <AlertTriangle className="w-4 h-4 mr-1" />} {a.status || 'offline'}
                </div>
              </div>
              <div className="text-sm">Last run: {relativeTime(a.lastRun)}</div>
              <div className="text-sm">
                Alignment: <span className={alignColor(a.alignmentScore)}>{a.alignmentScore != null ? `${a.alignmentScore}%` : '-'}</span>
              </div>
              <div className="text-sm">SOP v{a.sopVersion || '-'}</div>
              <div className="text-sm">Errors (24h): {a.errorCount}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

