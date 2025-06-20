import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';

const OrgContext = createContext({ orgId: null, orgs: [], agents: [], setOrgId: () => {} });

export function OrgProvider({ children }) {
  const [orgId, setOrgId] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (user) {
        try {
          const snap = await getDocs(collection(db, 'users', user.uid, 'orgs'));
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setOrgs(list);
          if (list.length) setOrgId(list[0].id);
        } catch {
          setOrgs([]);
        }
      } else {
        setOrgs([]);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!orgId) { setAgents([]); return; }
    const agentsCol = collection(db, 'orgs', orgId, 'agents');
    const metaCol = collection(db, 'orgs', orgId, 'agent-metadata');
    const unsubAgents = onSnapshot(agentsCol, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (list.length) setAgents(list);
    });
    const unsubMeta = onSnapshot(metaCol, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAgents(prev => (prev.length ? prev : list));
    });
    return () => { unsubAgents(); unsubMeta(); };
  }, [orgId]);

  return (
    <OrgContext.Provider value={{ orgId, setOrgId, orgs, agents, loading }}>
      {children}
    </OrgContext.Provider>
  );
}

export const useOrg = () => useContext(OrgContext);
