import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function AIGenerator({ topic, difficulty = "IGCSE Core" }) {
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateProblem = async () => {
    setLoading(true);
    setProblem('');
    setSolution('');
    setError(null);
    
    try {
      // We call our internal API route instead of Google directly
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, difficulty }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate problem');
      }

      const text = data.text;

      // Split the AI response into Problem and Solution sections
      const parts = text.split('SOLUTION:');
      const problemPart = parts[0].replace('PROBLEM:', '').trim();
      const solutionPart = parts[1] ? parts[1].trim() : 'Solution not provided by AI.';

      setProblem(problemPart);
      setSolution(solutionPart);

    } catch (err) {
      console.error("Connection Error:", err);
      setError('Error connecting to the math server. Make sure your server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      border: '1px solid var(--sl-color-gray-5)', 
      padding: '1.5rem', 
      borderRadius: '8px', 
      marginTop: '2rem',
      backgroundColor: 'var(--sl-color-bg-nav)',
      boxShadow: 'var(--sl-shadow-sm)'
    }}>
      <h3 style={{ marginTop: 0, color: 'var(--sl-color-white)' }}>🤖 AI Practice Generator</h3>
      <p style={{ color: 'var(--sl-color-gray-3)', fontSize: '0.9rem' }}>
        Topic: <strong>{topic}</strong> | Level: <strong>{difficulty}</strong>
      </p>
      
      <button 
        onClick={generateProblem} 
        disabled={loading}
        style={{ 
          padding: '0.6rem 1.2rem', 
          cursor: loading ? 'wait' : 'pointer', 
          backgroundColor: 'var(--sl-color-accent-high)', 
          color: 'var(--sl-color-black)', 
          border: 'none', 
          borderRadius: '4px',
          fontWeight: 'bold',
          transition: 'opacity 0.2s',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Crunching Numbers...' : 'Generate New Problem'}
      </button>

      {error && (
        <p style={{ color: 'var(--sl-color-error)', marginTop: '1rem', fontSize: '0.9rem' }}>
          {error}
        </p>
      )}

      {problem && (
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          backgroundColor: 'var(--sl-color-gray-6)', 
          borderRadius: '4px',
          borderLeft: '4px solid var(--sl-color-accent)'
        }}>
          <strong style={{ color: 'var(--sl-color-white)', display: 'block', marginBottom: '0.5rem' }}>Question:</strong>
          <div className="math-renderer">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {problem}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {solution && (
        <details style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          backgroundColor: 'var(--sl-color-gray-6)', 
          borderRadius: '4px',
          borderLeft: '4px solid var(--sl-color-success)'
        }}>
          <summary style={{ 
            cursor: 'pointer', 
            fontWeight: 'bold', 
            color: 'var(--sl-color-success-high)' 
          }}>
            Show Step-by-Step Solution
          </summary>
          <div style={{ marginTop: '1rem' }} className="math-renderer">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {solution}
            </ReactMarkdown>
          </div>
        </details>
      )}
    </div>
  );
}