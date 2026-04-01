import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';

export default function HistoryViewer() {
  const [history, setHistory] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [filterBookmarked, setFilterBookmarked] = useState(false);

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

  const cleanMarkdown = (text) => text ? text.replace(/^[ \t]+/gm, '') : '';

  const displayedHistory = filterBookmarked 
    ? history.filter(item => item.bookmarked) 
    : history;

  if (!mounted) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" />
      <style>{`
        .math-renderer pre { white-space: pre-wrap !important; word-break: break-word !important; background: var(--sl-color-gray-6) !important; }
        
        /* ALIGNMENT FIXES FOR ICONS */
        .icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          width: 32px;
          height: 32px;
          padding: 0;
          line-height: 1;
          border-radius: 6px;
          transition: all 0.2s;
        }
        
        .bookmark-btn { font-size: 1.25rem; }
        .bookmark-btn:hover { transform: scale(1.15); }
        
        .delete-btn { font-size: 1.1rem; color: var(--sl-color-gray-4); opacity: 0.6; }
        .delete-btn:hover { opacity: 1; color: var(--sl-color-red-high); background: var(--sl-color-red-low); }

        .math-renderer svg {
          max-width: 100%; height: auto; display: block; margin: 1.5rem auto;
          background-color: white; border-radius: 8px; padding: 1rem;
          box-shadow: inset 0 0 0 1px var(--sl-color-gray-5); overflow: visible;
        }
      `}</style>

      {/* Navigation & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Changed to inline-flex to fix the wide gray box issue */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'var(--sl-color-gray-6)', padding: '0.25rem', borderRadius: '8px' }}>
          <button 
            onClick={() => setFilterBookmarked(false)}
            style={{ 
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              padding: '0.4rem 1rem', borderRadius: '6px', border: 'none',
              background: !filterBookmarked ? 'var(--sl-color-accent-high)' : 'transparent',
              color: !filterBookmarked ? 'var(--sl-color-black)' : 'var(--sl-color-white)',
              cursor: 'pointer', fontWeight: 'bold', lineHeight: 1
            }}
          >
            All
          </button>
          <button 
            onClick={() => setFilterBookmarked(true)}
            style={{ 
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              padding: '0.4rem 1rem', borderRadius: '6px', border: 'none',
              background: filterBookmarked ? 'var(--sl-color-accent-high)' : 'transparent',
              color: filterBookmarked ? 'var(--sl-color-black)' : 'var(--sl-color-white)',
              cursor: 'pointer', fontWeight: 'bold', lineHeight: 1
            }}
          >
            <span>⭐</span> Bookmarks
          </button>
        </div>
        <button onClick={clearHistory} style={{ color: 'var(--sl-color-red-high)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>
          Clear All History
        </button>
      </div>

      {displayedHistory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--sl-color-gray-5)', borderRadius: '12px' }}>
           <p style={{ color: 'var(--sl-color-gray-3)' }}>
            {filterBookmarked ? "No bookmarks yet. Star a question to see it here!" : "No history found. Go practice some math!"}
          </p>
        </div>
      ) : (
        displayedHistory.map((item) => (
          <div key={item.id} style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--sl-color-bg-nav)', boxShadow: 'var(--sl-shadow-sm)' }}>
            
            {/* Header */}
            <div style={{ background: 'var(--sl-color-gray-6)', padding: '0.6rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--sl-color-gray-5)', minHeight: '50px' }}>
              
              {/* Perfectly aligned text grouping */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--sl-color-accent-high)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>{item.topic}</span>
                <span style={{ color: 'var(--sl-color-gray-4)', fontSize: '0.8rem', lineHeight: 1 }}>•</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-3)', lineHeight: 1 }}>{item.date}</span>
              </div>
              
              {/* Perfectly aligned icons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button onClick={() => toggleBookmark(item.id)} className="icon-btn bookmark-btn">
                  {item.bookmarked ? '⭐' : '☆'}
                </button>
                <button onClick={() => deleteEntry(item.id)} className="icon-btn delete-btn" title="Delete entry">
                  🗑️
                </button>
              </div>
            </div>

            {/* Question Section */}
            <div style={{ padding: '1.25rem' }}>
              <div className="math-renderer" style={{ marginBottom: '1.5rem' }}>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeRaw, rehypeKatex]}>
                  {cleanMarkdown(item.question)}
                </ReactMarkdown>
              </div>

            {/* Solution Section */}
            <details style={{ borderTop: '1px solid var(--sl-color-gray-5)', paddingTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', color: '#10b981', fontWeight: 'bold', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>▼</span> View Saved Solution
              </summary>
              <div 
                className="math-renderer" 
                style={{ 
                  marginTop: '1rem', background: '#064e3b', padding: '1.25rem', borderRadius: '8px', 
                  borderLeft: '4px solid #10b981', color: '#ecfdf5', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeRaw, rehypeKatex]}>
                  {cleanMarkdown(item.feedback)}
                </ReactMarkdown>
              </div>
            </details>
            </div>
          </div>
        ))
      )}
    </div>
  );
}