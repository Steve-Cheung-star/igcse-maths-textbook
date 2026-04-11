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
    let activeVariant = 0;
    let scaleFactor = 2;
    let rotationMode = 0;

    let points = [
      { x: -4, y: 1, label: 'A' },
      { x: -1, y: 1, label: 'B' },
      { x: -4, y: 4, label: 'C' }
    ];

    let toolPoints = [];
    const initTools = () => {
      if (currentMode === 'translation') toolPoints = [{ x: 5, y: 2, type: 'vector' }];
      else if (currentMode === 'reflection') toolPoints = [{ x: 0, y: 6, type: 'line' }, { x: 0, y: -6, type: 'line' }];
      else toolPoints = [{ x: 0, y: 0, type: 'center', label: 'C' }];
    };
    initTools();

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
        tool: '#f59e0b'
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

    const drawArrow = (x1, y1, x2, y2, theme, label) => {
      const headlen = 10;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = theme.axis;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 7), y2 - headlen * Math.sin(angle - Math.PI / 7));
      ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 7), y2 - headlen * Math.sin(angle + Math.PI / 7));
      ctx.closePath();
      ctx.fillStyle = theme.axis;
      ctx.fill();
      if (label) {
        ctx.font = "italic 14px serif";
        if (label === 'x') ctx.fillText(label, x2 - 10, y2 + 20);
        else ctx.fillText(label, x2 - 20, y2 + 15);
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

      drawArrow(10, centreY, canvas.width - 10, centreY, theme, 'x');
      drawArrow(centreX, canvas.height - 10, centreX, 10, theme, 'y');

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

      // Logic
      if (currentMode === 'translation') {
        const v = toolPoints[0];
        imagePoints = points.map(p => ({ x: p.x + v.x, y: p.y + v.y }));
        displayMath = `Translation Vector: (${v.x}, ${v.y})`;
      } else if (currentMode === 'reflection') {
        const [p1, p2] = toolPoints;
        const dx = p2.x - p1.x, dy = p2.y - p1.y, d2 = dx * dx + dy * dy;
        imagePoints = points.map(p => {
          const t = ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / d2;
          const px = p1.x + t * dx, py = p1.y + t * dy;
          return { x: 2 * px - p.x, y: 2 * py - p.y };
        });
        const s1 = toScreen({ x: p1.x - dx * 20, y: p1.y - dy * 20 });
        const s2 = toScreen({ x: p2.x + dx * 20, y: p2.y + dy * 20 });
        ctx.beginPath(); ctx.strokeStyle = theme.tool; ctx.setLineDash([5, 5]); ctx.lineWidth = 2;
        ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke(); ctx.setLineDash([]);
        displayMath = `Reflection line logic...`; // Simplified for brevity
      } else if (currentMode === 'rotation') {
        const c = toolPoints[0];
        const angle = [-Math.PI / 2, Math.PI / 2, Math.PI][rotationMode];
        imagePoints = points.map(p => ({
          x: c.x + (p.x - c.x) * Math.cos(angle) - (p.y - c.y) * Math.sin(angle),
          y: c.y + (p.x - c.x) * Math.sin(angle) + (p.y - c.y) * Math.cos(angle)
        }));
        displayMath = `Rotation around (${c.x}, ${c.y})`;
      } else if (currentMode === 'enlargement') {
        const c = toolPoints[0];
        imagePoints = points.map(p => ({ x: c.x + scaleFactor * (p.x - c.x), y: c.y + scaleFactor * (p.y - c.y) }));
        displayMath = `Enlargement k=${scaleFactor}`;
      }

      // Shapes
      const drawShape = (pts, color, dashed) => {
        ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2;
        if (dashed) ctx.setLineDash([4, 4]);
        const sStart = toScreen(pts[0]); ctx.moveTo(sStart.x, sStart.y);
        pts.forEach(p => { const sp = toScreen(p); ctx.lineTo(sp.x, sp.y); });
        ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = color + '15'; ctx.fill();
        ctx.fillStyle = color;
        pts.forEach((p, i) => {
          const sp = toScreen(p);
          ctx.fillText(points[i].label + (dashed ? "'" : ""), sp.x + 12, sp.y - 12);
        });
      };
      drawShape(points, theme.object, false);
      drawShape(imagePoints, theme.image, true);

      // --- ADDED: Draggable Nodes for Object (Blue) ---
      points.forEach(p => {
        const s = toScreen(p);
        ctx.beginPath();
        ctx.fillStyle = theme.object;
        ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
        ctx.fill();
        // Visual indicator for draggability (subtle stroke)
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Tool Handles (Yellow)
      const handles = (currentMode === 'translation')
        ? [{ x: points[0].x + toolPoints[0].x, y: points[0].y + toolPoints[0].y }]
        : toolPoints;

      handles.forEach(p => {
        const s = toScreen(p);
        ctx.beginPath(); ctx.fillStyle = theme.tool;
        ctx.arc(s.x, s.y, 6, 0, Math.PI * 2); ctx.fill();
      });

      mathOutput.innerHTML = displayMath;
      animId = requestAnimationFrame(draw);
    };

    const onDown = (e) => {
      const { x: mx, y: my } = getScaledPointerPos(canvas, e);
      
      // Check tool points first
      if (currentMode === 'translation') {
        const sTip = toScreen({ x: points[0].x + toolPoints[0].x, y: points[0].y + toolPoints[0].y });
        if (Math.hypot(sTip.x - mx, sTip.y - my) < 20) { draggingPoint = toolPoints[0]; return; }
      }

      // Priority: Tool Points -> Object Points
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
      } else {
        draggingPoint.x = pos.x; 
        draggingPoint.y = pos.y;
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
          <div className="sim-math-readout" style={{ fontWeight: '600', marginBottom: '10px' }}></div>
          <div className="sim-controls" style={{ pointerEvents: 'auto' }}>
            <button id="switchBtn" className="sim-action-btn" style={{ display: category === 'translation' ? 'none' : 'block' }}></button>
          </div>
        </div>
      </div>
    </div>
  );
}