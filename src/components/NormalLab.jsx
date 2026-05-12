import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// --- Math Helpers for Normal Distribution ---

// Error function approximation (Abramowitz and Stegun)
const erf = (x) => {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
};

// Normal cumulative distribution function
const normalCDF = (x, mu, sigma) => {
  if (sigma <= 0) return NaN;
  return 0.5 * (1 + erf((x - mu) / (sigma * Math.sqrt(2))));
};

// Normal probability density function
const normalPDF = (x, mu, sigma) => {
  if (sigma <= 0) return 0;
  const exponent = -0.5 * Math.pow((x - mu) / sigma, 2);
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
};

// Probability computations for selected mode
const getProbability = (mu, sigma, mode, k1, k2) => {
  if (mode === 'lessThan') {
    return normalCDF(k1, mu, sigma);
  } else if (mode === 'greaterThan') {
    return 1 - normalCDF(k1, mu, sigma);
  } else if (mode === 'between') {
    const a = Math.min(k1, k2);
    const b = Math.max(k1, k2);
    return normalCDF(b, mu, sigma) - normalCDF(a, mu, sigma);
  } else if (mode === 'outside') {
    const a = Math.min(k1, k2);
    const b = Math.max(k1, k2);
    return 1 - (normalCDF(b, mu, sigma) - normalCDF(a, mu, sigma));
  }
  return 0;
};

// Helper to format (x - μ) in a clean way, avoiding double negatives
const formatNumerator = (value, mu) => {
  const xStr = value.toFixed(2);
  const muStr = mu.toFixed(2);
  if (mu >= 0) {
    return `${xStr} - ${muStr}`;
  } else {
    // mu is negative, so x - μ = x + |μ|
    return `${xStr} + ${Math.abs(mu).toFixed(2)}`;
  }
};

