import React, { useEffect, useRef, useState } from 'react';
import './FunctionTranslator.css';
import { observeCanvasResize } from '../utils/canvasUtils.js';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function FunctionTranslator() {
  const containerRef = useRef(null);
  
  const [pShift, setPShift] = useState(0); 
  const [qShift, setQShift] = useState(0); 
  const [funcType, setFuncType] = useState('quadratic');

  const pRef = useRef(pShift);
  const qRef = useRef(qShift);
  const typeRef = useRef(funcType);

  useEffect(() => { pRef.current = pShift; }, [pShift]);
  useEffect(() => { qRef.current = qShift; }, [qShift]);
  useEffect(() => { typeRef.current = funcType; }, [funcType]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = container.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    let animId;
    
    let logicalWidth = canvas.clientWidth || 800;
    let logicalHeight = canvas.clientHeight || 400;
    let centreX = logicalWidth / 2;
    let centreY = logicalHeight / 2;
    const gridSpacing = 30;

    const cleanupObserver = observeCanvasResize(container, canvas, ctx, (width, height) => {
      logicalWidth = width;
      logicalHeight = height;
      centreX = Math.floor(width / 2 / gridSpacing) * gridSpacing;
      centreY = Math.floor(height / 2 / gridSpacing) * gridSpacing;
    });

    const toScreen = (mathX, mathY) => ({
      x: centreX + mathX * gridSpacing,
      y: centreY - mathY * gridSpacing
    });

    const getThemeColor = (varName, fallback) => {
      const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      return val || fallback;
    };

    const drawArrow = (x1, y1, x2, y2, colour, label, offsetX = 0, offsetY = 0) => {
      const headlen = 14; 
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.strokeStyle = colour; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 7), y2 - headlen * Math.sin(angle - Math.PI / 7));
      ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 7), y2 - headlen * Math.sin(angle + Math.PI / 7));
      ctx.fillStyle = colour; ctx.fill();

      if (label) {
        ctx.font = "italic bold 16px var(--__sl-font-sans, system-ui, sans-serif)";
        ctx.fillText(label, x2 + offsetX, y2 + offsetY);
      }
    };

    const evaluateFunction = (type, x) => {
      if (type === 'quadratic') return x * x;
      if (type === 'cubic') return x * x * x;
      if (type === 'reciprocal') return 1 / x;
      if (type === 'log10') return Math.log10(x);
      if (type === 'exp2') return Math.pow(2, x);
      return x * x;
    };

    const drawFunction = (type, shiftX, shiftY, colour, isDashed, weight) => {
      ctx.beginPath();
      ctx.strokeStyle = colour;
      ctx.lineWidth = weight;
      if (isDashed) ctx.setLineDash([5, 5]);

      let firstPoint = true;
      let prevMathY = null;
      let prevMathX = null;
      
      const startX = -centreX / gridSpacing;
      const endX = (logicalWidth - centreX) / gridSpacing;
      const step = 0.02; 

      for (let mathX = startX; mathX <= endX; mathX += step) {
        let evalX = mathX - shiftX;
        
        // Strict cutoff for Log domain
        if (type === 'log10' && evalX <= 0) {
          continue;
        }

        let mathY = evaluateFunction(type, evalX) + shiftY;

        if (type === 'reciprocal' && prevMathX !== null) {
            if (prevMathX - shiftX < 0 && evalX > 0) {
                firstPoint = true;
            }
        }

        const screenP = toScreen(mathX, mathY);

        if (prevMathY !== null && Math.abs(mathY - prevMathY) > 20) {
            firstPoint = true;
        }

        if (firstPoint) {
          if (type === 'log10') {
             // THE ABYSS ANCHOR: Drop a point deeply off-screen down the asymptote 
             // before drawing the first calculated point, so it connects beautifully.
             const abyssScreenP = toScreen(shiftX + 0.0001, -100); 
             ctx.moveTo(abyssScreenP.x, abyssScreenP.y);
             ctx.lineTo(screenP.x, screenP.y);
          } else {
             ctx.moveTo(screenP.x, screenP.y);
          }
          firstPoint = false;
        } else {
          ctx.lineTo(screenP.x, screenP.y);
        }

        prevMathX = mathX;
        prevMathY = mathY;
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const draw = () => {
      const currentP = pRef.current;
      const currentQ = qRef.current;
      const currentType = typeRef.current;

      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      const themeAxis = getThemeColor('--sl-color-text-muted', '#94a3b8');
      const themeGrid = 'rgba(128, 128, 128, 0.2)'; 
      const themeBaseGraph = getThemeColor('--sl-color-gray-4', '#94a3b8');
      const themeAccent = getThemeColor('--sl-color-text-accent', '#3b82f6');

      ctx.beginPath();
      ctx.strokeStyle = themeGrid; ctx.lineWidth = 1;
      for (let x = centreX % gridSpacing; x <= logicalWidth; x += gridSpacing) {
        ctx.moveTo(x, 0); ctx.lineTo(x, logicalHeight);
      }
      for (let y = centreY % gridSpacing; y <= logicalHeight; y += gridSpacing) {
        ctx.moveTo(0, y); ctx.lineTo(logicalWidth, y);
      }
      ctx.stroke();

      drawArrow(10, centreY, logicalWidth - 25, centreY, themeAxis, 'x', 15, 5);
      drawArrow(centreX, logicalHeight - 10, centreX, 25, themeAxis, 'y', 10, -5);

      ctx.font = "11px var(--__sl-font-sans, system-ui, sans-serif)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = themeAxis;

      ctx.fillText('0', centreX - 10, centreY + 12);

      for (let i = -20; i <= 20; i += 1) {
        if (i === 0) continue;
        const px = toScreen(i, 0).x;
        const py = toScreen(0, i).y;
        
        const isLabelTick = i % 2 === 0;

        if (px > 20 && px < logicalWidth - 40) {
          ctx.fillRect(px - 1, centreY - 4, 2, 8); 
          if (isLabelTick) ctx.fillText(i, px, centreY + 16); 
        }
        
        if (py > 40 && py < logicalHeight - 20) {
          ctx.fillRect(centreX - 4, py - 1, 8, 2); 
          if (isLabelTick) ctx.fillText(i, centreX - 16, py); 
        }
      }

      ctx.beginPath();
      ctx.strokeStyle = '#f87171'; 
      ctx.setLineDash([4, 4]);
      
      if (currentType === 'reciprocal') {
        const vAsymp = toScreen(currentP, 0).x;
        ctx.moveTo(vAsymp, 0); ctx.lineTo(vAsymp, logicalHeight);
        const hAsymp = toScreen(0, currentQ).y;
        ctx.moveTo(0, hAsymp); ctx.lineTo(logicalWidth, hAsymp);
      } else if (currentType === 'log10') {
        const vAsymp = toScreen(currentP, 0).x;
        ctx.moveTo(vAsymp, 0); ctx.lineTo(vAsymp, logicalHeight);
      } else if (currentType === 'exp2') {
        const hAsymp = toScreen(0, currentQ).y;
        ctx.moveTo(0, hAsymp); ctx.lineTo(logicalWidth, hAsymp);
      }
      
      ctx.stroke();
      ctx.setLineDash([]);

      drawFunction(currentType, 0, 0, themeBaseGraph, true, 2);
      drawFunction(currentType, currentP, currentQ, themeAccent, false, 3);

      if (currentP !== 0 || currentQ !== 0) {
        let anchorX = 0, anchorY = 0; 
        if (currentType === 'reciprocal') { anchorX = 1; anchorY = 1; }
        if (currentType === 'log10') { anchorX = 1; anchorY = 0; }
        if (currentType === 'exp2') { anchorX = 0; anchorY = 1; }

        const startScreen = toScreen(anchorX, anchorY);
        const endScreen = toScreen(anchorX + currentP, anchorY + currentQ);
        
        ctx.setLineDash([6, 4]);
        drawArrow(startScreen.x, startScreen.y, endScreen.x, endScreen.y, '#f59e0b', 'v', 10, -10);
        ctx.setLineDash([]);
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cleanupObserver();
      cancelAnimationFrame(animId);
    };
  }, []); 

  const getEquationTex = () => {
    const pStr = pShift > 0 ? `- ${pShift}` : pShift < 0 ? `+ ${Math.abs(pShift)}` : '';
    const qStr = qShift > 0 ? `+ ${qShift}` : qShift < 0 ? `- ${Math.abs(qShift)}` : '';
    const xTerm = pShift !== 0 ? `(x ${pStr})` : 'x';

    let tex = '';
    switch (funcType) {
      case 'quadratic': tex = `y = ${pShift !== 0 ? xTerm + '^2' : 'x^2'} ${qStr}`; break;
      case 'cubic':     tex = `y = ${pShift !== 0 ? xTerm + '^3' : 'x^3'} ${qStr}`; break;
      case 'reciprocal':tex = `y = \\frac{1}{${pShift !== 0 ? `x ${pStr}` : 'x'}} ${qStr}`; break;
      case 'log10':     tex = `y = \\log_{10}${pShift !== 0 ? xTerm : '(x)'} ${qStr}`; break;
      case 'exp2':      tex = `y = 2^{${pShift !== 0 ? `x ${pStr}` : 'x'}} ${qStr}`; break;
      default:          tex = `y = x^2`;
    }
    return tex.trim();
  };

  const getVectorTex = () => `\\begin{pmatrix} ${pShift} \\\\ ${qShift} \\end{pmatrix}`;

  return (
    <div className="func-root" ref={containerRef}>
      
      <div className="func-canvas-container">
        <canvas className="func-canvas"></canvas>
      </div>
      
      <div className="func-dashboard">
        <div className="func-control-group">
          <div>
            <label className="func-label">Base Function: f(x)</label>
            <select 
              className="func-select"
              value={funcType} 
              onChange={(e) => {
                setFuncType(e.target.value);
                setPShift(0);
                setQShift(0);
              }}
            >
              <option value="quadratic">Quadratic (x²)</option>
              <option value="cubic">Cubic (x³)</option>
              <option value="reciprocal">Reciprocal (1/x)</option>
              <option value="log10">Logarithmic (log₁₀ x)</option>
              <option value="exp2">Exponential (2ˣ)</option>
            </select>
          </div>

          <div>
            <label className="func-label">
              <span>Horizontal Shift (p)</span>
              <span>{pShift}</span>
            </label>
            <input 
              type="range" min="-10" max="10" step="1" value={pShift} 
              onChange={(e) => setPShift(parseInt(e.target.value))} 
              style={{ width: '100%', accentColor: 'var(--sl-color-text-accent)' }} 
            />
          </div>

          <div>
            <label className="func-label">
              <span>Vertical Shift (q)</span>
              <span>{qShift}</span>
            </label>
            <input 
              type="range" min="-10" max="10" step="1" value={qShift} 
              onChange={(e) => setQShift(parseInt(e.target.value))} 
              style={{ width: '100%', accentColor: 'var(--sl-color-text-accent)' }} 
            />
          </div>
        </div>

        <div className="func-math-wrapper">
          <div className="func-math-group" style={{ flex: '0 0 130px' }}>
             <div className="func-math-title">Vector</div>
             <div 
               style={{ color: 'var(--sl-color-text)' }}
               dangerouslySetInnerHTML={{ 
                 __html: katex.renderToString(getVectorTex(), { displayMode: true, throwOnError: false }) 
               }} 
             />
          </div>

          <div className="func-math-group" style={{ flex: 1 }}>
             <div className="func-math-title">Equation</div>
             <div 
               style={{ color: 'var(--sl-color-text-accent)' }}
               dangerouslySetInnerHTML={{ 
                 __html: katex.renderToString(getEquationTex(), { displayMode: true, throwOnError: false }) 
               }} 
             />
          </div>
        </div>
      </div>
    </div>
  );
}