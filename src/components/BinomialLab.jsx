import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// --- Math Helpers ---
const fact = (num) => {
  if (num <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= num; i++) r *= i;
  return r;
};

const nCr = (n, r) => fact(n) / (fact(r) * fact(n - r));

const getBinomialProb = (n, k, p) => {
  return nCr(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
};

export default function BinomialLab() {
  const canvasRef = useRef(null);
  const mathOutputRef = useRef(null);

  // --- State ---
  const [n, setN] = useState(20);
  const [p, setP] = useState(0.46);
  const [mode, setMode] = useState('atMost'); // 'exact' | 'atMost' | 'atLeast' | 'between'
  const [k1, setK1] = useState(10); // Used as 'k' or 'Lower Bound'
  const [k2, setK2] = useState(15); // Used as 'Upper Bound'

  // Bounds checking
  useEffect(() => {
    if (k1 > n) setK1(n);
    if (k2 > n) setK2(n);
    if (mode === 'between' && k1 > k2) setK2(k1);
  }, [n, k1, k2, mode]);

  // --- Canvas Rendering ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const colors = {
      bg: '#f8fafc',
      axis: '#64748b',
      grid: '#e2e8f0',
      barDefault: 'rgba(59, 130, 246, 0.4)',
      barBorder: '#3b82f6',
      barHighlight: 'rgba(239, 68, 68, 0.6)',
      highlightBorder: '#ef4444'
    };

    let probs = [];
    let maxProb = 0;
    let selectedProbSum = 0;

    for (let i = 0; i <= n; i++) {
      const prob = getBinomialProb(n, i, p);
      probs.push(prob);
      if (prob > maxProb) maxProb = prob;

      // Determine if 'i' is in the highlighted range
      let isHighlighted = false;
      if (mode === 'exact') isHighlighted = (i === k1);
      else if (mode === 'atMost') isHighlighted = (i <= k1);
      else if (mode === 'atLeast') isHighlighted = (i >= k1);
      else if (mode === 'between') isHighlighted = (i >= k1 && i <= k2);

      if (isHighlighted) selectedProbSum += prob;
    }

    const margin = { top: 30, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const yMax = Math.min(1, maxProb * 1.15);

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = colors.axis;
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = 0; i <= 5; i++) {
      const val = (yMax / 5) * i;
      const y = height - margin.bottom - (val / yMax) * chartHeight;
      ctx.fillText(val.toFixed(2), margin.left - 10, y);
      
      ctx.beginPath();
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.strokeStyle = colors.axis;
    ctx.lineWidth = 2;
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();

    const barSpacing = chartWidth / (n + 1);
    const barWidth = barSpacing * 0.8;

    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let i = 0; i <= n; i++) {
      const prob = probs[i];
      const barHeight = (prob / yMax) * chartHeight;
      const x = margin.left + (i * barSpacing) + (barSpacing - barWidth) / 2;
      const y = height - margin.bottom - barHeight;

      let isHighlighted = false;
      if (mode === 'exact') isHighlighted = (i === k1);
      else if (mode === 'atMost') isHighlighted = (i <= k1);
      else if (mode === 'atLeast') isHighlighted = (i >= k1);
      else if (mode === 'between') isHighlighted = (i >= k1 && i <= k2);

      ctx.fillStyle = isHighlighted ? colors.barHighlight : colors.barDefault;
      ctx.strokeStyle = isHighlighted ? colors.highlightBorder : colors.barBorder;
      ctx.lineWidth = isHighlighted ? 2 : 1;

      ctx.beginPath();
      ctx.rect(x, y, barWidth, barHeight);
      ctx.fill();
      ctx.stroke();

      if (n <= 25 || i % Math.ceil(n / 10) === 0) {
        ctx.fillStyle = colors.axis;
        ctx.fillText(i, x + barWidth / 2, height - margin.bottom + 8);
      }
    }

    // --- Math Readout Generation ---
    const mean = (n * p).toFixed(2);
    const variance = (n * p * (1 - p)).toFixed(2);
    let latexString = `\\mu = ${mean}, \\;\\; \\sigma^2 = ${variance} \\\\`;

    // Condensed Math formatting to prevent overflow
    if (mode === 'exact') {
      latexString += `
        P(X = ${k1}) = \\binom{${n}}{${k1}} (${p.toFixed(2)})^{${k1}} (${(1-p).toFixed(2)})^{${n-k1}} \\\\
        P(X = ${k1}) \\approx ${(selectedProbSum * 100).toFixed(2)}\\%
      `;
    } else if (mode === 'atMost') {
      latexString += `
        P(X \\le ${k1}) = \\sum_{i=0}^{${k1}} P(X=i) \\\\
        P(X \\le ${k1}) \\approx ${(selectedProbSum * 100).toFixed(2)}\\%
      `;
    } else if (mode === 'atLeast') {
      latexString += `
        P(X \\ge ${k1}) = \\sum_{i=${k1}}^{${n}} P(X=i) \\\\
        P(X \\ge ${k1}) \\approx ${(selectedProbSum * 100).toFixed(2)}\\%
      `;
    } else if (mode === 'between') {
      latexString += `
        P(${k1} \\le X \\le ${k2}) = \\sum_{i=${k1}}^{${k2}} P(X=i) \\\\
        P(${k1} \\le X \\le ${k2}) \\approx ${(selectedProbSum * 100).toFixed(2)}\\%
      `;
    }

    if (mathOutputRef.current) {
      katex.render(latexString, mathOutputRef.current, { throwOnError: false, displayMode: true });
    }

  }, [n, p, k1, k2, mode]);

  // --- Inline Styles ---
  const styles = {
    wrapper: {
      maxWidth: '900px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      color: '#0f172a'
    },
    canvasContainer: {
      width: '100%',
      aspectRatio: '2.2 / 1',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#f8fafc',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
    },
    hub: {
      display: 'grid',
      // Adjusted grid slightly to ensure left pane has strict limits
      gridTemplateColumns: 'minmax(0, 1fr) 300px', 
      gap: '1rem',
      alignItems: 'start'
    },
    panel: {
      backgroundColor: '#ffffff',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      padding: '1.25rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      overflowX: 'auto' // Prevents internal math from breaking the panel
    },
    hubTitle: {
      fontSize: '0.875rem',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: '#64748b',
      marginBottom: '1rem',
      borderBottom: '1px solid #e2e8f0',
      paddingBottom: '0.5rem'
    },
    controlGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    },
    labelRow: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '0.875rem',
      fontWeight: '600'
    },
    rangeInput: {
      width: '100%',
      cursor: 'pointer'
    },
    grid2x2: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '0.5rem',
      marginTop: '0.25rem'
    },
    button: (isActive) => ({
      padding: '0.4rem',
      fontSize: '0.8rem',
      fontWeight: '600',
      textAlign: 'center',
      border: `1px solid ${isActive ? '#3b82f6' : '#cbd5e1'}`,
      backgroundColor: isActive ? '#eff6ff' : '#ffffff',
      color: isActive ? '#1d4ed8' : '#64748b',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    })
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.canvasContainer}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }}></canvas>
      </div>

      <div style={styles.hub}>
        <div style={{ ...styles.panel, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '180px' }}>
          <div style={styles.hubTitle}>Live Calculation</div>
          {/* Output container */}
          <div ref={mathOutputRef} style={{ fontSize: '1rem' }}></div>
        </div>

        <div style={styles.panel}>
          <div style={styles.hubTitle}>Control Panel</div>
          
          <div style={styles.controlGroup}>
            <div>
              <div style={styles.labelRow}>
                <span>Trials (n):</span> <span>{n}</span>
              </div>
              <input type="range" min="1" max="50" step="1" value={n} onChange={(e) => setN(parseInt(e.target.value))} style={styles.rangeInput} />
            </div>

            <div>
              <div style={styles.labelRow}>
                <span>Probability (p):</span> <span>{p.toFixed(2)}</span>
              </div>
              <input type="range" min="0.01" max="0.99" step="0.01" value={p} onChange={(e) => setP(parseFloat(e.target.value))} style={styles.rangeInput} />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.25rem 0' }} />

            <div style={styles.grid2x2}>
              <button style={styles.button(mode === 'exact')} onClick={() => setMode('exact')}>X = k</button>
              <button style={styles.button(mode === 'atMost')} onClick={() => setMode('atMost')}>X ≤ k</button>
              <button style={styles.button(mode === 'atLeast')} onClick={() => setMode('atLeast')}>X ≥ k</button>
              <button style={styles.button(mode === 'between')} onClick={() => setMode('between')}>a ≤ X ≤ b</button>
            </div>

            {/* Dynamic Sliders based on Mode */}
            <div style={{ marginTop: '0.5rem' }}>
              {mode !== 'between' ? (
                <div>
                  <div style={{ ...styles.labelRow, color: '#ef4444' }}>
                    <span>Target (k):</span> <span>{k1}</span>
                  </div>
                  <input type="range" min="0" max={n} step="1" value={k1} onChange={(e) => setK1(parseInt(e.target.value))} style={styles.rangeInput} />
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ ...styles.labelRow, color: '#ef4444' }}>
                      <span>Lower Bound (a):</span> <span>{k1}</span>
                    </div>
                    <input type="range" min="0" max={k2} step="1" value={k1} onChange={(e) => setK1(parseInt(e.target.value))} style={styles.rangeInput} />
                  </div>
                  <div>
                    <div style={{ ...styles.labelRow, color: '#ef4444' }}>
                      <span>Upper Bound (b):</span> <span>{k2}</span>
                    </div>
                    <input type="range" min={k1} max={n} step="1" value={k2} onChange={(e) => setK2(parseInt(e.target.value))} style={styles.rangeInput} />
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}