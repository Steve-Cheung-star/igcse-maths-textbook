import React, { useEffect, useRef } from 'react';
import './CircleSimulator.css';
import { getScaledPointerPos, observeCanvasResize } from '../utils/canvasUtils.js';

export default function TransformationLab({ category = 'translation' }) {
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

    let currentMode = category;
    let scaleFactor = 2;
    let rotationDegree = 0;
    let activeVariant = 0;

    const rotSlider = container.querySelector('#rotSlider');
    const rotOut = container.querySelector('#rotOut');
    if (rotSlider && rotOut) {
      rotSlider.addEventListener('input', (e) => {
        rotationDegree = parseInt(e.target.value);
        rotOut.textContent = rotationDegree;
      });
    }

    const scaleSlider = container.querySelector('#scaleSlider');
    const scaleOut = container.querySelector('#scaleOut');
    if (scaleSlider && scaleOut) {
      scaleSlider.addEventListener('input', (e) => {
        scaleFactor = parseFloat(e.target.value);
        scaleOut.textContent = scaleFactor;
      });
    }

    let points = [
      { x: -4, y: 1, label: 'A' },
      { x: -1, y: 1, label: 'B' },
      { x: -1, y: 4, label: 'C' },
      { x: -4, y: 4, label: 'D' }
    ];

    let toolPoints = [];
    const initTools = () => {
      if (currentMode === 'translation') {
        toolPoints = [{ x: 6, y: 2, type: 'vector' }];
      } else if (currentMode === 'reflection') {
        toolPoints = [
          { x: 0, y: 6, type: 'line-end' }, 
          { x: 0, y: -6, type: 'line-end' },
          { x: 0, y: 0, type: 'line-centre' } 
        ];
      } else {
        toolPoints = [{ x: 0, y: 0, type: 'centre', label: 'C' }];
      }
    };
    initTools();

    // Setup the Randomise / Toggle Button
    if (switchBtn) {
      switchBtn.textContent = currentMode === 'translation' ? 'Randomise Vector' : 'Toggle Preset';
      switchBtn.onclick = () => {
        if (currentMode === 'translation') {
          toolPoints[0].x = Math.floor(Math.random() * 10) - 5;
          toolPoints[0].y = Math.floor(Math.random() * 10) - 5;
        } else if (currentMode === 'reflection') {
          activeVariant = (activeVariant + 1) % 4;
          const cx = toolPoints[2].x;
          const cy = toolPoints[2].y;
          if (activeVariant === 0) { // Vertical
            toolPoints[0] = { x: cx, y: cy + 6, type: 'line-end' };
            toolPoints[1] = { x: cx, y: cy - 6, type: 'line-end' };
          } else if (activeVariant === 1) { // Horizontal
            toolPoints[0] = { x: cx - 6, y: cy, type: 'line-end' };
            toolPoints[1] = { x: cx + 6, y: cy, type: 'line-end' };
          } else if (activeVariant === 2) { // y = x
            toolPoints[0] = { x: cx - 6, y: cy - 6, type: 'line-end' };
            toolPoints[1] = { x: cx + 6, y: cy + 6, type: 'line-end' };
          } else if (activeVariant === 3) { // y = -x
            toolPoints[0] = { x: cx - 6, y: cy + 6, type: 'line-end' };
            toolPoints[1] = { x: cx + 6, y: cy - 6, type: 'line-end' };
          }
        } else if (currentMode === 'rotation') {
          rotationDegree += 90;
          if (rotationDegree > 360) rotationDegree = -270; // Cycle back around within slider bounds
          if (rotSlider) rotSlider.value = rotationDegree;
          if (rotOut) rotOut.textContent = rotationDegree;
        } else if (currentMode === 'enlargement') {
          scaleFactor += 0.5;
          if (scaleFactor > 4) scaleFactor = -2; // Cycle back to a negative scale factor
          if (scaleSlider) scaleSlider.value = scaleFactor;
          if (scaleOut) scaleOut.textContent = scaleFactor;
        }
      };
    }

    let draggingPoint = null;
    let centreX, centreY;

    function getThemeColors() {
      const isDark = document.documentElement.dataset.theme === 'dark' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      return {
        text: isDark ? '#f8fafc' : '#0f172a',
        grid: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        axis: isDark ? '#94a3b8' : '#64748b',
        object: '#3b82f6',
        image: '#ef4444',
        tool: '#f59e0b',
        toolAlt: '#10b981'
      };
    }

    const cleanupResize = observeCanvasResize(container, canvas, ctx, (width, height) => {
      centreX = Math.floor(width / 2 / gridSpacing) * gridSpacing;
      centreY = Math.floor(height / 2 / gridSpacing) * gridSpacing;
    });

    const toScreen = (p) => ({ x: centreX + p.x * gridSpacing, y: centreY - p.y * gridSpacing });
    const fromScreen = (pos) => ({
      x: Math.round((pos.x - centreX) / gridSpacing),
      y: Math.round((centreY - pos.y) / gridSpacing)
    });

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
        ctx.fillText(label, x2 - 20, y2 + 15);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const theme = getThemeColors();

      // Grid & Axes
      ctx.beginPath();
      ctx.strokeStyle = theme.grid;
      ctx.lineWidth = 1;
      for (let x = 0; x <= canvas.width; x += gridSpacing) { ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); }
      for (let y = 0; y <= canvas.height; y += gridSpacing) { ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); }
      ctx.stroke();

      drawArrow(10, centreY, canvas.width - 10, centreY, theme.axis, 'x');
      drawArrow(centreX, canvas.height - 10, centreX, 10, theme.axis, 'y');

      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = theme.axis;

      for (let i = -20; i <= 20; i += 2) {
        if (i === 0) continue;
        const pX = toScreen({ x: i, y: 0 });
        const pY = toScreen({ x: 0, y: i });
        if (pX.x > 20 && pX.x < canvas.width - 20) {
          ctx.fillText(i, pX.x, centreY + 14);
          ctx.fillRect(pX.x - 0.5, centreY - 3, 1, 6);
        }
        if (pY.y > 20 && pY.y < canvas.height - 20) {
          ctx.fillText(i, centreX - 14, pY.y);
          ctx.fillRect(centreX - 3, pY.y - 0.5, 6, 1);
        }
      }

      let imagePoints = [];
      let displayMath = "";

      // Logic & Formatting Output
      if (currentMode === 'translation') {
        const v = toolPoints[0];
        imagePoints = points.map(p => ({ x: p.x + v.x, y: p.y + v.y }));
        displayMath = `Translation Vector: (${v.x}, ${v.y})`;
        
        const sStart = toScreen(points[0]);
        const sEnd = toScreen(imagePoints[0]);
        ctx.setLineDash([4, 4]);
        drawArrow(sStart.x, sStart.y, sEnd.x, sEnd.y, theme.tool, 'v');
        ctx.setLineDash([]);
        
      } else if (currentMode === 'reflection') {
        const [p1, p2, pCentre] = toolPoints;
        const dx = p2.x - p1.x, dy = p2.y - p1.y, d2 = dx * dx + dy * dy;
        imagePoints = points.map(p => {
          if(d2 === 0) return p; 
          const t = ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / d2;
          const px = p1.x + t * dx, py = p1.y + t * dy;
          return { x: 2 * px - p.x, y: 2 * py - p.y };
        });

        // Determine Equation of the line
        let eq = "";
        if (Math.abs(dx) < 0.01) {
          eq = `x = ${Math.round(p1.x)}`;
        } else if (Math.abs(dy) < 0.01) {
          eq = `y = ${Math.round(p1.y)}`;
        } else {
          const m = dy / dx;
          const yInt = p1.y - m * p1.x;
          const val = Math.abs(Math.round(yInt));
          const interceptStr = val === 0 ? '' : ` ${yInt > 0 ? '+' : '-'} ${val}`;
          
          if (Math.abs(m - 1) < 0.01) {
            eq = `y = x${interceptStr}`;
          } else if (Math.abs(m + 1) < 0.01) {
            eq = `y = -x${interceptStr}`;
          } else {
            eq = `y = ${m.toFixed(1)}x ${yInt > 0 ? '+' : '-'} ${Math.abs(yInt).toFixed(1)}`;
          }
        }
        displayMath = `Reflection in line: ${eq}`;

        const s1 = toScreen({ x: p1.x - dx * 20, y: p1.y - dy * 20 });
        const s2 = toScreen({ x: p2.x + dx * 20, y: p2.y + dy * 20 });
        ctx.beginPath(); ctx.strokeStyle = theme.tool; ctx.setLineDash([5, 5]); ctx.lineWidth = 2;
        ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke(); ctx.setLineDash([]);
        
      } else if (currentMode === 'rotation') {
        const c = toolPoints[0];
        const angleInRads = rotationDegree * (Math.PI / 180);
        imagePoints = points.map(p => ({
          x: c.x + (p.x - c.x) * Math.cos(angleInRads) - (p.y - c.y) * Math.sin(angleInRads),
          y: c.y + (p.x - c.x) * Math.sin(angleInRads) + (p.y - c.y) * Math.cos(angleInRads)
        }));

        let normalisedDeg = rotationDegree % 360;
        let absDeg = Math.abs(normalisedDeg);
        if (absDeg === 0 || absDeg === 360) {
            displayMath = `Rotation around (${c.x}, ${c.y}) by 0°`;
        } else if (absDeg === 180) {
            displayMath = `Rotation around (${c.x}, ${c.y}) by 180°`;
        } else if (normalisedDeg > 0) {
            displayMath = `Rotation around (${c.x}, ${c.y}): ${normalisedDeg}° anticlockwise (or ${360 - normalisedDeg}° clockwise)`;
        } else {
            displayMath = `Rotation around (${c.x}, ${c.y}): ${absDeg}° clockwise (or ${360 - absDeg}° anticlockwise)`;
        }
        
      } else if (currentMode === 'enlargement') {
        const c = toolPoints[0];
        imagePoints = points.map(p => ({ x: c.x + scaleFactor * (p.x - c.x), y: c.y + scaleFactor * (p.y - c.y) }));
        displayMath = `Enlargement k=${scaleFactor} from centre (${c.x}, ${c.y})`;
      }

      // Shapes
      const drawShape = (pts, colour, dashed) => {
        ctx.beginPath(); ctx.strokeStyle = colour; ctx.lineWidth = 2;
        if (dashed) ctx.setLineDash([4, 4]);
        const sStart = toScreen(pts[0]); ctx.moveTo(sStart.x, sStart.y);
        pts.forEach(p => { const sp = toScreen(p); ctx.lineTo(sp.x, sp.y); });
        ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = colour + '15'; ctx.fill();
        ctx.fillStyle = colour;
        pts.forEach((p, i) => {
          const sp = toScreen(p);
          ctx.fillText(points[i].label + (dashed ? "'" : ""), sp.x + 12, sp.y - 12);
        });
      };
      drawShape(points, theme.object, false);
      drawShape(imagePoints, theme.image, true);

      // Draggable Nodes for Object (Blue)
      points.forEach(p => {
        const s = toScreen(p);
        ctx.beginPath();
        ctx.fillStyle = theme.object;
        ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Tool Handles
      const handles = (currentMode === 'translation')
        ? [{ x: points[0].x + toolPoints[0].x, y: points[0].y + toolPoints[0].y, type: 'vector' }]
        : toolPoints;

      handles.forEach(p => {
        const s = toScreen(p);
        ctx.beginPath(); 
        ctx.fillStyle = p.type === 'line-centre' ? theme.toolAlt : theme.tool;
        ctx.arc(s.x, s.y, 6, 0, Math.PI * 2); 
        ctx.fill();
      });

      mathOutput.innerHTML = displayMath;
      animId = requestAnimationFrame(draw);
    };

    const onDown = (e) => {
      const { x: mx, y: my } = getScaledPointerPos(canvas, e);
      
      if (currentMode === 'translation') {
        const sTip = toScreen({ x: points[0].x + toolPoints[0].x, y: points[0].y + toolPoints[0].y });
        if (Math.hypot(sTip.x - mx, sTip.y - my) < 20) { draggingPoint = toolPoints[0]; return; }
      }

      draggingPoint = toolPoints.find(p => Math.hypot(toScreen(p).x - mx, toScreen(p).y - my) < 20) ||
                      points.find(p => Math.hypot(toScreen(p).x - mx, toScreen(p).y - my) < 20);
    };

    const onMove = (e) => {
      if (!draggingPoint) return;
      const { x: mx, y: my } = getScaledPointerPos(canvas, e);
      const pos = fromScreen({ x: mx, y: my });
      
      if (draggingPoint.type === 'vector') {
        draggingPoint.x = pos.x - points[0].x; 
        draggingPoint.y = pos.y - points[0].y;
      } else if (draggingPoint.type === 'line-centre') {
        const dx = pos.x - draggingPoint.x;
        const dy = pos.y - draggingPoint.y;
        toolPoints[0].x += dx; toolPoints[0].y += dy;
        toolPoints[1].x += dx; toolPoints[1].y += dy;
        toolPoints[2].x += dx; toolPoints[2].y += dy;
      } else {
        draggingPoint.x = pos.x; 
        draggingPoint.y = pos.y;
        
        if (draggingPoint.type === 'line-end' && toolPoints.length === 3) {
          toolPoints[2].x = (toolPoints[0].x + toolPoints[1].x) / 2;
          toolPoints[2].y = (toolPoints[0].y + toolPoints[1].y) / 2;
        }
      }
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
  }, [category]);

  return (
    <div ref={containerRef} className="sim-root" style={{ margin: '2rem 0' }}>
      <div className="sim-canvas-container" style={{ position: 'relative', height: '500px', background: 'var(--sl-color-bg)', borderRadius: '12px', border: '1px solid var(--sl-color-hairline)', overflow: 'hidden' }}>
        <canvas className="sim-canvas" style={{ width: '100%', height: '100%', display: 'block' }}></canvas>
        <div className="sim-overlay" style={{ position: 'absolute', top: '10px', left: '10px', pointerEvents: 'none' }}>
          <div className="sim-math-readout" style={{ fontWeight: '600', marginBottom: '10px', color: 'var(--sl-color-text)' }}></div>
          <div className="sim-controls" style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            <button id="switchBtn" style={{ padding: '6px 12px', cursor: 'pointer', display: 'block', background: 'var(--sl-color-bg-nav)', border: '1px solid var(--sl-color-hairline)', borderRadius: '6px', color: 'var(--sl-color-text)' }}></button>

            {category === 'rotation' && (
              <div style={{ background: 'var(--sl-color-bg)', padding: '10px', borderRadius: '8px', border: '1px solid var(--sl-color-hairline)', color: 'var(--sl-color-text)' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px' }}>
                  Angle: <span id="rotOut">0</span>°
                </label>
                <input type="range" id="rotSlider" min="-360" max="360" defaultValue="0" step="1" style={{ width: '150px' }} />
              </div>
            )}

            {category === 'enlargement' && (
              <div style={{ background: 'var(--sl-color-bg)', padding: '10px', borderRadius: '8px', border: '1px solid var(--sl-color-hairline)', color: 'var(--sl-color-text)' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px' }}>
                  Scale Factor: <span id="scaleOut">2</span>
                </label>
                <input type="range" id="scaleSlider" min="-5" max="5" defaultValue="2" step="0.5" style={{ width: '150px' }} />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}