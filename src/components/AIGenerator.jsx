import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function AIGenerator({ topic, difficulty = "IGCSE Extended" }) {
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [error, setError] = useState(null);
  const [hasSaved, setHasSaved] = useState(false);

  // The "Feedback" messages to show during generation
  const statusMessages = [
    "Connecting to Math Engine...",
    "Analyzing IGCSE Syllabus...",
    "Generating random variables...",
    "Hardening the difficulty...",
    "Formatting LaTeX expressions...",
    "Almost there..."
  ];

  // Cycle through messages while loading
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setStatusIndex((prev) => (prev + 1) % statusMessages.length);
      }, 1500);
    } else {
      setStatusIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const saveToHistory = (problemText, solutionText) => {
    try {
      const existingHistory = JSON.parse(localStorage.getItem('igcse_ai_history') || '[]');
      const newRecord = {
        id: crypto.randomUUID(),
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        topic, difficulty, question: problemText, feedback: solutionText,
      };
      localStorage.setItem('igcse_ai_history', JSON.stringify([newRecord, ...existingHistory]));
    } catch (err) { console.error(err); }
  };

  const generateProblem = async () => {
    setLoading(true); setProblem(''); setSolution(''); setError(null); setHasSaved(false);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const parts = data.text.split('SOLUTION:');
      setProblem(parts[0].replace('PROBLEM:', '').trim());
      setSolution(parts[1] ? parts[1].trim() : 'Solution unavailable.');
    } catch (err) { setError('Connection timed out. Retrying...'); } 
    finally { setLoading(false); }
  };

  return (
    <div className="ai-container-card">
      <style>{`
        .ai-container-card {
          margin: 3rem 0;
          border: 1px solid var(--sl-color-gray-5);
          border-radius: 12px;
          background-color: var(--sl-color-bg-nav);
          overflow: hidden;
          box-shadow: var(--sl-shadow-md);
        }

        .ai-card-header {
          padding: 0.8rem 1.25rem;
          background: var(--sl-color-gray-6);
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--sl-color-gray-5);
        }

        .ai-badge {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
          color: var(--sl-color-accent-high);
          border: 1px solid var(--sl-color-accent-low);
        }

        .ai-card-body { padding: 1.5rem; }

        .ai-btn-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          gap: 1rem;
        }

        .ai-refresh-btn {
          background: var(--sl-color-accent);
          color: var(--sl-color-black);
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          min-width: 140px;
        }

        .ai-refresh-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* THE FEEDBACK LOADER */
        .ai-loader-container {
          flex-grow: 1;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: 0.85rem;
          color: var(--sl-color-gray-3);
        }

        .ai-pulse-dot {
          width: 8px; height: 8px;
          background-color: var(--sl-color-accent);
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.4; }
          100% { transform: scale(0.9); opacity: 1; }
        }

        .ai-content-inner {
          background: var(--sl-color-gray-6);
          border-radius: 8px;
          padding: 1.5rem;
          border-left: 4px solid var(--sl-color-accent);
          animation: slideIn 0.4s ease-out;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ai-solution-summary {
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--sl-color-success-high);
          list-style: none;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px dashed var(--sl-color-gray-5);
        }

        .math-renderer :global(p) { margin-bottom: 0.8rem; }
      `}</style>

      <div className="ai-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span>🤖</span>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{topic}</span>
        </div>
        <span className="ai-badge">{difficulty}</span>
      </div>

      <div className="ai-card-body">
        <div className="ai-btn-row">
          <button className="ai-refresh-btn" onClick={generateProblem} disabled={loading}>
            {problem ? 'Try Another' : 'Practice Now'}
          </button>

          {loading && (
            <div className="ai-loader-container">
              <div className="ai-pulse-dot"></div>
              <span>{statusMessages[statusIndex]}</span>
            </div>
          )}

          {!loading && !problem && (
            <span style={{ fontSize: '0.8rem', color: 'var(--sl-color-gray-4)' }}>
              Generate a unique exam-style question
            </span>
          )}
        </div>

        {error && <p style={{ color: 'var(--sl-color-error)', fontSize: '0.85rem' }}>{error}</p>}

        {problem && (
          <div className="ai-content-inner">
            <div className="math-renderer">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {problem}
              </ReactMarkdown>
            </div>

            {solution && (
              <details onToggle={(e) => e.target.open && !hasSaved && (saveToHistory(problem, solution), setHasSaved(true))}>
                <summary className="ai-solution-summary">
                  {hasSaved ? '✓ Solution Saved to Dashboard' : '▶ Reveal Detailed Solution'}
                </summary>
                <div className="math-renderer" style={{ marginTop: '1rem' }}>
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {solution}
                  </ReactMarkdown>
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}