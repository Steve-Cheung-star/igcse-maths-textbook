import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
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
  
  // Save Notification State
  const [saveMsg, setSaveMsg] = useState('');
  
  // For the manual fallback box
  const [showQuickPaste, setShowQuickPaste] = useState(false);
  const [rawInput, setRawInput] = useState('');

  const statusMessages = [
    "Connecting to Math Engine...",
    "Analyzing IGCSE Syllabus...",
    "Drafting diagram SVGs...",
    "Hardening the difficulty...",
    "Formatting LaTeX expressions...",
    "Almost there..."
  ];

  // 1. Loading Status Effect
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

  // 2. Auto-Parsing Effect (Fallback for the manual text box)
  useEffect(() => {
    if (rawInput.includes("PROBLEM:") && rawInput.includes("SOLUTION:")) {
      parseAndSave(rawInput);
    }
  }, [rawInput]);

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

  // Centralized parsing logic
  const parseAndSave = (textToParse) => {
    const problemMatch = textToParse.match(/PROBLEM:([\s\S]*?)SOLUTION:/i);
    const solutionMatch = textToParse.match(/SOLUTION:([\s\S]*)/i);

    if (problemMatch && solutionMatch) {
      const p = problemMatch[1].trim().replace(/^```markdown/i, '').replace(/```$/, '');
      const s = solutionMatch[1].trim().replace(/^```markdown/i, '').replace(/```$/, '');

      setProblem(p);
      setSolution(s);
      saveToHistory(p, s);

      // Show the success notification
      setSaveMsg('✅ Question saved to your revision!');
      setTimeout(() => setSaveMsg(''), 3000); // Hides after 3 seconds

      setShowQuickPaste(false);
      setRawInput('');
      setError(null);
      return true; // Success
    }
    return false; // Failed to find markers
  };

  const getPromptText = () => {
    const prompt = `Act as an expert IGCSE Math teacher. Generate one unique ${difficulty} level practice problem about ${topic}. 
Use standard LaTeX enclosed ONLY in single $ for ALL math equations. DO NOT use double $$ under any circumstances. 

CRITICAL MATH RULE: 
NEVER put plain text, English words, or units inside the $ delimiters. Only use $ for pure mathematical variables, numbers, and operators. 
- Correct: $r = 5$ cm
- Incorrect: $r = 5 \\text{ cm}$ or $r = 5 cm$

CRITICAL LINE BREAK RULE:
Markdown will render consecutive math equations on the same single line unless you force a break. If you have multiple equations stacking vertically under a single numbered step, you MUST place a <br> tag at the very end of the line.
- Correct:
   $x + 5 = 10$<br>
   $x = 5$
- Incorrect (Do NOT do this):
   $x + 5 = 10$
   $x = 5$

CRITICAL TABLE RULE:
If the problem requires a data table (e.g., for statistics, frequencies, or coordinates), you MUST format it as a standard Markdown table. Keep the math inside single $. 
Example format:
| Time ($t$ mins) | Frequency |
| :--- | :--- |
| $0 < t \\le 10$ | 8 |
| $10 < t \\le 20$ | 22 |

CRITICAL SVG SEQUENCE & RULES: 
1. Output the opening <svg viewBox="..."> tag with generous padding.
2. Draw all geometric shapes, lines, and paths.
3. Write ALL <text> labels for the math variables. DO NOT use LaTeX inside the SVG. Use plain text and unicode symbols (e.g., x², θ, π).
4. ONLY AFTER all text is written, output the closing </svg> tag. NEVER place a <text> tag after </svg>.
5. Do not have any empty lines in between <svg viewBox> and </svg>, make sure each line in between has 2 spaces in the front. 

CRITICAL FORMATTING RULE:
You MUST wrap your ENTIRE response inside a single markdown code block (using \`\`\`markdown and closing with \`\`\`). Do not write any conversational text outside of this code block. 

Inside the code block, format your response EXACTLY like this (Notice the 3-space indentation to ensure they align properly):
TOPIC: ${topic}
DIFFICULTY: ${difficulty}

PROBLEM: 
[Write the question here, including any SVG diagrams or Markdown tables]

SOLUTION: 
1. **[Brief description of the first step]:**<br>
   $[Primary equation for this step]$<br>
   $[Secondary equation for this step]$
   
2. **[Brief description of the next step]:**<br>
   $[Next equation]$
   
[...continue numbering and stacking equations as needed...]

**Final Answer:** [State the final mathematical answer clearly, keeping units outside the $]`;

    return prompt;
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(getPromptText());
    setIsCopied(true);
    window.open("https://gemini.google.com/app", "GeminiRevision");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAutoPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const success = parseAndSave(text);
      if (!success) {
        alert("We didn't detect 'PROBLEM:' and 'SOLUTION:' in your clipboard. Did you copy the full Gemini response?");
        setShowQuickPaste(true); 
      }
    } catch (err) {
      console.warn("Clipboard read failed (permission denied or unsupported):", err);
      setShowQuickPaste(true);
    }
  };

  const generateProblem = async (retryCount = 0) => {
    if (retryCount === 0) {
      setLoading(true);
      setProblem('');
      setSolution('');
      setError(null);
      setHasSaved(false);
      setSaveMsg('');
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

      const success = parseAndSave(data.text);
      if (!success) {
         setError('API returned an invalid format.');
      }
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

        /* NEW TABLE CSS */
        .math-renderer :global(table) {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          font-size: 0.9rem;
        }

        .math-renderer :global(th) {
          background: var(--sl-color-gray-6);
          font-weight: 600;
          border-bottom: 2px solid var(--sl-color-gray-4);
          padding: 0.75rem;
          text-align: left;
        }

        .math-renderer :global(td) {
          border-bottom: 1px solid var(--sl-color-gray-5);
          padding: 0.75rem;
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
                {problem ? 'Try Another (API)' : 'Practice Now'}
              </button>

              <button
                className="ai-export-btn"
                onClick={handleCopyPrompt}
              >
                {isCopied ? '📋 Opening Gemini...' : '📋 Copy & Go →'}
              </button>

              {!loading && (
                <button
                  className="ai-export-btn"
                  onClick={handleAutoPaste}
                  style={{ borderStyle: 'dashed', borderColor: 'var(--sl-color-accent-low)' }}
                >
                  {problem ? '📥 Paste Another' : '📥 Auto-Paste Result'}
                </button>
              )}
            </div>
          </div>

          {loading && (
            <div className="ai-loader-container">
              <div className="ai-pulse-dot"></div>
              <span>{statusMessages[statusIndex]}</span>
            </div>
          )}

          {!loading && !problem && !showQuickPaste && (
            <span style={{ fontSize: '0.8rem', color: 'var(--sl-color-gray-4)' }}>
              Generate a unique exam-style question with diagrams
            </span>
          )}
        </div>

        {error && (
          <div style={{ background: 'var(--sl-color-red-low)', color: 'var(--sl-color-red-high)', padding: '0.8rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '1rem', border: '1px solid var(--sl-color-red-high)' }}>
            {error}
          </div>
        )}

        {/* The Success Notification Banner */}
        {saveMsg && (
          <div style={{ 
            padding: '0.6rem 1rem', 
            background: 'rgba(16, 185, 129, 0.1)', 
            color: '#10b981', 
            borderRadius: '6px', 
            fontSize: '0.85rem', 
            fontWeight: '600',
            marginBottom: '1rem', 
            border: '1px solid rgba(16, 185, 129, 0.3)', 
            animation: 'slideIn 0.3s ease-out' 
          }}>
            {saveMsg}
          </div>
        )}

        {showQuickPaste && (
          <div style={{
            marginTop: '1rem',
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'var(--sl-color-gray-6)',
            borderRadius: '12px',
            border: '2px dashed var(--sl-color-accent)',
            animation: 'slideIn 0.2s ease-out'
          }}>
            <textarea
              style={{
                width: '100%',
                height: '80px',
                background: 'var(--sl-color-bg-nav)',
                color: 'var(--sl-color-accent-high)',
                border: '1px solid var(--sl-color-gray-5)',
                borderRadius: '6px',
                padding: '0.8rem',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                resize: 'none',
                outline: 'none'
              }}
              placeholder="Browser blocked auto-paste. Please press Ctrl+V / Cmd+V to paste here manually..."
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              autoFocus
            />
            <button className="ai-export-btn" style={{marginTop: '0.5rem'}} onClick={() => setShowQuickPaste(false)}>Cancel Fallback</button>
          </div>
        )}

        {problem && (
          <div className="ai-content-inner">
            <div className="math-renderer">
              {/* Note: remarkGfm is added here */}
              <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeRaw, rehypeKatex]}>
                {problem}
              </ReactMarkdown>
            </div>

            {solution && (
              <details style={{ marginTop: '1.5rem', borderTop: '1px dashed var(--sl-color-gray-5)', paddingTop: '1rem' }}>
                <summary style={{ cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', color: 'var(--sl-color-accent-high)', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>▶</span> Reveal Detailed Solution
                </summary>
                <div className="math-renderer" style={{ marginTop: '1rem', background: 'var(--sl-color-bg-nav)', padding: '1.25rem', borderRadius: '8px', borderLeft: '3px solid var(--sl-color-accent-high)' }}>
                  {/* Note: remarkGfm is added here too */}
                  <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeRaw, rehypeKatex]}>
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