import React, { useEffect, useMemo, useState } from 'react';
import { Tab, Disclosure } from '@headlessui/react';
import agentMetadata from '../agents/agent-metadata.json';

export default function DocsExplorer() {
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('all');
  const [health, setHealth] = useState({});
  const [sops, setSops] = useState({});
  const [examples, setExamples] = useState({});

  useEffect(() => {
    const loadHealth = async () => {
      const targets = ['/logs/agent-health.json', '/logs/agent-benchmarks.json'];
      for (const url of targets) {
        try {
          const res = await fetch(url);
          const json = await res.json();
          if (Array.isArray(json)) {
            const map = {};
            json.forEach(entry => {
              map[entry.agent] = entry;
            });
            setHealth(map);
            break;
          }
        } catch {
          // ignore and try next
        }
      }
    };
    const loadDocs = async () => {
      const ids = Object.keys(agentMetadata);
      await Promise.all(
        ids.map(async id => {
          try {
            const res = await fetch(`/sops/${id}.md`);
            const text = await res.text();
            setSops(prev => ({ ...prev, [id]: text }));
          } catch {
            setSops(prev => ({ ...prev, [id]: 'No SOP found.' }));
          }
          try {
            const res = await fetch(`/logs/simulations/${id}.json`);
            const json = await res.json();
            setExamples(prev => ({ ...prev, [id]: json }));
          } catch {
            setExamples(prev => ({ ...prev, [id]: [] }));
          }
        })
      );
    };
    loadHealth();
    loadDocs();
  }, []);

  const departments = useMemo(
    () => [
      ...new Set(
        Object.values(agentMetadata)
          .map(a => a.category)
          .filter(Boolean)
      )
    ],
    []
  );

  const agents = useMemo(() => {
    return Object.entries(agentMetadata)
      .filter(([id, meta]) =>
        dept === 'all' ? true : meta.category === dept
      )
      .filter(([id, meta]) => {
        const text = `${meta.name} ${meta.description}`.toLowerCase();
        return text.includes(search.toLowerCase());
      });
  }, [dept, search]);

  const renderOverview = (id, meta) => {
    const h = health[id] || {};
    return (
      <div className="space-y-1 text-sm">
        <p>{meta.description}</p>
        <p>Category: {meta.category}</p>
        <p>Version: {meta.version}</p>
        {h.successRate != null && (
          <p>Success Rate: {(h.successRate * 100).toFixed(0)}%</p>
        )}
        {h.lastUsed && <p>Last Used: {new Date(h.lastUsed).toLocaleString()}</p>}
      </div>
    );
  };

  const renderSop = id => (
    <pre className="whitespace-pre-wrap text-sm bg-black/50 p-2 rounded">
      {sops[id] || 'Loading...'}
    </pre>
  );

  const renderExamples = id => {
    const ex = examples[id];
    if (!ex || !ex.length) return <p className="text-sm">No examples available.</p>;
    return (
      <div className="space-y-2 text-sm">
        {ex.map((e, idx) => (
          <div key={idx} className="p-2 bg-black/50 rounded">
            <p className="font-semibold">Input</p>
            <pre className="whitespace-pre-wrap mb-2">{JSON.stringify(e.input, null, 2)}</pre>
            <p className="font-semibold">Output</p>
            <pre className="whitespace-pre-wrap">{JSON.stringify(e.response, null, 2)}</pre>
          </div>
        ))}
      </div>
    );
  };

  const renderHistory = meta => (
    <div className="text-sm space-y-1">
      <p>Created By: {meta.createdBy || 'N/A'}</p>
      <p>Last Updated: {meta.lastUpdated || 'N/A'}</p>
      <p>Lifecycle: {meta.lifecycle || 'N/A'}</p>
    </div>
  );

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">Agent Docs Explorer</h1>
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search agents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="p-1 rounded text-black flex-1"
        />
        <select
          value={dept}
          onChange={e => setDept(e.target.value)}
          className="p-1 rounded text-black"
        >
          <option value="all">All Departments</option>
          {departments.map(d => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        {agents.map(([id, meta]) => (
          <Disclosure key={id}>
            {({ open }) => (
              <>
                <Disclosure.Button className="w-full flex justify-between bg-gray-700 px-2 py-1 rounded">
                  <span>{meta.name}</span>
                  <span>{open ? '-' : '+'}</span>
                </Disclosure.Button>
                <Disclosure.Panel className="p-2 bg-gray-800 rounded-b">
                  <Tab.Group>
                    <Tab.List className="flex space-x-1 mb-2">
                      {['Overview', 'SOP', 'Examples', 'Version History'].map(tab => (
                        <Tab
                          key={tab}
                          className={({ selected }) =>
                            `px-2 py-1 rounded text-sm ${selected ? 'bg-blue-600' : 'bg-gray-600'}`
                          }
                        >
                          {tab}
                        </Tab>
                      ))}
                    </Tab.List>
                    <Tab.Panels>
                      <Tab.Panel>{renderOverview(id, meta)}</Tab.Panel>
                      <Tab.Panel>{renderSop(id)}</Tab.Panel>
                      <Tab.Panel>{renderExamples(id)}</Tab.Panel>
                      <Tab.Panel>{renderHistory(meta)}</Tab.Panel>
                    </Tab.Panels>
                  </Tab.Group>
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        ))}
      </div>
    </div>
  );
}
