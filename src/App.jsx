import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Landing from './pages/Landing.jsx';
import Welcome from './pages/Welcome.jsx';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/welcome" element={<Welcome />} />
      </Routes>
    </Router>
  );
}
