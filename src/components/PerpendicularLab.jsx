import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import './CircleSimulator.css';
import { getScaledPointerPos, observeCanvasResize } from '../utils/canvasUtils.js';

export default function PerpendicularLab({ mode = 'gradients' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = container.querySelector('canvas');
    const mathOutput = container.querySelector('.sim-math-readout');
    const switchBtn = container.querySelector('#switchBtn');
    const ctx = canvas.getContext('2d');
    let animId;
    
    const gridSpacing = 30; 

    let points = [];
    if (mode === 'bisector') {
      points = [
        { x: -4, y: -2, label: 'A' },
        { x: 2, y: 2, label: 'B' }
      ];
    } else {
      points = [
        { x: -4, y: -1, label: 'A' },
        { x: 2, y: 3, label: 'B' },
        { x: -2, y: 4, label: 'C' }
      ];
    }

    if (switchBtn) {
      switchBtn.textContent = 'Randomise Points';
      switchBtn.onclick = () => {
        points.forEach(p => {
          p.x = Math.floor(Math.random() * 16) - 8;
          p.y = Math.floor(Math.random() * 16) - 8;
        });
        if (points[0].x === points[1].x && points[0].y === points[1].y) {
          points[1].x += 2;
        }
      };
    }

    let draggingPoint = null;
    let centreX, centreY;

    function getThemeColors() {
      const isDark = document.documentElement.dataset.theme === 'dark' ||
        (!document.documentElement.dataset.theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      return {
        text: isDark ? '#c2c6d6' : '#17181c', 
        grid: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        axis: isDark ? '#5c6a82' : '#8890a4',
        line1: isDark ? '#54aeff' : '#1166e2',  
        line2: isDark ? '#ff5e5e' : '#d13232',  
        midpoint: isDark ? '#4ade80' : '#168038' 
      };
    }

    const cleanupResize = observeCanvasResize(container, canvas, ctx, (width, height) => {
      centreX = width / 2;
      centreY = height / 2;
    });

    const toScreen = (p) => ({ x: centreX + p.x * gridSpacing, y: centreY - p.y * gridSpacing });
    const fromScreen = (pos) => ({
      x: Math.round((pos.x - centreX) / gridSpacing),
      y: Math.round((centreY - pos.y) / gridSpacing)
    });

    const gcd = (a, b) => {
      a = Math.abs(a); b = Math.abs(b);
      while (b) { let t = b; b = a % b; a = t; }
      return a;
    };

    const getFractionTex = (n, d) => {
      if (d === 0) return "\\text{undefined}";
      if (n === 0) return "0";
      let sign = (n < 0) ^ (d < 0) ? "-" : "";
      n = Math.abs(n); d = Math.abs(d);
      let divisor = gcd(n, d);
      n /= divisor; d /= divisor;
      if (d === 1) return `${sign}${n}`;
      return `${sign}\\frac{${n}}{${d}}`;
    };

    const formatEqTex = (dy, dx, pt) => {
      if (dx === 0) return `x = ${pt.x}`;
      if (dy === 0) return `y = ${pt.y}`;
      
      let mStr = getFractionTex(dy, dx);
      let cNum = pt.y * dx - pt.x * dy;
      let cDen = dx;
      let cStrRaw = getFractionTex(cNum, cDen);
      
      let xTerm = mStr === "1" ? "x" : (mStr === "-1" ? "-x" : `${mStr}x`);
      if (cStrRaw === "0") return `y = ${xTerm}`;
      
      let cFormatted = cStrRaw.startsWith("-") ? `- ${cStrRaw.slice(1)}` : `+ ${cStrRaw}`;
      return `y = ${xTerm} ${cFormatted}`;
    };

    const subTex = (a, bStr) => {
      if (bStr.startsWith('-')) return `${a} - \\left(${bStr}\\right)`;
      return `${a} - ${bStr}`;
    };

    const drawArrow = (x1, y1, x2, y2, color, label) => {
      const headlen = 16; 
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 7), y2 - headlen * Math.sin(angle - Math.PI / 7));
      ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 7), y2 - headlen * Math.sin(angle + Math.PI / 7));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      if (label) {
        ctx.font = "italic 14px serif";
        ctx.fillText(label, x2 - 20, y2 + 18);
      }
    };

    const drawInfiniteLine = (p, dx, dy, color, dashed = false) => {
      if (dashed) ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      let t = 100;
      let p1 = toScreen({ x: p.x - t * dx, y: p.y - t * dy });
      let p2 = toScreen({ x: p.x + t * dx, y: p.y + t * dy });
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawSingleNotch = (s1, s2, theme) => {
      const dsx = s2.x - s1.x;
      const dsy = s2.y - s1.y;
      const len = Math.hypot(dsx, dsy);
      if (len === 0) return;
      
      const nx = (-dsy / len) * 6; 
      const ny = (dsx / len) * 6;
      
      const midX = (s1.x + s2.x) / 2;
      const midY = (s1.y + s2.y) / 2;
      
      ctx.beginPath();
      ctx.strokeStyle = theme.line1;
      ctx.lineWidth = 2;
      ctx.moveTo(midX - nx, midY - ny);
      ctx.lineTo(midX + nx, midY + ny);
      ctx.stroke();
    };

    const draw = () => {
      const logicalWidth = centreX * 2;
      const logicalHeight = centreY * 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const theme = getThemeColors();

      ctx.beginPath();
      ctx.strokeStyle = theme.grid;
      ctx.lineWidth = 1;
      const startX = centreX % gridSpacing;
      const startY = centreY % gridSpacing;

      for (let x = startX; x <= logicalWidth; x += gridSpacing) { ctx.moveTo(x, 0); ctx.lineTo(x, logicalHeight); }
      for (let y = startY; y <= logicalHeight; y += gridSpacing) { ctx.moveTo(0, y); ctx.lineTo(logicalWidth, y); }
      ctx.stroke();

      drawArrow(5, centreY, logicalWidth - 5, centreY, theme.axis, 'x');
      drawArrow(centreX, logicalHeight - 5, centreX, 5, theme.axis, 'y');

      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = theme.axis;

      for (let i = -25; i <= 25; i += 2) {
        if (i === 0) continue;
        const pX = toScreen({ x: i, y: 0 });
        const pY = toScreen({ x: 0, y: i });
        
        if (pX.x > 5 && pX.x < logicalWidth - 25) {
          ctx.fillText(i, pX.x, centreY + 14);
          ctx.fillRect(pX.x - 0.5, centreY - 3, 1, 6);
        }
        if (pY.y > 25 && pY.y < logicalHeight - 5) {
          ctx.fillText(i, centreX - 14, pY.y);
          ctx.fillRect(centreX - 3, pY.y - 0.5, 6, 1);
        }
      }

      const pA = points[0];
      const pB = points[1];
      const dx1 = pB.x - pA.x;
      const dy1 = pB.y - pA.y;
      
      let dx2 = -dy1;
      let dy2 = dx1;
      if (mode === 'parallel') {
        dx2 = dx1;
        dy2 = dy1;
      }
      
      let pTarget;
      let midpoint = null;

      if (mode === 'bisector') {
        midpoint = { x: (pA.x + pB.x) / 2, y: (pA.y + pB.y) / 2 };
        pTarget = midpoint;
      } else {
        pTarget = points[2];
      }

      const num_t = (pTarget.x - pA.x) * dx1 + (pTarget.y - pA.y) * dy1;
      const den_t = dx1 * dx1 + dy1 * dy1;
      let intersect = null;
      if (den_t !== 0) {
        const t = num_t / den_t;
        intersect = { x: pA.x + t * dx1, y: pA.y + t * dy1 };
      }
      if (mode === 'bisector') intersect = midpoint;

      if (mode === 'bisector') {
        const sA = toScreen(pA);
        const sB = toScreen(pB);
        const sM = toScreen(midpoint);
        ctx.beginPath(); ctx.strokeStyle = theme.line1; ctx.lineWidth = 2;
        ctx.moveTo(sA.x, sA.y); ctx.lineTo(sB.x, sB.y); ctx.stroke();
        
        drawSingleNotch(sA, sM, theme);
        drawSingleNotch(sM, sB, theme);
        
      } else {
        drawInfiniteLine(pA, dx1, dy1, theme.line1);
      }
      
      if (mode === 'distance') {
        if (intersect) {
          ctx.beginPath();
          ctx.strokeStyle = theme.line2;
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          const sC = toScreen(pTarget);
          const sP = toScreen(intersect);
          ctx.moveTo(sC.x, sC.y);
          ctx.lineTo(sP.x, sP.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else {
        drawInfiniteLine(pTarget, dx2, dy2, theme.line2, true);
      }

      if ((dx1 !== 0 || dy1 !== 0) && mode !== 'parallel' && intersect) {
        const sInt = toScreen(intersect);
        const angle = Math.atan2(dy1, dx1);
        const size = 12;
        ctx.save();
        ctx.translate(sInt.x, sInt.y);
        ctx.rotate(-angle);
        ctx.beginPath();
        ctx.strokeStyle = theme.text;
        ctx.lineWidth = 1;
        ctx.rect(0, 0, size, -size);
        ctx.stroke();
        ctx.restore();
      }

      ctx.font = "bold 12px sans-serif";
      points.forEach(p => {
        const s = toScreen(p);
        ctx.beginPath();
        ctx.fillStyle = p.label === 'C' ? theme.line2 : theme.line1;
        ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = theme.text;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        ctx.fillStyle = theme.text;
        ctx.fillText(p.label, s.x + 12, s.y - 12);
      });

      if (mode === 'bisector' && midpoint) {
        const s = toScreen(midpoint);
        ctx.beginPath();
        ctx.fillStyle = theme.midpoint;
        ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = theme.text; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = theme.text;
        ctx.fillText("M", s.x + 12, s.y - 12);
      } else if (mode === 'distance' && intersect) {
        const s = toScreen(intersect);
        ctx.beginPath();
        ctx.fillStyle = theme.midpoint;
        ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = theme.text; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = theme.text;
        ctx.fillText("P", s.x + 12, s.y - 12);
      }

      let hudData = [];
      const m1 = getFractionTex(dy1, dx1);
      const m2 = getFractionTex(dy2, dx2);
      const eq1 = formatEqTex(dy1, dx1, pA);
      const eq2 = mode === 'bisector' && midpoint ? formatEqTex(dy2, dx2, midpoint) : formatEqTex(dy2, dx2, pTarget);

      if (mode === 'gradients') {
        hudData.push({ label: "Gradient m₁", math: `\\displaystyle ${m1}`, color: theme.line1 });
        hudData.push({ label: "Gradient m₂ (⊥)", math: `\\displaystyle ${m2}`, color: theme.line2 });
      } 
      else if (mode === 'point') {
        hudData.push({ label: "Line L₁", math: `\\displaystyle ${eq1}`, color: theme.line1 });
        hudData.push({ label: "Line L₂ (through C)", math: `\\displaystyle ${eq2}`, color: theme.line2 });
      } 
      else if (mode === 'bisector') {
        const midX = getFractionTex(midpoint.x, 1);
        const midY = getFractionTex(midpoint.y, 1);
        hudData.push({ label: "Midpoint M", math: `\\displaystyle \\left(${midX}, ${midY}\\right)`, color: theme.midpoint });
        hudData.push({ label: "Perp. Bisector", math: `\\displaystyle ${eq2}`, color: theme.line2 });
      } 
      else if (mode === 'parallel') {
        hudData.push({ label: "Line L₁", math: `\\displaystyle ${eq1}`, color: theme.line1 });
        hudData.push({ label: "Line L₂ (parallel)", math: `\\displaystyle ${eq2}`, color: theme.line2 });
        hudData.push({ label: "Gradient m", math: `\\displaystyle ${m1}`, color: theme.text });
      } 
      else if (mode === 'distance') {
        hudData.push({ label: "Line L₁", math: `\\displaystyle ${eq1}`, color: theme.line1 });
        if (den_t === 0) {
          hudData.push({ label: "Error", math: "\\text{A and B overlap!}", color: theme.line2 });
        } else {
          const pX = getFractionTex(pA.x * den_t + num_t * dx1, den_t);
          const pY = getFractionTex(pA.y * den_t + num_t * dy1, den_t);
          const dVal = Math.hypot(pTarget.x - intersect.x, pTarget.y - intersect.y).toFixed(2);
          hudData.push({ label: "Intersection P", math: `\\displaystyle \\left(${pX}, ${pY}\\right)`, color: theme.midpoint });
          hudData.push({ label: "Distance CP", math: `\\displaystyle \\sqrt{\\left(${subTex(pTarget.x, pX)}\\right)^2 + \\left(${subTex(pTarget.y, pY)}\\right)^2} \\approx ${dVal}`, color: theme.line2 });
        }
      }

      const rowsHtml = hudData.map(row => {
        const mathHtml = katex.renderToString(row.math, { displayMode: false, throwOnError: false });
        return `
          <div style="color: ${row.color}; font-weight: 600; text-align: right; white-space: nowrap;">
            ${row.label}
          </div>
          <div style="color: ${row.color}; font-weight: 600; text-align: center;">
            :
          </div>
          <div style="color: ${row.color}; text-align: left; overflow: visible; white-space: nowrap; padding: 8px 0; line-height: 1.2;">
            ${mathHtml}
          </div>
        `;
      }).join('');

      const finalHtml = `
        <div style="display: grid; grid-template-columns: max-content auto 1fr; gap: 4px 12px; align-items: center; width: 100%; font-size: 14px; font-family: var(--sl-font, sans-serif);">
          ${rowsHtml}
        </div>
      `;

      if (mathOutput.dataset.lastHtml !== finalHtml) {
        mathOutput.innerHTML = finalHtml;
        mathOutput.dataset.lastHtml = finalHtml;
      }

      animId = requestAnimationFrame(draw);
    };

    const onDown = (e) => {
      const { x: mx, y: my } = getScaledPointerPos(canvas, e);
      draggingPoint = points.find(p => Math.hypot(toScreen(p).x - mx, toScreen(p).y - my) < 20);
    };

    const onMove = (e) => {
      if (!draggingPoint) return;
      const { x: mx, y: my } = getScaledPointerPos(canvas, e);
      const pos = fromScreen({ x: mx, y: my });
      draggingPoint.x = pos.x; 
      draggingPoint.y = pos.y;
    };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', () => draggingPoint = null);
    window.addEventListener('touchend', () => draggingPoint = null);

    draw();
    return () => { 
      cancelAnimationFrame(animId); 
      cleanupResize(); 
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('touchstart', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
    };
  }, [mode]);

  return (
    <div ref={containerRef} className="sim-root">
      <div className="sim-canvas-container">
        <canvas className="sim-canvas"></canvas>
        <div className="sim-overlay">
          <div 
            className="sim-math-readout" 
            style={{ 
              pointerEvents: 'none', // Set to none to allow clicking through the HUD
              padding: '12px 16px',
              maxWidth: 'calc(100% - 40px)' 
            }}
          ></div>
          <div className="sim-controls">
            <button id="switchBtn" className="sim-action-btn"></button>
          </div>
        </div>
      </div>
    </div>
  );
}