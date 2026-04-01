import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';

export default function HistoryViewer() {
  const [history, setHistory] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [filterBookmarked, setFilterBookmarked] = useState(false);
  const [copiedId, setCopiedId] = useState(null); 
  
  // New Pagination & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);

  // Import Form States
  const [showImport, setShowImport] = useState(false);
  const [importTopic, setImportTopic] = useState('');
  const [importDifficulty, setImportDifficulty] = useState('IGCSE Extended');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('igcse_ai_history') || '[]');
    setHistory(savedData);
    setMounted(true);
  }, []);

  const toggleBookmark = (id) => {
    const updatedHistory = history.map(item => {
      if (item.id === id) return { ...item, bookmarked: !item.bookmarked };
      return item;
    });
    setHistory(updatedHistory);
    localStorage.setItem('igcse_ai_history', JSON.stringify(updatedHistory));
  };

  const deleteEntry = (id) => {
    if (window.confirm("Delete this specific entry?")) {
      const updatedHistory = history.filter(item => item.id !== id);
      setHistory(updatedHistory);
      localStorage.setItem('igcse_ai_history', JSON.stringify(updatedHistory));
    }
  };

  const clearHistory = () => {
    if (window.confirm("Delete all saved questions?")) {
      localStorage.removeItem('igcse_ai_history');
      setHistory([]);
    }
  };

  // UPDATED: Now copies in the exact format the importer expects
  const handleCopy = (item) => {
    const textToCopy = `TOPIC: ${item.topic}\nDIFFICULTY: ${item.difficulty}\n\nPROBLEM:\n${item.question}\n\nSOLUTION:\n${item.feedback}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000); 
    });
  };

  // HYBRID IMPORT: Automates extraction, but falls back to manual inputs if needed
  const handleImport = () => {
    setImportError('');
    if (!importText.trim()) {
      setImportError("Please paste the AI response.");
      return;
    }

    // 1. Try to extract Metadata using Regex
    const topicMatch = importText.match(/TOPIC:\s*(.+)/i);
    const diffMatch = importText.match(/DIFFICULTY:\s*(.+)/i);
    
    // If regex finds it, use it. Otherwise, fallback to the manual inputs in the UI.
    const parsedTopic = topicMatch ? topicMatch[1].trim() : (importTopic.trim() || 'Imported Problem');
    const parsedDifficulty = diffMatch ? diffMatch[1].trim() : importDifficulty;

    // 2. Try to extract Problem & Solution using Regex
    const problemMatch = importText.match(/PROBLEM:([\s\S]*?)SOLUTION:/i);
    const solutionMatch = importText.match(/SOLUTION:([\s\S]*)/i);

    // If regex fails (e.g. they pasted random text without our tags), just use string splitting as a last resort
    let generatedProblem = 'Error: Could not find "PROBLEM:" section.';
    let generatedSolution = 'Solution unavailable (Did not find "SOLUTION:" marker).';

    if (problemMatch && solutionMatch) {
      generatedProblem = problemMatch[1].trim();
      generatedSolution = solutionMatch[1].trim();
    } else {
      // Fallback for non-standard pastes
      const parts = importText.split(/SOLUTION:/i);
      generatedProblem = parts[0].replace(/PROBLEM:/i, '').trim();
      if (parts[1]) generatedSolution = parts[1].trim();
    }

    // Clean up markdown codeblock ticks just in case they accidentally copied them
    generatedProblem = generatedProblem.replace(/^```markdown/i, '').replace(/```$/, '').trim();
    generatedSolution = generatedSolution.replace(/^```markdown/i, '').replace(/```$/, '').trim();

    const newRecord = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      topic: parsedTopic, 
      difficulty: parsedDifficulty, 
      question: generatedProblem, 
      feedback: generatedSolution,
      bookmarked: true 
    };

    const updatedHistory = [newRecord, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('igcse_ai_history', JSON.stringify(updatedHistory));
    
    // Reset states
    setImportTopic('');
    setImportText('');
    setShowImport(false);
  };

  // Handlers to reset visible count when filtering or searching
  const handleFilterToggle = (isBookmarked) => {
    setFilterBookmarked(isBookmarked);
    setVisibleCount(10);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setVisibleCount(10);
  };

  const cleanMarkdown = (text) => text ? text.replace(/^[ \t]+/gm, '') : '';

  // 1. Filter the entire history array first based on bookmarks AND search terms
  const filteredHistory = history.filter(item => {
    if (filterBookmarked && !item.bookmarked) return false;
    
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const matchTopic = item.topic?.toLowerCase().includes(term);
      const matchDifficulty = item.difficulty?.toLowerCase().includes(term);
      const matchQuestion = item.question?.toLowerCase().includes(term);
      
      if (!matchTopic && !matchDifficulty && !matchQuestion) return false;
    }
    
    return true;
  });

  // 2. Slice the filtered array to only show the allowed visible count
  const displayedHistory = filteredHistory.slice(0, visibleCount);

  if (!mounted) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" />
      <style>{`
        .math-renderer pre { white-space: pre-wrap !important; word-break: break-word !important; background: var(--sl-color-gray-6) !important; }
        
        .icon-btn {
          display: inline-flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer;
          width: 32px; height: 32px; padding: 0; line-height: 1;
          border-radius: 6px; transition: all 0.2s;
        }
        
        .bookmark-btn { font-size: 1.25rem; }
        .bookmark-btn:hover { transform: scale(1.15); }
        
        .copy-btn { font-size: 1.1rem; color: var(--sl-color-gray-3); transition: color 0.2s; }
        .copy-btn:hover { color: var(--sl-color-white); transform: scale(1.15); }

        .delete-btn { font-size: 1.1rem; color: var(--sl-color-gray-4); opacity: 0.6; }
        .delete-btn:hover { opacity: 1; color: var(--sl-color-red-high); background: var(--sl-color-red-low); }

        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        .icon-animate {
          display: inline-block;
          animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .math-renderer svg {
          max-width: 100%; height: auto; display: block; margin: 1.5rem auto;
          background-color: white; border-radius: 8px; padding: 1rem;
          box-shadow: inset 0 0 0 1px var(--sl-color-gray-5); overflow: visible;
        }

        .import-input {
          width: 100%; 
          height: 42px !important; 
          padding: 0 0.8rem; 
          border-radius: 6px;
          border: 1px solid var(--sl-color-gray-5);
          background: var(--sl-color-bg-nav);
          color: var(--sl-color-white);
          font-family: inherit; 
          margin: 0 !important; 
          box-sizing: border-box !important;
          line-height: normal !important;
        }
        
        textarea.import-input {
          height: auto !important;
          padding: 0.8rem;
          margin-bottom: 1rem !important;
        }
      `}</style>

      {/* Navigation, Controls & Search Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          <div style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--sl-color-gray-6)', padding: '0.25rem', borderRadius: '8px', height: '42px', boxSizing: 'border-box' }}>
            <button onClick={() => handleFilterToggle(false)} style={{ margin: 0, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1rem', borderRadius: '6px', border: 'none', background: !filterBookmarked ? 'var(--sl-color-accent-high)' : 'transparent', color: !filterBookmarked ? 'var(--sl-color-black)' : 'var(--sl-color-white)', cursor: 'pointer', fontWeight: 'bold', lineHeight: 1, height: '100%' }}>
              All
            </button>
            <button onClick={() => handleFilterToggle(true)} style={{ margin: 0, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0 1rem', borderRadius: '6px', border: 'none', background: filterBookmarked ? 'var(--sl-color-accent-high)' : 'transparent', color: filterBookmarked ? 'var(--sl-color-black)' : 'var(--sl-color-white)', cursor: 'pointer', fontWeight: 'bold', lineHeight: 1, height: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', height: '100%' }}>⭐</span> Bookmarks
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', margin: 0, height: '42px', boxSizing: 'border-box' }}>
            <button onClick={() => setShowImport(!showImport)} style={{ margin: 0, boxSizing: 'border-box', height: '100%', background: 'var(--sl-color-gray-6)', color: 'var(--sl-color-white)', border: '1px solid var(--sl-color-gray-5)', padding: '0 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {showImport ? 'Cancel Import' : '📥 Import External AI'}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <input 
          type="text" 
          className="import-input" 
          placeholder="🔍 Search topics, difficulty, or questions..." 
          value={searchTerm} 
          onChange={handleSearch} 
          style={{ marginBottom: '0.5rem' }}
        />
      </div>

      {/* Import Form UI */}
      {showImport && (
        <div style={{ padding: '1.5rem', background: 'var(--sl-color-gray-6)', borderRadius: '12px', border: '1px solid var(--sl-color-accent-low)', animation: 'slideIn 0.3s ease-out' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--sl-color-white)' }}>Import Practice Problem</h3>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--sl-color-gray-3)' }}>Topic Name (Optional Fallback)</label>
              <input type="text" className="import-input" placeholder="e.g. Algebra, Geometry..." value={importTopic} onChange={(e) => setImportTopic(e.target.value)} />
            </div>
            
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--sl-color-gray-3)' }}>Difficulty (Fallback)</label>
              <select className="import-input" value={importDifficulty} onChange={(e) => setImportDifficulty(e.target.value)}>
                <option>IGCSE Core</option>
                <option>IGCSE Extended</option>
                <option>Custom/Advanced</option>
              </select>
            </div>
          </div>

          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--sl-color-gray-3)' }}>Paste entire AI response here (including TOPIC:, PROBLEM: and SOLUTION:)</label>
          <textarea className="import-input" rows="6" placeholder="Paste the text Google Gemini here..." value={importText} onChange={(e) => setImportText(e.target.value)} style={{ resize: 'vertical' }}></textarea>
          
          {importError && <p style={{ color: 'var(--sl-color-red-high)', fontSize: '0.85rem', marginTop: 0, marginBottom: '1rem' }}>{importError}</p>}

          <button onClick={handleImport} style={{ background: 'var(--sl-color-accent)', color: 'var(--sl-color-black)', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            Save to My Revision
          </button>
        </div>
      )}

      {/* History List */}
      {displayedHistory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--sl-color-gray-5)', borderRadius: '12px' }}>
           <p style={{ color: 'var(--sl-color-gray-3)' }}>
            {searchTerm 
              ? "No questions match your search." 
              : filterBookmarked 
                ? "No bookmarks yet. Star a question to see it here!" 
                : "No history found. Go practice some math!"}
          </p>
        </div>
      ) : (
        displayedHistory.map((item) => (
          <div key={item.id} style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--sl-color-bg-nav)', boxShadow: 'var(--sl-shadow-sm)' }}>
            
            <div style={{ background: 'var(--sl-color-gray-6)', padding: '0.6rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--sl-color-gray-5)', minHeight: '50px' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--sl-color-accent-high)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>{item.topic}</span>
                <span style={{ color: 'var(--sl-color-gray-4)', fontSize: '0.8rem', lineHeight: 1 }}>•</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-3)', lineHeight: 1 }}>{item.difficulty}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '32px', margin: 0, boxSizing: 'border-box' }}>
                <button onClick={() => toggleBookmark(item.id)} className="icon-btn bookmark-btn" style={{ height: '100%', margin: 0, boxSizing: 'border-box' }} title={item.bookmarked ? 'Remove bookmark' : 'Add bookmark'}>
                  {item.bookmarked ? '⭐' : '☆'}
                </button>
                
                <button onClick={() => handleCopy(item)} className="icon-btn copy-btn" style={{ height: '100%', margin: 0, boxSizing: 'border-box' }} title="Copy Markdown">
                  <span key={copiedId === item.id ? 'check' : 'clipboard'} className="icon-animate">
                    {copiedId === item.id ? '✅' : '📋'}
                  </span>
                </button>

                <button onClick={() => deleteEntry(item.id)} className="icon-btn delete-btn" title="Delete entry" style={{ height: '100%', margin: 0, boxSizing: 'border-box' }}>
                  🗑️
                </button>
              </div>
            </div>

            <div style={{ padding: '1.25rem' }}>
              <div className="math-renderer" style={{ marginBottom: '1.5rem' }}>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeRaw, rehypeKatex]}>
                  {cleanMarkdown(item.question)}
                </ReactMarkdown>
              </div>

            <details style={{ borderTop: '1px solid var(--sl-color-gray-5)', paddingTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', color: '#10b981', fontWeight: 'bold', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>▼</span> View Saved Solution
              </summary>
              <div className="math-renderer" style={{ marginTop: '1rem', background: '#064e3b', padding: '1.25rem', borderRadius: '8px', borderLeft: '4px solid #10b981', color: '#ecfdf5', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)' }}>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeRaw, rehypeKatex]}>
                  {cleanMarkdown(item.feedback)}
                </ReactMarkdown>
              </div>
            </details>
            </div>
          </div>
        ))
      )}

      {/* Load More Button */}
      {visibleCount < filteredHistory.length && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <button 
            onClick={() => setVisibleCount(prev => prev + 10)}
            style={{ background: 'var(--sl-color-accent-high)', color: 'var(--sl-color-black)', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Load More Questions...
          </button>
        </div>
      )}

      {/* Clear History Container - Kept separated to avoid accidental clicks next to Load More */}
      {history.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', borderTop: '1px solid var(--sl-color-gray-5)', paddingTop: '1.5rem' }}>
          <button onClick={clearHistory} style={{ color: 'var(--sl-color-red-high)', background: 'var(--sl-color-gray-6)', border: '1px solid var(--sl-color-gray-5)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', padding: '0.6rem 1.5rem' }}>
            🗑️ Clear All History
          </button>
        </div>
      )}
    </div>
  );
}