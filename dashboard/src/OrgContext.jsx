import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

const OrgContext = createContext({ orgId: null, orgs: [], setOrgId: () => {} });

export function OrgProvider({ children }) {
  const [orgId, setOrgId] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <OrgContext.Provider value={{ orgId, setOrgId, orgs, loading }}>
      {children}
    </OrgContext.Provider>
  );
}

export const useOrg = () => useContext(OrgContext);
