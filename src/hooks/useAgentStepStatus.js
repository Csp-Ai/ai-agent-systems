import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase.js';

export default function useAgentStepStatus(userId, flowId, agentName) {
  const [data, setData] = useState({ status: 'waiting' });

  useEffect(() => {
    if (!userId || !flowId || !agentName) return;

    // Firestore not available - fallback demo mode
    if (!db || !db.app) {
      setData({ status: 'waiting' });
      const t1 = setTimeout(() => setData({ status: 'running' }), 1000);
      const t2 = setTimeout(
        () => setData({ status: 'complete', output: 'Preview output' }),
        3000
      );
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    const ref = doc(db, 'flows', userId, flowId, 'steps', agentName);
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) setData(snap.data());
    });
    return unsub;
  }, [userId, flowId, agentName]);

  return {
    status: data.status || 'waiting',
    data
  };
}
