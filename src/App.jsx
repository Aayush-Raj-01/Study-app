import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AIPage from './pages/AIPage';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/roadmap" element={<AIPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;