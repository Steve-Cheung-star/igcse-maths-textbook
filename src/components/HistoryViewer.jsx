import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

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
        .bookmark-btn { background: none; border: none; cursor: pointer; font-size: 1.5rem; transition: transform 0.2s; padding: 0; line-height: 1; }
        .bookmark-btn:hover { transform: scale(1.2); }
      `}</style>

      {/* Navigation & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--sl-color-gray-6)', padding: '0.25rem', borderRadius: '8px' }}>
          <button 
            onClick={() => setFilterBookmarked(false)}
            style={{ 
              padding: '0.4rem 1rem', borderRadius: '6px', border: 'none',
              background: !filterBookmarked ? 'var(--sl-color-accent-high)' : 'transparent',
              color: !filterBookmarked ? 'var(--sl-color-black)' : 'var(--sl-color-white)',
              cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            All
          </button>
          <button 
            onClick={() => setFilterBookmarked(true)}
            style={{ 
              padding: '0.4rem 1rem', borderRadius: '6px', border: 'none',
              background: filterBookmarked ? 'var(--sl-color-accent-high)' : 'transparent',
              color: filterBookmarked ? 'var(--sl-color-black)' : 'var(--sl-color-white)',
              cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            ⭐ Bookmarks
          </button>
        </div>
        <button onClick={clearHistory} style={{ color: 'var(--sl-color-red-high)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
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
            <div style={{ background: 'var(--sl-color-gray-6)', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--sl-color-gray-5)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--sl-color-accent-high)', fontWeight: 'bold', textTransform: 'uppercase' }}>{item.topic}</span>
                <span style={{ margin: '0 0.5rem', color: 'var(--sl-color-gray-4)' }}>•</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-3)' }}>{item.date}</span>
              </div>
              <button onClick={() => toggleBookmark(item.id)} className="bookmark-btn">
                {item.bookmarked ? '⭐' : '☆'}
              </button>
            </div>

            {/* Question Section */}
            <div style={{ padding: '1.25rem' }}>
              <div className="math-renderer" style={{ marginBottom: '1.5rem' }}>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {cleanMarkdown(item.question)}
                </ReactMarkdown>
              </div>

            {/* Updated Solution Section with Guaranteed Green Background */}
            <details style={{ borderTop: '1px solid var(--sl-color-gray-5)', paddingTop: '1rem' }}>
              <summary style={{ 
                cursor: 'pointer', 
                color: '#10b981', // A bright, clear emerald green
                fontWeight: 'bold',
                listStyle: 'none' // Removes default arrow in some browsers
              }}>
                ▼ Show Step-by-Step Solution
              </summary>
              <div 
                className="math-renderer" 
                style={{ 
                  marginTop: '1rem', 
                  background: '#064e3b', // Deep forest green background
                  padding: '1.25rem', 
                  borderRadius: '8px', 
                  borderLeft: '4px solid #10b981', // Bright green accent line
                  color: '#ecfdf5', // Very light green text for high contrast
                  boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
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