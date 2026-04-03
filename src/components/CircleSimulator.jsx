// src/components/CircleSimulator.jsx
import React, { useEffect, useRef } from 'react';
import './CircleSimulator.css';

export default function CircleSimulator() {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const canvas = container.querySelector('#simCanvas');
        const ctx = canvas.getContext('2d');
        const mathOutput = container.querySelector('#mathOutput');
        const switchBtn = container.querySelector('#switchBtn');
        const randomBtn = container.querySelector('#randomBtn');
        const tabsContainer = container.querySelector('#simTabs');

        let animId;
        
        const THEOREMS = [
            { id: 'semicircle', title: 'Angle in a Semicircle' },
            { id: 'tangent', title: 'Tangent ⟂ Radius' },
            { id: 'centre', title: 'Central Angle Theorem' },
            { id: 'segment', title: 'Angles in Same Segment' },
            { id: 'cyclic', title: 'Cyclic Quadrilateral' },
            { id: 'alt', title: 'Alternate Segment Theorem' }
        ];

        let currentTheorem = 'semicircle';
        let activeVariant = 0;
        let points = [];
        let draggingPoint = null;
        let centreX, centreY, radius;

        function getThemeColors() {
            const isDark = document.documentElement.dataset.theme === 'dark' || 
                           (!document.documentElement.hasAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
            return {
                text: isDark ? '#f8fafc' : '#0f172a',          
                muted: isDark ? '#94a3b8' : '#64748b',         
                line: isDark ? '#cbd5e1' : '#1e293b', 
                bg: isDark ? '#17181c' : '#ffffff',            
                accent1: isDark ? '#60a5fa' : '#2563eb',       
                accent2: isDark ? '#f87171' : '#ef4444',       
                pointFixed: isDark ? '#475569' : '#cbd5e1'
            };
        }

        function init() {
            window.addEventListener('resize', resize);
            resize();

            THEOREMS.forEach(t => {
                const btn = document.createElement('button');
                btn.className = 'sim-tab-btn';
                btn.textContent = t.title;
                btn.onclick = () => selectTheorem(t.id);
                btn.id = `tab-${t.id}`;
                tabsContainer.appendChild(btn);
            });

            selectTheorem('semicircle');

            canvas.addEventListener('mousedown', startDrag);
            canvas.addEventListener('mousemove', drag);
            canvas.addEventListener('mouseup', endDrag);
            canvas.addEventListener('mouseleave', endDrag);
            
            canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDrag(e.touches[0]); }, { passive: false });
            canvas.addEventListener('touchmove', (e) => { e.preventDefault(); drag(e.touches[0]); }, { passive: false });
            canvas.addEventListener('touchend', endDrag);

            switchBtn.addEventListener('click', toggleVariant);
            randomBtn.addEventListener('click', randomize);

            animId = requestAnimationFrame(draw);
        }

        function resize() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            centreX = canvas.width / 2;
            centreY = canvas.height / 2;
            radius = Math.min(canvas.width, canvas.height) / 2.5 - 20;
            resetPoints();
        }

        function selectTheorem(id) {
            currentTheorem = id;
            activeVariant = 0;
            container.querySelectorAll('.sim-tab-btn').forEach(b => b.classList.remove('active'));
            container.querySelector(`#tab-${id}`).classList.add('active');
            
            switchBtn.style.display = (id === 'semicircle' || id === 'tangent') ? 'none' : 'block';
            updateSwitchText();
            resetPoints();
        }

        function updateSwitchText() {
            if (currentTheorem === 'centre') {
                const cases = ['Arrowhead', 'Aligned', 'Crossed', 'Reflex'];
                switchBtn.textContent = `Case: ${cases[activeVariant]} ⟳`;
            } else if (currentTheorem === 'cyclic') {
                // Changed from static A&C to dynamic Pairs
                switchBtn.textContent = `Pair: ${activeVariant === 0 ? '1' : '2'} ⟳`;
            } else if (currentTheorem === 'alt') {
                switchBtn.textContent = `Chord: ${activeVariant === 0 ? 'PB' : 'PA'} ⟳`;
            } else if (currentTheorem === 'segment') {
                // Changed from static C&D to dynamic Pairs
                switchBtn.textContent = `Pair: ${activeVariant === 0 ? '1' : '2'} ⟳`;
            }
        }

        function toggleVariant() {
            if (currentTheorem === 'centre') activeVariant = (activeVariant + 1) % 4;
            else activeVariant = (activeVariant + 1) % 2;
            updateSwitchText();
            if (currentTheorem === 'centre') resetPoints();
        }

        function randomize() {
            const rad = radius;
            if (currentTheorem === 'cyclic' || currentTheorem === 'segment') {
                // Simplified randomize since the dynamic sorting handles the roles now
                let angs = [Math.random() * 6, Math.random() * 6, Math.random() * 6, Math.random() * 6];
                points.forEach((p, i) => { p.x = centreX + Math.cos(angs[i])*rad; p.y = centreY + Math.sin(angs[i])*rad; });
            } else {
                points.forEach(p => {
                    if (p.type === 'circle' || p.type === 'tangent-point') {
                        const ang = Math.random() * Math.PI * 2;
                        p.x = centreX + Math.cos(ang) * rad; p.y = centreY + Math.sin(ang) * rad;
                    }
                });
            }
        }

        function resetPoints() {
            const rad = radius;
            points = [];
            if (currentTheorem === 'semicircle') {
                points = [
                    { x: centreX - rad, y: centreY, type: 'fixed', label: 'A' },
                    { x: centreX + rad, y: centreY, type: 'fixed', label: 'B' },
                    { x: centreX, y: centreY - rad, type: 'circle', label: 'C' }
                ];
            } else if (currentTheorem === 'tangent') {
                points = [{ x: centreX, y: centreY + rad, type: 'circle', label: 'P' }];
            } else if (currentTheorem === 'centre') {
                let angs = activeVariant === 0 ? [0.8, 2.3, 4.7] : 
                           activeVariant === 1 ? [0.8, 2.6, 0.8 + Math.PI] : 
                           activeVariant === 2 ? [0.2, 1.8, 2.7] : [3.5, 5.9, 4.7];
                points = [
                    { x: centreX + Math.cos(angs[0])*rad, y: centreY + Math.sin(angs[0])*rad, type: 'circle', label: 'A' },
                    { x: centreX + Math.cos(angs[1])*rad, y: centreY + Math.sin(angs[1])*rad, type: 'circle', label: 'B' },
                    { x: centreX + Math.cos(angs[2])*rad, y: centreY + Math.sin(angs[2])*rad, type: 'circle', label: 'C' }
                ];
            } else if (currentTheorem === 'segment' || currentTheorem === 'cyclic') {
                points = [
                    { x: centreX + Math.cos(0.5)*rad, y: centreY + Math.sin(0.5)*rad, type: 'circle', label: 'A' },
                    { x: centreX + Math.cos(2.0)*rad, y: centreY + Math.sin(2.0)*rad, type: 'circle', label: 'B' },
                    { x: centreX + Math.cos(3.5)*rad, y: centreY + Math.sin(3.5)*rad, type: 'circle', label: 'C' },
                    { x: centreX + Math.cos(5.0)*rad, y: centreY + Math.sin(5.0)*rad, type: 'circle', label: 'D' }
                ];
            } else if (currentTheorem === 'alt') {
                points = [
                    { x: centreX, y: centreY + rad, type: 'tangent-point', label: 'P' },
                    { x: centreX + Math.cos(3.8)*rad, y: centreY + Math.sin(3.8)*rad, type: 'circle', label: 'A' },
                    { x: centreX + Math.cos(5.5)*rad, y: centreY + Math.sin(5.5)*rad, type: 'circle', label: 'B' }
                ];
            }
        }

        function startDrag(e) {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left, my = e.clientY - rect.top;
            points.forEach(p => { if (p.type !== 'fixed' && Math.hypot(p.x - mx, p.y - my) < 30) draggingPoint = p; });
        }
        
        function drag(e) {
            if (!draggingPoint) return;
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left, my = e.clientY - rect.top;
            
            if (draggingPoint.type === 'free') {
                draggingPoint.x = mx;
                draggingPoint.y = my;
            } else {
                // Free movement around the circle! (Anti-twist code removed)
                const angle = Math.atan2(my - centreY, mx - centreX);
                draggingPoint.x = centreX + Math.cos(angle) * radius;
                draggingPoint.y = centreY + Math.sin(angle) * radius;
            }
        }
        
        function endDrag() { draggingPoint = null; }

        function drawInteriorArc(pVertex, p1, p2, color, defaultArcRadius, forceMajor, theme, textOverride = null) {
            const a1 = Math.atan2(p1.y - pVertex.y, p1.x - pVertex.x);
            const a2 = Math.atan2(p2.y - pVertex.y, p2.x - pVertex.x);
            let diff = a2 - a1;
            while (diff < 0) diff += Math.PI * 2;
            if (!forceMajor && diff > Math.PI) diff -= Math.PI * 2;
            if (forceMajor && diff < Math.PI) diff += Math.PI * 2;

            const dist1 = Math.hypot(p1.x - pVertex.x, p1.y - pVertex.y);
            const dist2 = Math.hypot(p2.x - pVertex.x, p2.y - pVertex.y);
            const arcRadius = Math.min(defaultArcRadius, Math.max(10, Math.min(dist1, dist2) * 0.4));

            ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 3;
            ctx.arc(pVertex.x, pVertex.y, arcRadius, a1, a1 + diff, diff < 0); ctx.stroke();

            const deg = Math.abs(diff * 180 / Math.PI);
            const mid = a1 + diff / 2;
            const tRad = arcRadius + 20;
            
            const labelText = textOverride !== null ? textOverride : `${deg.toFixed(1)}°`;
            drawValueLabel(pVertex.x + Math.cos(mid)*tRad, pVertex.y + Math.sin(mid)*tRad, labelText, color, theme);
            return deg;
        }

        function drawValueLabel(x, y, text, color, theme) {
            ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 14px sans-serif';
            ctx.strokeStyle = theme.bg; ctx.lineWidth = 5; ctx.strokeText(text, x, y);
            ctx.fillStyle = color; ctx.fillText(text, x, y); ctx.restore();
        }

        function drawPointLabel(x, y, text, theme) {
            ctx.save(); ctx.font = 'bold 16px sans-serif'; 
            ctx.strokeStyle = theme.bg; ctx.lineWidth = 4; ctx.strokeText(text, x, y);
            ctx.fillStyle = theme.text; ctx.fillText(text, x, y); 
            ctx.restore();
        }
        
        function lineSide(A, B, P) { return Math.sign((B.x - A.x) * (P.y - A.y) - (B.y - A.y) * (P.x - A.x)); }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const theme = getThemeColors();

            ctx.beginPath(); ctx.strokeStyle = theme.line; ctx.lineWidth = 3; 
            ctx.arc(centreX, centreY, radius, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.fillStyle = theme.muted; ctx.arc(centreX, centreY, 5, 0, Math.PI * 2); ctx.fill();
            drawPointLabel(centreX + 10, centreY - 10, 'O', theme);

            mathOutput.innerHTML = ''; ctx.lineWidth = 2.5;

            if (currentTheorem === 'semicircle') {
                const [A, B, C] = points;
                ctx.setLineDash([5, 5]); ctx.strokeStyle = theme.muted; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); ctx.setLineDash([]);
                ctx.strokeStyle = theme.accent1; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(C.x, C.y); ctx.lineTo(B.x, B.y); ctx.stroke();
                
                const v1 = {x: (A.x - C.x)/Math.hypot(A.x-C.x, A.y-C.y), y: (A.y - C.y)/Math.hypot(A.x-C.x, A.y-C.y)};
                const v2 = {x: (B.x - C.x)/Math.hypot(B.x-C.x, B.y-C.y), y: (B.y - C.y)/Math.hypot(B.x-C.x, B.y-C.y)};
                ctx.beginPath(); ctx.moveTo(C.x + v1.x*18, C.y + v1.y*18);
                ctx.lineTo(C.x + (v1.x+v2.x)*18, C.y + (v1.y+v2.y)*18);
                ctx.lineTo(C.x + v2.x*18, C.y + v2.y*18); ctx.stroke();
                mathOutput.innerHTML = 'Angle in a Semicircle = 90°';

            } else if (currentTheorem === 'tangent') {
                const P = points[0];
                ctx.strokeStyle = theme.accent2; ctx.beginPath(); ctx.moveTo(centreX, centreY); ctx.lineTo(P.x, P.y); ctx.stroke();
                
                const angP = Math.atan2(P.y - centreY, P.x - centreX);
                const t1 = { x: P.x - Math.sin(angP)*180, y: P.y + Math.cos(angP)*180 };
                const t2 = { x: P.x + Math.sin(angP)*180, y: P.y - Math.cos(angP)*180 };
                ctx.strokeStyle = theme.accent1; ctx.beginPath(); ctx.moveTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.stroke();
                
                const size = 18;
                const vRadius = {x: -Math.cos(angP), y: -Math.sin(angP)};
                const vTangent = {x: Math.sin(angP), y: -Math.cos(angP)};
                
                ctx.beginPath();
                ctx.moveTo(P.x + vRadius.x*size, P.y + vRadius.y*size);
                ctx.lineTo(P.x + vRadius.x*size + vTangent.x*size, P.y + vRadius.y*size + vTangent.y*size);
                ctx.lineTo(P.x + vTangent.x*size, P.y + vTangent.y*size);
                ctx.strokeStyle = theme.muted; ctx.stroke();
                
                mathOutput.innerHTML = 'Radius is Perpendicular (⟂) to Tangent = 90°';

            } else if (currentTheorem === 'centre') {
                const [A, B, C] = points;
                ctx.strokeStyle = theme.accent1; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(centreX, centreY); ctx.lineTo(B.x, B.y); ctx.stroke();
                ctx.strokeStyle = theme.accent2; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(C.x, C.y); ctx.lineTo(B.x, B.y); ctx.stroke();
                
                const angA = Math.atan2(A.y - centreY, A.x - centreX);
                const angB = Math.atan2(B.y - centreY, B.x - centreX);
                const arcAB = (angB - angA + Math.PI * 4) % (Math.PI * 2);
                const arcAC = (Math.atan2(C.y - centreY, C.x - centreX) - angA + Math.PI * 4) % (Math.PI * 2);
                
                let start = arcAC < arcAB ? B : A, end = arcAC < arcAB ? A : B;
                let val = arcAC < arcAB ? Math.PI*2 - arcAB : arcAB;
                
                const a2 = drawInteriorArc(C, A, B, theme.accent2, 35, false, theme);
                const cleanCircum = parseFloat(a2.toFixed(1));
                const cleanCenter = (cleanCircum * 2).toFixed(1);
                drawInteriorArc({x:centreX, y:centreY}, start, end, theme.accent1, 35, val > Math.PI, theme, `${cleanCenter}°`);
                
                mathOutput.innerHTML = `Center (${cleanCenter}°) = 2 × Circumference (${cleanCircum.toFixed(1)}°)`;

            } else if (currentTheorem === 'segment') {
                // DYNAMIC REMAPPING: Sort points angularly to guarantee a bowtie shape
                const sorted = [...points].sort((a, b) => Math.atan2(a.y - centreY, a.x - centreX) - Math.atan2(b.y - centreY, b.x - centreX));
                const [P0, P1, P2, P3] = sorted;

                if (activeVariant === 0) {
                    ctx.strokeStyle = theme.accent1; ctx.beginPath(); ctx.moveTo(P0.x, P0.y); ctx.lineTo(P2.x, P2.y); ctx.lineTo(P1.x, P1.y); ctx.stroke();
                    ctx.strokeStyle = theme.accent2; ctx.beginPath(); ctx.moveTo(P0.x, P0.y); ctx.lineTo(P3.x, P3.y); ctx.lineTo(P1.x, P1.y); ctx.stroke();
                    
                    const a1 = drawInteriorArc(P2, P1, P0, theme.accent1, 40, false, theme); 
                    const cleanAngle = a1.toFixed(1);
                    drawInteriorArc(P3, P1, P0, theme.accent2, 40, false, theme, `${cleanAngle}°`);
                    mathOutput.innerHTML = `∠${P2.label} = ∠${P3.label} = ${cleanAngle}°`;
                } else {
                    ctx.strokeStyle = theme.accent1; ctx.beginPath(); ctx.moveTo(P1.x, P1.y); ctx.lineTo(P3.x, P3.y); ctx.lineTo(P2.x, P2.y); ctx.stroke();
                    ctx.strokeStyle = theme.accent2; ctx.beginPath(); ctx.moveTo(P1.x, P1.y); ctx.lineTo(P0.x, P0.y); ctx.lineTo(P2.x, P2.y); ctx.stroke();
                    
                    const a1 = drawInteriorArc(P3, P2, P1, theme.accent1, 40, false, theme); 
                    const cleanAngle = a1.toFixed(1);
                    drawInteriorArc(P0, P2, P1, theme.accent2, 40, false, theme, `${cleanAngle}°`);
                    mathOutput.innerHTML = `∠${P3.label} = ∠${P0.label} = ${cleanAngle}°`;
                }

            } else if (currentTheorem === 'cyclic') {
                // DYNAMIC REMAPPING: Sort points angularly to guarantee a convex quadrilateral
                const sorted = [...points].sort((a, b) => Math.atan2(a.y - centreY, a.x - centreX) - Math.atan2(b.y - centreY, b.x - centreX));
                const [P0, P1, P2, P3] = sorted;

                ctx.strokeStyle = theme.muted; ctx.beginPath(); 
                ctx.moveTo(P0.x, P0.y); ctx.lineTo(P1.x, P1.y); ctx.lineTo(P2.x, P2.y); ctx.lineTo(P3.x, P3.y); ctx.closePath(); ctx.stroke();
                
                if (activeVariant === 0) {
                    const a = drawInteriorArc(P0, P1, P3, theme.accent1, 40, false, theme); 
                    const cleanA = parseFloat(a.toFixed(1));
                    const cleanC = (180 - cleanA).toFixed(1);
                    drawInteriorArc(P2, P3, P1, theme.accent1, 40, false, theme, `${cleanC}°`);
                    mathOutput.innerHTML = `∠${P0.label} + ∠${P2.label} = ${cleanA.toFixed(1)}° + ${cleanC}° = 180°`;
                } else {
                    const b = drawInteriorArc(P1, P2, P0, theme.accent2, 40, false, theme); 
                    const cleanB = parseFloat(b.toFixed(1));
                    const cleanD = (180 - cleanB).toFixed(1);
                    drawInteriorArc(P3, P0, P2, theme.accent2, 40, false, theme, `${cleanD}°`);
                    mathOutput.innerHTML = `∠${P1.label} + ∠${P3.label} = ${cleanB.toFixed(1)}° + ${cleanD}° = 180°`;
                }

            } else if (currentTheorem === 'alt') {
                const [P, A, B] = points;
                const angP = Math.atan2(P.y - centreY, P.x - centreX);
                const t1 = { x: P.x - Math.sin(angP)*200, y: P.y + Math.cos(angP)*200 };
                const t2 = { x: P.x + Math.sin(angP)*200, y: P.y - Math.cos(angP)*200 };
                
                ctx.strokeStyle = theme.muted; ctx.beginPath(); ctx.moveTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.closePath(); ctx.stroke();
                drawPointLabel(t1.x, t1.y-5, 'T1', theme); drawPointLabel(t2.x, t2.y-5, 'T2', theme);

                if (activeVariant === 0) {
                    const activeTan = lineSide(P, A, B) !== lineSide(P, A, t1) ? t1 : t2;
                    const aAlt = drawInteriorArc(B, P, A, theme.accent1, 40, false, theme); 
                    const cleanAlt = aAlt.toFixed(1);
                    drawInteriorArc(P, activeTan, A, theme.accent1, 40, false, theme, `${cleanAlt}°`);
                    mathOutput.innerHTML = `∠ABP = ∠AP${activeTan===t1?'T1':'T2'} = ${cleanAlt}°`;
                } else {
                    const activeTan = lineSide(P, B, A) !== lineSide(P, B, t1) ? t1 : t2;
                    const aAlt = drawInteriorArc(A, B, P, theme.accent2, 40, false, theme); 
                    const cleanAlt = aAlt.toFixed(1);
                    drawInteriorArc(P, B, activeTan, theme.accent2, 40, false, theme, `${cleanAlt}°`);
                    mathOutput.innerHTML = `∠BAP = ∠BP${activeTan===t1?'T1':'T2'} = ${cleanAlt}°`;
                }
            }

            points.forEach(p => {
                ctx.beginPath();
                ctx.fillStyle = p.type === 'fixed' ? theme.pointFixed : (draggingPoint === p ? '#f59e0b' : theme.accent1);
                ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
                ctx.fill(); ctx.strokeStyle = theme.bg; ctx.lineWidth = 2; ctx.stroke();
                drawPointLabel(p.x + 12, p.y - 12, p.label, theme);
            });

            animId = requestAnimationFrame(draw);
        }

        init();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animId);
        };
    }, []);

    return (
        <div ref={containerRef} className="sim-root">
            <div id="simTabs" className="sim-tabs"></div>
            
            <div className="sim-canvas-container">
                <canvas id="simCanvas" className="sim-canvas"></canvas>
                
                <div className="sim-overlay">
                    <div id="mathOutput" className="sim-math-readout"></div>
                    <div className="sim-controls">
                        <button id="switchBtn" className="sim-action-btn">Switch Case ⟳</button>
                        <button id="randomBtn" className="sim-action-btn">Random 🎲</button>
                    </div>
                </div>
            </div>
        </div>
    );
}