import './App.css';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AnalysisPage from './pages/AnalysisPage';

function App() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/project/:id" element={<AnalysisPage />} />
      </Routes>
  );
}

export default App;