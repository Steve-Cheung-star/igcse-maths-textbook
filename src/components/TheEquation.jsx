import React, { useState, useEffect } from 'react';

export default function TheEquation() {
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState(10);
  const [current, setCurrent] = useState(0);
  const [gameActive, setGameActive] = useState(false);

  useEffect(() => {
    if (!gameActive) return;
    const interval = setInterval(() => {
      // The "Entropy" - the number drifts randomly
      setCurrent(prev => +(prev + (Math.random() * 2 - 1)).toFixed(1));
    }, 100);
    return () => clearInterval(interval);
  }, [gameActive]);

  const handleAdjust = (val) => {
    const next = +(current + val).toFixed(1);
    setCurrent(next);
    if (Math.abs(next - target) < 0.5) {
      setScore(s => s + 1);
      setTarget(Math.floor(Math.random() * 50));
      // Reward: Bring it closer to center
    }
  };

  return (
    <div style={{ padding: '2rem', border: '2px solid var(--sl-color-accent)', borderRadius: '1rem', textAlign: 'center', background: 'rgba(var(--sl-color-accent-low-rgb), 0.1)' }}>
      <h3>{gameActive ? "DON'T LET 𝑥 ESCAPE" : "The Entropy Engine"}</h3>
      <div style={{ fontSize: '3rem', margin: '1rem 0', fontFamily: 'monospace' }}>
        𝑥 = {current}
      </div>
      <p>Target: <strong>{target}</strong> | Stability Score: {score}</p>
      
      {!gameActive ? (
        <button onClick={() => setGameActive(true)} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>START CALIBRATION</button>
      ) : (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => handleAdjust(-1)}>-1</button>
          <button onClick={() => handleAdjust(-0.1)}>-0.1</button>
          <button onClick={() => handleAdjust(0.1)}>+0.1</button>
          <button onClick={() => handleAdjust(1)}>+1</button>
        </div>
      )}
      {score > 10 && <p style={{color: 'var(--sl-color-text-accent)', marginTop: '1rem'}}>Steve is impressed. Barely.</p>}
    </div>
  );
}