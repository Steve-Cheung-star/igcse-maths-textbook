import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function AIGenerator({ topic, difficulty = "IGCSE Core" }) {
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // New state to prevent saving the same question multiple times
  const [hasSaved, setHasSaved] = useState(false);

  // Helper function to save to localStorage
  const saveToHistory = (problemText, solutionText) => {
    try {
      const existingHistory = JSON.parse(localStorage.getItem('igcse_ai_history') || '[]');
      const newRecord = {
        id: crypto.randomUUID(), // Creates a unique ID
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        topic: topic,
        difficulty: difficulty,
        question: problemText,
        studentAnswer: "N/A (Self-graded)", // Since there is no input field yet
        feedback: solutionText,
        bookmarked: false
      };
      
      const updatedHistory = [newRecord, ...existingHistory];
      localStorage.setItem('igcse_ai_history', JSON.stringify(updatedHistory));
    } catch (err) {
      console.error("Failed to save to history:", err);
    }
  };

  const generateProblem = async () => {
    setLoading(true);
    setProblem('');
    setSolution('');
    setError(null);
    setHasSaved(false); // Reset the save state for the new question
    
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

      // Split the AI response and strip out accidental Markdown code block indentations
      const parts = text.split('SOLUTION:');
      const problemPart = parts[0].replace('PROBLEM:', '').replace(/^[ \t]+/gm, '').trim();
      const solutionPart = parts[1] ? parts[1].replace(/^[ \t]+/gm, '').trim() : 'Solution not provided by AI.';

      setProblem(problemPart);
      setSolution(solutionPart);

    } catch (err) {
      console.error("Connection Error:", err);
      setError('Error connecting to the math server. Make sure your server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Triggers when the <details> tag is opened or closed
  const handleReveal = (e) => {
    // Only save if it is opening, and hasn't been saved yet
    if (e.target.open && !hasSaved) {
      saveToHistory(problem, solution);
      setHasSaved(true);
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
      {/* ADD THIS STYLE BLOCK TO FORCE TEXT WRAPPING */}
      <style>{`
        .math-renderer pre {
          white-space: pre-wrap !important;
          word-break: break-word !important;
          overflow-x: auto;
        }
      `}</style>
      
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
        <details 
          onToggle={handleReveal}
          style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            backgroundColor: 'var(--sl-color-gray-6)', 
            borderRadius: '4px',
            borderLeft: '4px solid var(--sl-color-success)',
            position: 'relative'
          }}
        >
          <summary style={{ 
            cursor: 'pointer', 
            fontWeight: 'bold', 
            color: 'var(--sl-color-success-high)' 
          }}>
            Show Step-by-Step Solution
          </summary>
          
          {hasSaved && (
            <span style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              fontSize: '0.75rem',
              backgroundColor: 'var(--sl-color-success-low)',
              color: 'var(--sl-color-success-high)',
              padding: '0.2rem 0.5rem',
              borderRadius: '999px',
              fontWeight: 'bold'
            }}>
              ✓ Saved to History
            </span>
          )}

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