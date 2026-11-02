import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [apiData, setApiData] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState(null);

  useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    axios.get(apiUrl)
      .then(res => {
        setApiData(res.data);
        setStatus('connected');
      })
      .catch(err => {
        setError(err.message);
        setStatus('offline');
      });
  }, []);

  return (
    <div className="app">
      <div className="container">
        <div className="badge">🚀 CI/CD Demo for Jenkins</div>
        <h1>Hello World! Iam Kishore. </h1>
        <p className="subtitle">React + Node.js + Jenkins + Docker + Nginx</p>

        <div className={`status-card ${status}`}>
          <div className="status-indicator" />
          <span>API Status: <strong>{status.toUpperCase()}</strong></span>
        </div>

        {apiData && (
          <div className="api-card">
            <h3>📡 API Response</h3>
            <p>{apiData.message}</p>
            <div className="meta">
              <span>🕐 {new Date(apiData.timestamp).toLocaleString()}</span>
              <span>🌍 {apiData.environment}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="error-card">
            <h3>⚠️ API Offline</h3>
            <p>Running in standalone mode. Start Node.js API to connect.</p>
          </div>
        )}

        <div className="tech-stack">
          <div className="tech-item">⚛️ React</div>
          <div className="tech-item">🟢 Node.js</div>
          <div className="tech-item">🔧 Jenkins</div>
          <div className="tech-item">🐳 Docker</div>
          <div className="tech-item">🌐 Nginx</div>
          <div className="tech-item">📁 SFTP</div>
        </div>
      </div>
    </div>
  );
}

export default App;
