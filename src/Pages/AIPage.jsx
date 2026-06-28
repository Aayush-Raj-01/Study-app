import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const CustomNode = ({ data, isConnectable }) => {
  return (
    <>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <div className="node-label">{data.label}</div>
      {data.links && data.links.length > 0 && (
        <div className="node-links">
          {data.links.map((link, idx) => (
            <a 
              key={idx} 
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(link.query || link.title)}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="node-link-btn"
              onClick={(e) => e.stopPropagation()}
            >
              {link.title}
            </a>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </>
  );
};

const nodeTypes = { customNode: CustomNode };

const AIPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loadingText, setLoadingText] = useState('Generating your custom roadmap...');

  // Load from local storage if ID is present
  useEffect(() => {
    if (id) {
      const saved = localStorage.getItem('study_roadmaps');
      if (saved) {
        const roadmaps = JSON.parse(saved);
        const current = roadmaps.find(r => r.id === id);
        if (current) {
          setSubject(current.subject);
          setNodes(current.nodes);
          setEdges(current.edges);
        }
      }
    }
  }, [id, setNodes, setEdges]);

  // Persist node changes (like completing a step)
  useEffect(() => {
    if (nodes.length > 0 && id) {
      const saved = localStorage.getItem('study_roadmaps');
      if (saved) {
        const roadmaps = JSON.parse(saved);
        const idx = roadmaps.findIndex(r => r.id === id);
        if (idx !== -1) {
          roadmaps[idx].nodes = nodes;
          localStorage.setItem('study_roadmaps', JSON.stringify(roadmaps));
        }
      }
    }
  }, [nodes, id]);

  useEffect(() => {
    if (!loading) {
      setLoadingText('Generating your custom roadmap...');
      return;
    }
    
    const messages = [
      'Generating your custom roadmap...',
      'Working on it...',
      'Fetching the database for best results...',
      'Almost there...',
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % messages.length;
      setLoadingText(messages[idx]);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [loading]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((event, node) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === node.id) {
          const isCompleted = !n.data.completed;
          return {
            ...n,
            data: {
              ...n.data,
              completed: isCompleted,
            },
            className: isCompleted ? 'node-completed' : '',
          };
        }
        return n;
      })
    );
  }, [setNodes]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!subject.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      // Note: in a real production environment, this URL would be relative or via an env var
      const response = await axios.post('http://localhost:3001/api/generate-roadmap', {
        subject: subject
      });

      const data = response.data;
      if (data.nodes && data.edges) {
        setNodes(data.nodes);
        setEdges(data.edges);

        const newRoadmap = {
          id: Date.now().toString(),
          subject: subject,
          nodes: data.nodes,
          edges: data.edges,
          timestamp: new Date().toISOString()
        };
        const existing = localStorage.getItem('study_roadmaps');
        let roadmaps = [];
        if (existing) {
          try {
            roadmaps = JSON.parse(existing);
          } catch (e) {
            console.error("Local storage corrupted, resetting", e);
            roadmaps = [];
          }
        }
        roadmaps.push(newRoadmap);
        try {
          localStorage.setItem('study_roadmaps', JSON.stringify(roadmaps));
        } catch (e) {
          console.error("Failed to save to local storage", e);
        }
        
        navigate(`/roadmap?id=${newRoadmap.id}`, { replace: true });
      } else {
        setError('Received invalid data format from the server.');
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to generate roadmap. Make sure the backend server is running and the API key is valid.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <nav style={styles.navbar}>
        <div style={styles.logo} onClick={() => navigate('/')} className="cursor-pointer">
          <span style={{ color: 'var(--primary-green)' }}>Study</span>Sync
        </div>
      </nav>

      <div style={styles.content}>
        <div style={styles.inputSection}>
          <h2 style={styles.heading}>What do you want to master today?</h2>
          <form onSubmit={handleGenerate} style={styles.form}>
            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. UPSC, JEE, React, Quantum Physics"
              style={styles.input}
            />
            <button 
              type="submit" 
              style={styles.button}
              disabled={loading}
              onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
              onMouseOut={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
            >
              {loading ? 'Generating...' : 'Generate Map'}
            </button>
          </form>
          {error && <p style={styles.error}>{error}</p>}
        </div>

        <div style={styles.flowContainer}>
          {loading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <div className="loading-text">{loadingText}</div>
            </div>
          )}
          
          {nodes.length === 0 && !loading ? (
            <div style={styles.emptyState}>
              <p>Your interactive roadmap will appear here.</p>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={true}
              fitView
              colorMode="dark"
            >
              <Controls />
              <MiniMap 
                nodeStrokeColor={(n) => '#00ff88'}
                nodeColor={(n) => '#1e1e1e'}
              />
              <Background variant="dots" gap={12} size={1} />
            </ReactFlow>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  navbar: {
    padding: '1.5rem 5%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    background: 'var(--bg-darker)',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    cursor: 'pointer',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '2rem 5%',
    gap: '2rem',
  },
  inputSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  heading: {
    fontSize: '2rem',
    color: 'var(--text-main)',
  },
  form: {
    display: 'flex',
    width: '100%',
    maxWidth: '600px',
    gap: '1rem',
  },
  input: {
    flex: 1,
    padding: '1rem 1.5rem',
    borderRadius: '50px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-card)',
    color: 'var(--text-main)',
    fontSize: '1.1rem',
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  button: {
    background: 'var(--primary-green)',
    color: 'var(--bg-darker)',
    border: 'none',
    padding: '0 2rem',
    fontSize: '1.1rem',
    fontWeight: '600',
    borderRadius: '50px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  error: {
    color: '#ff4444',
    fontSize: '0.9rem',
    marginTop: '0.5rem',
  },
  flowContainer: {
    flex: 1,
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    overflow: 'hidden',
    position: 'relative',
    background: 'var(--bg-darker)',
  },
  emptyState: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: 'var(--text-muted)',
    fontSize: '1.2rem',
  }
};

export default AIPage;