export default function NormalLab() {
  const canvasRef = useRef(null);
  const mathOutputRef = useRef(null);

  // --- State ---
  const [mu, setMu] = useState(0);
  const [sigma, setSigma] = useState(1);
  const [mode, setMode] = useState('lessThan'); // 'lessThan' | 'greaterThan' | 'between' | 'outside'
  const [k1, setK1] = useState(0);   // target value (or lower bound)
  const [k2, setK2] = useState(1);   // upper bound (only used in 'between'/'outside')

  // Bounds checking for between/outside: ensure k1 <= k2
  useEffect(() => {
    if ((mode === 'between' || mode === 'outside') && k1 > k2) {
      setK2(k1);
    }
  }, [mode, k1, k2]);

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
      lineDefault: '#3b82f6',
      areaHighlight: 'rgba(239, 68, 68, 0.3)',
      areaBorder: 'rgba(239, 68, 68, 0.8)',
    };

    // Range for x-axis: mu ± 4*sigma (covers ~99.99%)
    const xMin = mu - 4 * sigma;
    const xMax = mu + 4 * sigma;

    // Generate curve points
    const numPoints = 500;
    const curvePoints = [];
    let maxPDF = 0;
    for (let i = 0; i <= numPoints; i++) {
      const x = xMin + (i / numPoints) * (xMax - xMin);
      const y = normalPDF(x, mu, sigma);
      curvePoints.push({ x, y });
      if (y > maxPDF) maxPDF = y;
    }

    // Compute probability for the selected region
    const prob = getProbability(mu, sigma, mode, k1, k2);

    const margin = { top: 30, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const yMax = maxPDF * 1.15; // leave a little headroom

    // Clear background
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);

    // Scale functions
    const toCanvasX = (x) => margin.left + ((x - xMin) / (xMax - xMin)) * chartWidth;
    const toCanvasY = (y) => height - margin.bottom - (y / yMax) * chartHeight;

    // Draw grid lines and y-axis labels
    ctx.fillStyle = colors.axis;
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const val = (yMax / gridLines) * i;
      const yCanvas = toCanvasY(val);
      ctx.fillText(val.toFixed(3), margin.left - 10, yCanvas);

      ctx.beginPath();
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.moveTo(margin.left, yCanvas);
      ctx.lineTo(width - margin.right, yCanvas);
      ctx.stroke();
    }

    // Draw x-axis labels (tick marks at whole numbers roughly)
    const xStep = Math.max(1, Math.round((xMax - xMin) / 8)); // try to get about 8 ticks
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let xTick = Math.ceil(xMin); xTick <= xMax; xTick += xStep) {
      const xCanvas = toCanvasX(xTick);
      ctx.fillText(xTick.toFixed(0), xCanvas, height - margin.bottom + 8);
    }

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = colors.axis;
    ctx.lineWidth = 2;
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();

    // Draw the normal curve (full)
    ctx.beginPath();
    ctx.strokeStyle = colors.lineDefault;
    ctx.lineWidth = 2.5;
    for (let i = 0; i <= numPoints; i++) {
      const { x, y } = curvePoints[i];
      const cx = toCanvasX(x);
      const cy = toCanvasY(y);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // --- Highlight area under curve ---
    if (mode !== 'exact') { // exact has zero width, no area
      // Determine x-range for shading
      let a = k1;
      let b = k1;
      if (mode === 'lessThan') {
        a = xMin;
        b = k1;
      } else if (mode === 'greaterThan') {
        a = k1;
        b = xMax;
      } else if (mode === 'between' || mode === 'outside') {
        a = Math.min(k1, k2);
        b = Math.max(k1, k2);
      }

      // For 'outside' mode we shade two tails; we'll handle by drawing two polygons.
      const shadeArea = (xStart, xEnd) => {
        ctx.beginPath();
        // Start at baseline at xStart
        ctx.moveTo(toCanvasX(xStart), toCanvasY(0));
        // Go along curve from xStart to xEnd
        for (let i = 0; i <= numPoints; i++) {
          const { x, y } = curvePoints[i];
          if (x >= xStart && x <= xEnd) {
            ctx.lineTo(toCanvasX(x), toCanvasY(y));
          }
        }
        // Down to baseline at xEnd
        ctx.lineTo(toCanvasX(xEnd), toCanvasY(0));
        ctx.closePath();
        ctx.fillStyle = colors.areaHighlight;
        ctx.fill();
        ctx.strokeStyle = colors.areaBorder;
        ctx.lineWidth = 1;
        ctx.stroke();
      };

      if (mode === 'outside') {
        // left tail: xMin to a, and right tail: b to xMax
        shadeArea(xMin, a);
        shadeArea(b, xMax);
      } else {
        shadeArea(a, b);
      }
    }

    // --- Vertical line at k1 (and k2 for between/outside) ---
    const drawVerticalLine = (x) => {
      const cx = toCanvasX(x);
      ctx.beginPath();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.moveTo(cx, toCanvasY(0));
      ctx.lineTo(cx, toCanvasY(maxPDF));
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(x.toFixed(2), cx, toCanvasY(0) - 5);
    };

    drawVerticalLine(k1);
    if (mode === 'between' || mode === 'outside') {
      drawVerticalLine(k2);
    }

    // --- Math Readout Generation ---
    const meanDisplay = mu.toFixed(2);
    const varianceDisplay = (sigma * sigma).toFixed(2);
    const sigmaDisplay = sigma.toFixed(2);
    let latexString = `\\mu = ${meanDisplay}, \\;\\; \\sigma^2 = ${varianceDisplay} \\\\`;

    if (mode === 'lessThan') {
      latexString += `
        P(X \\le ${k1.toFixed(2)}) = \\Phi\\!\\left(\\frac{${formatNumerator(k1, mu)}}{${sigmaDisplay}}\\right) \\\\
        P(X \\le ${k1.toFixed(2)}) \\approx ${(prob * 100).toFixed(2)}\\%
      `;
    } else if (mode === 'greaterThan') {
      latexString += `
        P(X \\ge ${k1.toFixed(2)}) = 1 - \\Phi\\!\\left(\\frac{${formatNumerator(k1, mu)}}{${sigmaDisplay}}\\right) \\\\
        P(X \\ge ${k1.toFixed(2)}) \\approx ${(prob * 100).toFixed(2)}\\%
      `;
    } else if (mode === 'between') {
      const a = Math.min(k1, k2);
      const b = Math.max(k1, k2);
      latexString += `
        P(${a.toFixed(2)} \\le X \\le ${b.toFixed(2)}) = \\\\
        \\quad \\Phi\\!\\left(\\frac{${formatNumerator(b, mu)}}{${sigmaDisplay}}\\right) - \\\\
        \\quad \\Phi\\!\\left(\\frac{${formatNumerator(a, mu)}}{${sigmaDisplay}}\\right) \\\\
        \\approx ${(prob * 100).toFixed(2)}\\%
      `;
    } else if (mode === 'outside') {
      const a = Math.min(k1, k2);
      const b = Math.max(k1, k2);
      latexString += `
        P(X \\le ${a.toFixed(2)} \\text{ or } X \\ge ${b.toFixed(2)}) = \\\\
        \\quad 1 - \\left[ \\Phi\\!\\left(\\frac{${formatNumerator(b, mu)}}{${sigmaDisplay}}\\right) - \\Phi\\!\\left(\\frac{${formatNumerator(a, mu)}}{${sigmaDisplay}}\\right) \\right] \\\\
        \\approx ${(prob * 100).toFixed(2)}\\%
      `;
    }

    if (mathOutputRef.current) {
      katex.render(latexString, mathOutputRef.current, { throwOnError: false, displayMode: true });
    }

  }, [mu, sigma, mode, k1, k2]);

  // --- Inline Styles (same as BinomialLab, with small adjustments) ---
  const styles = {
    wrapper: {
      maxWidth: '1100px',
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
      gridTemplateColumns: '1fr 1fr',  // 50/50 split
      gap: '1rem',
      alignItems: 'start'
    },
    panel: {
      backgroundColor: '#ffffff',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      padding: '1.25rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      overflowX: 'auto'
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
          <div ref={mathOutputRef} style={{ fontSize: '1rem', overflowWrap: 'break-word' }}></div>
        </div>

        <div style={styles.panel}>
          <div style={styles.hubTitle}>Control Panel</div>

          <div style={styles.controlGroup}>
            <div>
              <div style={styles.labelRow}>
                <span>Mean (μ):</span> <span>{mu.toFixed(2)}</span>
              </div>
              <input type="range" min="-10" max="10" step="0.1" value={mu} onChange={(e) => setMu(parseFloat(e.target.value))} style={styles.rangeInput} />
            </div>

            <div>
              <div style={styles.labelRow}>
                <span>Std Dev (σ):</span> <span>{sigma.toFixed(2)}</span>
              </div>
              <input type="range" min="0.1" max="10" step="0.1" value={sigma} onChange={(e) => setSigma(parseFloat(e.target.value))} style={styles.rangeInput} />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.25rem 0' }} />

            <div style={styles.grid2x2}>
              <button style={styles.button(mode === 'lessThan')} onClick={() => setMode('lessThan')}>X ≤ k</button>
              <button style={styles.button(mode === 'greaterThan')} onClick={() => setMode('greaterThan')}>X ≥ k</button>
              <button style={styles.button(mode === 'between')} onClick={() => setMode('between')}>a ≤ X ≤ b</button>
              <button style={styles.button(mode === 'outside')} onClick={() => setMode('outside')}>X ≤ a or X ≥ b</button>
            </div>

            {/* Dynamic Sliders based on Mode */}
            <div style={{ marginTop: '0.5rem' }}>
              {mode !== 'between' && mode !== 'outside' ? (
                <div>
                  <div style={{ ...styles.labelRow, color: '#ef4444' }}>
                    <span>Target (k):</span> <span>{k1.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={mu - 4 * sigma}
                    max={mu + 4 * sigma}
                    step="0.01"
                    value={k1}
                    onChange={(e) => setK1(parseFloat(e.target.value))}
                    style={styles.rangeInput}
                  />
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ ...styles.labelRow, color: '#ef4444' }}>
                      <span>Lower (a):</span> <span>{Math.min(k1, k2).toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={mu - 4 * sigma}
                      max={Math.max(k2, k1)}
                      step="0.01"
                      value={k1}
                      onChange={(e) => setK1(parseFloat(e.target.value))}
                      style={styles.rangeInput}
                    />
                  </div>
                  <div>
                    <div style={{ ...styles.labelRow, color: '#ef4444' }}>
                      <span>Upper (b):</span> <span>{Math.max(k1, k2).toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={Math.min(k1, k2)}
                      max={mu + 4 * sigma}
                      step="0.01"
                      value={k2}
                      onChange={(e) => setK2(parseFloat(e.target.value))}
                      style={styles.rangeInput}
                    />
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