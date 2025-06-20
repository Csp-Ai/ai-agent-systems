import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function MisalignmentProposalsPanel() {
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'guardian', 'proposals'), snap => {
      const data = snap.data() || {};
      const list = data.proposals || data.list || [];
      setProposals(Array.isArray(list) ? list : Object.values(list));
    });
    return unsub;
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Misalignment Proposals</h2>
      <ul className="space-y-2">
        {proposals.map((p, idx) => (
          <li key={idx} className="bg-white/50 dark:bg-white/10 p-3 rounded">
            <div className="font-semibold">{p.agent || p.name}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300">{p.action || p.suggestion}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
