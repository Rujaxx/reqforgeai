import './App.css';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AnalysisPage from './pages/AnalysisPage';

function App() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/project/:id" element={<AnalysisPage />} />
        <Route path="*" element={<div className="error-state">Page Not Found 404<p>Sorry, the page you are looking for could not be found.</p></div>} />
      </Routes>
  );
}

export default App;