import AgentNetworkMap from '../components/AgentNetworkMap';

export default function FounderInsights() {
  const agents = ['forecast-agent', 'trends-agent', 'ops-agent', 'sales-agent'];
  return (
    <div className="p-4 h-full">
      <AgentNetworkMap agents={agents} devMode={true} frozen={false} />
    </div>
  );
}
