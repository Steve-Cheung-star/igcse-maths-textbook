import { useState, useEffect } from 'react';

export default function LocalTimer({ sectionId }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // Load existing time from local storage for THIS specific section
    const savedTime = localStorage.getItem(`study-time-${sectionId}`);
    if (savedTime) setSeconds(parseInt(savedTime));

    const interval = setInterval(() => {
      setSeconds(prev => {
        const newTime = prev + 1;
        localStorage.setItem(`study-time-${sectionId}`, newTime);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sectionId]);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}m ${secs}s`;
  };

return (
    <div style={{ 
      borderLeft: '4px solid var(--sl-color-accent)', 
      padding: '0.8rem 1rem', 
      background: 'var(--sl-color-bg-nav)', // Uses the UI's natural background color
      color: 'var(--sl-color-white)',      // Uses the site's standard text color
      fontSize: '0.9rem',
      margin: '1.5rem 0',
      borderRadius: '0 4px 4px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <span style={{ fontSize: '1.1rem' }}>⏱️</span>
      <span>
        <strong>Time spent on this section:</strong> {formatTime(seconds)}
      </span>
    </div>
  );
}