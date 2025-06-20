import React, { useState, useEffect } from 'react';
import { Tab, Disclosure } from '@headlessui/react';
import { Settings, X } from 'lucide-react';
import {
  collection,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function DevToolsPanel() {
  const [open, setOpen] = useState(false);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    setAdmin(window.admin === true);
  }, []);

  const [metadata, setMetadata] = useState([]);
  const [logs, setLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [agents, setAgents] = useState([]);

  const [logMsg, setLogMsg] = useState('');
  const [logAgent, setLogAgent] = useState('');

  const [sop, setSop] = useState('');
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!admin) return;
    const unsubMeta = onSnapshot(collection(db, 'agent-metadata'), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMetadata(data);
      setAgents(data.map(d => d.id));
    });
    const unsubLogs = onSnapshot(
      query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(20)),
      snap => setLogs(snap.docs.map(d => d.data()))
    );
    const unsubSessions = onSnapshot(collection(db, 'sessions'), snap => {
      setSessions(snap.docs.map(d => d.data()));
    });
    const unsubPaused = onSnapshot(doc(db, 'settings', 'runtime'), snap => {
      setPaused(Boolean(snap.data()?.paused));
    });
    getDoc(doc(db, 'sops', 'main')).then(d => setSop(d.data()?.markdown || ''));
    return () => {
      unsubMeta();
      unsubLogs();
      unsubSessions();
      unsubPaused();
    };
  }, [admin]);

  const submitLog = async () => {
    if (!logMsg || !logAgent) return;
    await addDoc(collection(db, 'logs'), {
      agent: logAgent,
      output: logMsg,
      timestamp: new Date().toISOString()
    });
    setLogMsg('');
  };

  const saveSop = async () => {
    await setDoc(doc(db, 'sops', 'main'), { markdown: sop }, { merge: true });
  };

  const togglePaused = async () => {
    await setDoc(doc(db, 'settings', 'runtime'), { paused: !paused }, { merge: true });
  };

  if (!admin) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="bg-gray-800 text-white p-2 rounded-full shadow"
        >
          <Settings className="w-5 h-5" />
        </button>
      )}
      {open && (
        <div className="bg-white text-black dark:bg-gray-800 dark:text-white w-80 h-[80vh] rounded-lg shadow-lg flex flex-col">
          <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold">Dev Tools</h3>
            <button onClick={() => setOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <Tab.Group as="div" className="flex-1 flex flex-col">
            <Tab.List className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1">
              {['Firestore', 'Sim Logs', 'SOP', 'Control'].map(tab => (
                <Tab
                  key={tab}
                  className={({ selected }) =>
                    classNames(
                      'w-full py-1 text-sm leading-5 font-medium rounded',
                      selected
                        ? 'bg-white dark:bg-gray-900 shadow'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-white/[0.12]'
                    )
                  }
                >
                  {tab}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels className="flex-1 overflow-auto p-2">
              <Tab.Panel>
                {[
                  { title: 'agent-metadata', data: metadata },
                  { title: 'logs', data: logs },
                  { title: 'sessions', data: sessions }
                ].map(section => (
                  <Disclosure key={section.title} defaultOpen={false}>
                    {({ open }) => (
                      <>
                        <Disclosure.Button className="w-full flex justify-between px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded mt-1">
                          <span>{section.title}</span>
                          <span>{open ? '-' : '+'}</span>
                        </Disclosure.Button>
                        <Disclosure.Panel className="p-2 text-xs whitespace-pre-wrap break-all bg-gray-50 dark:bg-gray-900 rounded mb-2">
                          <pre>{JSON.stringify(section.data, null, 2)}</pre>
                        </Disclosure.Panel>
                      </>
                    )}
                  </Disclosure>
                ))}
              </Tab.Panel>
              <Tab.Panel className="space-y-2">
                <select
                  value={logAgent}
                  onChange={e => setLogAgent(e.target.value)}
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
                  value={logMsg}
                  onChange={e => setLogMsg(e.target.value)}
                  rows={3}
                  className="w-full p-1 rounded text-black"
                />
                <button onClick={submitLog} className="bg-blue-500 text-white px-2 py-1 rounded">
                  Add Log
                </button>
              </Tab.Panel>
              <Tab.Panel className="space-y-2">
                <textarea
                  value={sop}
                  onChange={e => setSop(e.target.value)}
                  rows={10}
                  className="w-full p-1 rounded text-black"
                />
                <button onClick={saveSop} className="bg-blue-500 text-white px-2 py-1 rounded">
                  Save SOP
                </button>
              </Tab.Panel>
              <Tab.Panel className="space-y-2">
                <p>Agent execution is currently {paused ? 'paused' : 'active'}.</p>
                <button onClick={togglePaused} className="bg-blue-500 text-white px-2 py-1 rounded">
                  {paused ? 'Resume' : 'Pause'}
                </button>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      )}
    </div>
  );
}
