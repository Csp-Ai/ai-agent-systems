import { usePersona } from './PersonaContext';

export default function PersonaDashboard() {
  const { role } = usePersona();

  const recommendations = {
    Marketing: ['trend-analysis-agent', 'content-strategy-agent'],
    Developer: ['API keys', 'agent registry tools'],
    'Product/Strategy': ['roadmap-agent', 'competitive-intel-agent'],
    'Small Business': ['cost-saver-agent', 'customer-support-agent'],
    'Just Exploring': ['demo-agent']
  };

  if (!role) return <div className="p-4">Welcome!</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Welcome, {role}!</h1>
      {recommendations[role] && (
        <div>
          <h2 className="font-semibold mb-2">Recommended Agents</h2>
          <ul className="list-disc pl-5">
            {recommendations[role].map(r => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
