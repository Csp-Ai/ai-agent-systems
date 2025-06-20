import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export default function AgentUptimeTimeline({ agentId, orgId }) {
  const [segments, setSegments] = useState(Array(24).fill(false));

  useEffect(() => {
    async function fetchLogs() {
      if (!agentId || !orgId) return;
      try {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const q = query(
          collection(db, 'orgs', orgId, 'logs'),
          where('agent', '==', agentId),
          where('timestamp', '>=', since),
          orderBy('timestamp', 'asc')
        );
        const snap = await getDocs(q);
        const logs = snap.docs.map(d => d.data());
        const segs = Array(24).fill(false);
        const now = Date.now();
        logs.forEach(log => {
          const t = log.timestamp instanceof Date
            ? log.timestamp.getTime()
            : log.timestamp?.toDate
              ? log.timestamp.toDate().getTime()
              : new Date(log.timestamp).getTime();
          const diffHours = Math.floor((now - t) / 3600000);
          if (diffHours >= 0 && diffHours < 24) {
            segs[23 - diffHours] = true;
          }
        });
        setSegments(segs);
      } catch {
        // ignore errors
      }
    }
    fetchLogs();
  }, [agentId, orgId]);

  const width = 8;
  const height = 20;

  return (
    <svg width={width * 24} height={height} className="block">
      {segments.map((online, idx) => (
        <rect
          key={idx}
          x={idx * width}
          y={0}
          width={width - 1}
          height={height}
          className={online ? 'fill-green-500' : 'fill-red-500'}
        />
      ))}
    </svg>
  );
}
