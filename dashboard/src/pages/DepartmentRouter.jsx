import { useParams, useNavigate } from 'react-router-dom';
import AgentDepartmentSwitcher from '../components/AgentDepartmentSwitcher';
import DepartmentDashboard from '../components/DepartmentDashboard';

export default function DepartmentRouter() {
  const { dept } = useParams();
  const navigate = useNavigate();

  return (
    <div className="p-4 space-y-4">
      <AgentDepartmentSwitcher value={dept} onChange={d => navigate(`/departments/${d}`)} />
      <DepartmentDashboard department={dept} />
    </div>
  );
}
