import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('study_roadmaps');
    if (saved) {
      try {
        setHistory(JSON.parse(saved).reverse());
      } catch (e) {
        console.error("Local storage corrupted", e);
        localStorage.removeItem('study_roadmaps');
      }
    }
  }, []);

  return (
    <div style={styles.container} className="animate-fade-in">
      <nav style={styles.navbar}>
        <div style={styles.logo}>
          <span style={{ color: 'var(--primary-green)' }}>Study</span>Sync
        </div>
      </nav>

      <main style={styles.main}>
        <div style={styles.heroGlow}></div>
        
        <h1 style={styles.title}>
          Master Any Subject with <br/>
          <span style={{ color: 'var(--primary-green)' }}>AI-Powered Roadmaps</span>
        </h1>
        
        <p style={styles.subtitle}>
          Stop wondering where to start. Tell us what you want to learn, and we'll generate a comprehensive, step-by-step visual learning path customized just for you.
        </p>

        <button 
          style={styles.button}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 10px 20px var(--primary-green-dim)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
          }}
          onClick={() => navigate('/roadmap')}
        >
          Generate Your Roadmap
          <svg style={styles.arrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>

        <div style={styles.features}>
          <div style={styles.featureCard}>
            <h3 style={styles.featureTitle}>Personalized Paths</h3>
            <p style={styles.featureDesc}>Tailored specifically for subjects like UPSC, JEE, NEET, or coding.</p>
          </div>
          <div style={styles.featureCard}>
            <h3 style={styles.featureTitle}>Visual Learning</h3>
            <p style={styles.featureDesc}>Interactive 2D diagrams that make complex subjects easy to digest.</p>
          </div>
          <div style={styles.featureCard}>
            <h3 style={styles.featureTitle}>Instant Generation</h3>
            <p style={styles.featureDesc}>Powered by cutting-edge AI to give you results in seconds.</p>
          </div>
        </div>

        {history.length > 0 && (
          <div style={{ marginTop: '4rem', width: '100%', maxWidth: '1000px' }}>
            <h2 style={{ color: 'var(--text-main)', fontSize: '2rem' }}>Your Recent Roadmaps</h2>
            <div className="history-grid">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  className="history-card"
                  onClick={() => navigate(`/roadmap?id=${item.id}`)}
                >
                  <h3 className="history-card-title">{item.subject}</h3>
                  <p className="history-card-date">
                    {new Date(item.timestamp).toLocaleDateString()} - {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  navbar: {
    padding: '2rem 5%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: '800',
    letterSpacing: '-0.5px',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 5%',
    textAlign: 'center',
    position: 'relative',
    zIndex: 10,
    marginTop: '2rem',
  },
  heroGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    height: '600px',
    background: 'radial-gradient(circle, var(--primary-green-dim) 0%, transparent 70%)',
    zIndex: -1,
    pointerEvents: 'none',
  },
  title: {
    fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
    lineHeight: '1.1',
    marginBottom: '1.5rem',
    letterSpacing: '-1px',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: 'var(--text-muted)',
    maxWidth: '600px',
    marginBottom: '2.5rem',
    lineHeight: '1.6',
  },
  button: {
    background: 'var(--primary-green)',
    color: 'var(--bg-darker)',
    border: 'none',
    padding: '1rem 2rem',
    fontSize: '1.1rem',
    fontWeight: '600',
    borderRadius: '50px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
  },
  arrow: {
    transition: 'transform 0.3s ease',
  },
  features: {
    display: 'flex',
    gap: '2rem',
    marginTop: '5rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingBottom: '3rem',
  },
  featureCard: {
    background: 'var(--bg-card)',
    padding: '2rem',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
    width: '280px',
    textAlign: 'left',
    transition: 'transform 0.3s ease, border-color 0.3s ease',
  },
  featureTitle: {
    fontSize: '1.2rem',
    marginBottom: '0.5rem',
    color: 'var(--primary-green)',
  },
  featureDesc: {
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
    lineHeight: '1.5',
  }
};

export default Home;
