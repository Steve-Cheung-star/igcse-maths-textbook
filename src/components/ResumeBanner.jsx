import React, { useEffect, useState } from 'react';

export default function ResumeBanner() {
  const [lastPage, setLastPage] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('last_visited_page');
    if (saved) {
      setLastPage(JSON.parse(saved));
    }
  }, []);

  if (!lastPage) return null;

  return (
    <div style={{
      margin: '2rem 0',
      padding: '1.5rem',
      background: 'linear-gradient(90deg, var(--sl-color-accent-low), var(--sl-color-bg-nav))',
      border: '1px solid var(--sl-color-accent)',
      borderRadius: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: 'var(--sl-shadow-md)'
    }}>
      <div>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--sl-color-accent-high)', fontWeight: 'bold' }}>
          WELCOME BACK 👋
        </p>
        <h3 style={{ margin: '0.2rem 0', color: 'var(--sl-color-white)' }}>
          Ready to continue <strong>{lastPage.title}</strong>?
        </h3>
      </div>
      
      <a href={lastPage.url} style={{
        padding: '0.8rem 1.5rem',
        background: 'var(--sl-color-accent-high)',
        color: 'var(--sl-color-black)',
        borderRadius: '8px',
        textDecoration: 'none',
        fontWeight: 'bold',
        transition: 'transform 0.2s'
      }}
      onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
      onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
      >
        Resume Lesson →
      </a>
    </div>
  );
}