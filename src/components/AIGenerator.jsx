import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';

export default function AIGenerator({ topic, difficulty = "IGCSE Extended" }) {
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [error, setError] = useState(null);
  const [hasSaved, setHasSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const statusMessages = [
    "Connecting to Math Engine...",
    "Analyzing IGCSE Syllabus...",
    "Drafting diagram SVGs...",
    "Hardening the difficulty...",
    "Formatting LaTeX expressions...",
    "Almost there..."
  ];

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
        topic, 
        difficulty, 
        question: problemText, 
        feedback: solutionText,
        bookmarked: false 
      };
      localStorage.setItem('igcse_ai_history', JSON.stringify([newRecord, ...existingHistory]));
      setHasSaved(true);
    } catch (err) { 
      console.error("Failed to save to history:", err); 
    }
  };

  const getPromptText = () => {
    return `Act as an expert IGCSE Math teacher. Generate one unique ${difficulty} level practice problem about ${topic}. 
Use standard LaTeX enclosed in single $ for inline math and double $$ for block math. 
If the question involves geometry, trigonometry, or statistics, generate a clean, responsive, inline <svg> diagram to illustrate the problem. 

CRITICAL SVG SEQUENCE & RULES: 
1. Output the opening <svg viewBox="..."> tag with generous padding.
2. Draw all geometric shapes, lines, and paths.
3. Write ALL <text> labels for the math variables.
4. ONLY AFTER all text is written, output the closing </svg> tag. NEVER place a <text> tag after </svg>.
5. Do not have any empty lines in between <svg viewBox> and </svg>, make sure each line in between has 2 spaces in the front. 

CRITICAL FORMATTING RULE:
You MUST wrap your ENTIRE response inside a single markdown code block (using \`\`\`markdown and closing with \`\`\`). Do not write any conversational text outside of this code block. 

Inside the code block, format your response EXACTLY like this:
TOPIC: ${topic}
DIFFICULTY: ${difficulty}

PROBLEM: 
[Write the question here, including any SVG diagrams]

SOLUTION: 
**Step 1:** [Explain the first logical step]
**Step 2:** [Explain the next step]
[...continue with as many steps as needed...]
**Final Answer:** [State the final mathematical answer clearly]`;
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(getPromptText());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000); 
  };

  const generateProblem = async (retryCount = 0) => {
    if (retryCount === 0) {
      setLoading(true); 
      setProblem(''); 
      setSolution(''); 
      setError(null); 
      setHasSaved(false);
    } else {
      setError('Network hiccup! Retrying automatically... 🔄');
    }
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      // Use regex to precisely extract only the Problem and Solution blocks, ignoring the metadata
      const problemMatch = data.text.match(/PROBLEM:([\s\S]*?)SOLUTION:/i);
      const solutionMatch = data.text.match(/SOLUTION:([\s\S]*)/i);

      let generatedProblem = problemMatch ? problemMatch[1].trim() : 'Error: Could not find "PROBLEM:" section.';
      let generatedSolution = solutionMatch ? solutionMatch[1].trim() : 'Solution unavailable.';
      
      // Clean up markdown code block ticks if the AI included them
      generatedProblem = generatedProblem.replace(/^```markdown/i, '').replace(/```$/, '').trim();
      generatedSolution = generatedSolution.replace(/^```markdown/i, '').replace(/```$/, '').trim();
      
      setProblem(generatedProblem);
      setSolution(generatedSolution);
      setError(null); 
      
      saveToHistory(generatedProblem, generatedSolution);
      setLoading(false);

    } catch (err) { 
      if (retryCount < 1) { 
        console.warn(`Attempt ${retryCount + 1} failed. Retrying...`);
        await generateProblem(retryCount + 1); 
      } else {
        setError('Connection timed out. Please try clicking "Practice Now" again.'); 
        setLoading(false);
      }
    } 
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
          flex-wrap: wrap;
        }
        
        .ai-button-group {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
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
          transition: transform 0.1s, opacity 0.2s;
        }
        
        .ai-refresh-btn:active { transform: scale(0.98); }
        .ai-refresh-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .ai-export-btn {
          background: transparent;
          color: var(--sl-color-gray-2);
          border: 1px solid var(--sl-color-gray-4);
          padding: 0.6rem 1rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        
        .ai-export-btn:hover {
          background: var(--sl-color-gray-6);
          border-color: var(--sl-color-gray-3);
          color: var(--sl-color-white);
        }
        
        .ai-export-btn:active { transform: scale(0.98); }

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

        .math-renderer :global(p) { margin-bottom: 0.8rem; }
        
        .math-renderer :global(svg) {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 1.5rem auto;
          background-color: white; 
          border-radius: 8px;
          padding: 1rem;
          box-shadow: inset 0 0 0 1px var(--sl-color-gray-4);
          overflow: visible;
        }

        .math-renderer :global(.katex-display) {
          overflow-x: auto;
          overflow-y: hidden;
          max-width: 100%;
          padding: 0.5rem 0;
          font-size: 1.05em;
        }
        .math-renderer :global(.katex-display::-webkit-scrollbar) { height: 6px; }
        .math-renderer :global(.katex-display::-webkit-scrollbar-thumb) {
          background: var(--sl-color-gray-5); border-radius: 4px;
        }
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
          <div className="not-content">
            <div className="ai-button-group">
              <button className="ai-refresh-btn" onClick={() => generateProblem(0)} disabled={loading}>
                {problem ? 'Try Another' : 'Practice Now'}
              </button>
              
              <button className="ai-export-btn" onClick={handleCopyPrompt} title="Copy exact prompt to paste in Gemini">
                {isCopied ? '✓ Copied!' : '📋 Copy Prompt'}
              </button>
              
              {hasSaved && (
                <span style={{ fontSize: '0.8rem', color: 'var(--sl-color-success-high)', fontWeight: '600', animation: 'slideIn 0.3s ease-out', marginLeft: '0.5rem' }}>
                  ✓ Auto-saved
                </span>
              )}
            </div>
          </div>

          {loading && (
            <div className="ai-loader-container">
              <div className="ai-pulse-dot"></div>
              <span>{statusMessages[statusIndex]}</span>
            </div>
          )}

          {!loading && !problem && (
            <span style={{ fontSize: '0.8rem', color: 'var(--sl-color-gray-4)' }}>
              Generate a unique exam-style question with diagrams
            </span>
          )}
        </div>

        {error && (
          <div style={{ background: 'var(--sl-color-red-low)', color: 'var(--sl-color-red-high)', padding: '0.8rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '1rem', border: '1px solid var(--sl-color-red-high)' }}>
            {error}
            <div style={{ fontSize: '0.75rem', fontWeight: 'normal', marginTop: '0.3rem', color: 'var(--sl-color-gray-2)' }}>
              Hint: You can click "Copy Prompt" and paste it directly into Google Gemini!
            </div>
          </div>
        )}

        {problem && (
          <div className="ai-content-inner">
            <div className="math-renderer">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeRaw, rehypeKatex]}>
                {problem}
              </ReactMarkdown>
            </div>

            {solution && (
              <details style={{ marginTop: '1.5rem', borderTop: '1px dashed var(--sl-color-gray-5)', paddingTop: '1rem' }}>
                <summary style={{ cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', color: 'var(--sl-color-accent-high)', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>▶</span> Reveal Detailed Solution
                </summary>
                <div className="math-renderer" style={{ marginTop: '1rem', background: 'var(--sl-color-bg-nav)', padding: '1.25rem', borderRadius: '8px', borderLeft: '3px solid var(--sl-color-accent-high)' }}>
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeRaw, rehypeKatex]}>
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