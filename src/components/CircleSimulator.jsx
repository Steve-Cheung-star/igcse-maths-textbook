// src/components/CircleSimulator.jsx
import React, { useEffect, useRef } from 'react';
import './CircleSimulator.css';

export default function CircleSimulator({ category = 'angles' }) {
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

        // Define all theorems with categories
        const ALL_THEOREMS = [
            { id: 'semicircle', title: 'Angle in a Semicircle', cat: 'angles' },
            { id: 'tangent', title: 'Tangent ⟂ Radius', cat: 'angles' },
            { id: 'centre', title: 'Central Angle Theorem', cat: 'angles' },
            { id: 'segment', title: 'Angles in Same Segment', cat: 'angles' },
            { id: 'cyclic', title: 'Cyclic Quadrilateral', cat: 'angles' },
            { id: 'alt', title: 'Alternate Segment Theorem', cat: 'angles' },
            { id: 'equal-chords', title: 'Equal Chords', cat: 'lines' },
            { id: 'perp-bisector', title: 'Perpendicular Bisector', cat: 'lines' },
            { id: 'ext-tangents', title: 'External Tangents', cat: 'lines' },
            { id: 'unit-circle', title: 'The Unit Circle', cat: 'trig' }
        ];

        // Filter based on the prop passed to the component
        const THEOREMS = ALL_THEOREMS.filter(t => t.cat === category);

        let currentTheorem = THEOREMS.length > 0 ? THEOREMS[0].id : '';
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

        const onResize = () => resize();
        const onMouseDown = e => startDrag(e);
        const onMouseMove = e => drag(e);
        const onMouseUp = () => endDrag();
        const onTouchStart = e => { e.preventDefault(); startDrag(e.touches[0]); };
        const onTouchMove = e => { e.preventDefault(); drag(e.touches[0]); };
        const onTouchEnd = () => endDrag();
        const onSwitch = () => toggleVariant();
        const onRandom = () => randomize();

        function init() {
            window.addEventListener('resize', onResize);
            resize();

            tabsContainer.innerHTML = '';
            THEOREMS.forEach(t => {
                const btn = document.createElement('button');
                btn.className = 'sim-tab-btn';
                btn.textContent = t.title;
                btn.onclick = () => selectTheorem(t.id);
                btn.id = `tab-${t.id}`;
                tabsContainer.appendChild(btn);
            });

            if (currentTheorem) selectTheorem(currentTheorem);

            canvas.addEventListener('mousedown', onMouseDown);
            canvas.addEventListener('mousemove', onMouseMove);
            canvas.addEventListener('mouseup', onMouseUp);
            canvas.addEventListener('mouseleave', onMouseUp);
            canvas.addEventListener('touchstart', onTouchStart, { passive: false });
            canvas.addEventListener('touchmove', onTouchMove, { passive: false });
            canvas.addEventListener('touchend', onTouchEnd);

            switchBtn.addEventListener('click', onSwitch);
            randomBtn.addEventListener('click', onRandom);

            animId = requestAnimationFrame(animateLoop);
        }
        
        function animateLoop() {
            draw();
            animId = requestAnimationFrame(animateLoop);
        }

        function resize() {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            
            ctx.resetTransform();
            ctx.scale(dpr, dpr);
            
            centreX = rect.width / 2;
            centreY = rect.height / 2;
            radius = Math.min(rect.width, rect.height) / 2.5 - 20;
            resetPoints();
        }

        function selectTheorem(id) {
            currentTheorem = id;
            activeVariant = 0;
            container.querySelectorAll('.sim-tab-btn').forEach(b => b.classList.remove('active'));
            const activeTab = container.querySelector(`#tab-${id}`);
            if (activeTab) activeTab.classList.add('active');

            const noSwitch = ['semicircle', 'tangent', 'equal-chords'];
            switchBtn.style.display = noSwitch.includes(id) ? 'none' : 'block';
            updateSwitchText();
            resetPoints();
        }

        function updateSwitchText() {
            if (currentTheorem === 'centre') {
                const cases = ['Arrowhead', 'Aligned', 'Crossed', 'Reflex'];
                switchBtn.textContent = `Case: ${cases[activeVariant]} ⟳`;
            } else if (currentTheorem === 'cyclic' || currentTheorem === 'segment') {
                switchBtn.textContent = `Pair: ${activeVariant === 0 ? '1' : '2'} ⟳`;
            } else if (currentTheorem === 'alt') {
                switchBtn.textContent = `Chord: ${activeVariant === 0 ? 'PB' : 'PA'} ⟳`;
            } else if (currentTheorem === 'perp-bisector') {
                switchBtn.textContent = `Show: ${activeVariant === 0 ? 'Bisector' : 'Perpendicular'} ⟳`;
            } else if (currentTheorem === 'ext-tangents') {
                switchBtn.textContent = `Focus: ${activeVariant === 0 ? 'Tangent Length' : 'Kite Angles'} ⟳`;
            } else if (currentTheorem === 'unit-circle') {
                switchBtn.textContent = `Mode: ${activeVariant === 0 ? 'Values' : 'Quadrants'} ⟳`;
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
                let angs = [Math.random() * 6, Math.random() * 6, Math.random() * 6, Math.random() * 6];
                points.forEach((p, i) => { p.x = centreX + Math.cos(angs[i]) * rad; p.y = centreY + Math.sin(angs[i]) * rad; });
            } else if (currentTheorem === 'ext-tangents') {
                const ang = Math.random() * Math.PI * 2;
                // Ensures randomize doesn't push the point out of the canvas bounds
                const maxDist = Math.min(centreX, centreY) - 20; 
                const dist = (rad + 15) + Math.random() * (maxDist - (rad + 15));
                points[0].x = centreX + Math.cos(ang) * dist;
                points[0].y = centreY + Math.sin(ang) * dist;
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
                    { x: centreX + Math.cos(angs[0]) * rad, y: centreY + Math.sin(angs[0]) * rad, type: 'circle', label: 'A' },
                    { x: centreX + Math.cos(angs[1]) * rad, y: centreY + Math.sin(angs[1]) * rad, type: 'circle', label: 'B' },
                    { x: centreX + Math.cos(angs[2]) * rad, y: centreY + Math.sin(angs[2]) * rad, type: 'circle', label: 'C' }
                ];
            } else if (currentTheorem === 'segment' || currentTheorem === 'cyclic') {
                points = [
                    { x: centreX + Math.cos(0.5) * rad, y: centreY + Math.sin(0.5) * rad, type: 'circle', label: 'A' },
                    { x: centreX + Math.cos(2.0) * rad, y: centreY + Math.sin(2.0) * rad, type: 'circle', label: 'B' },
                    { x: centreX + Math.cos(3.5) * rad, y: centreY + Math.sin(3.5) * rad, type: 'circle', label: 'C' },
                    { x: centreX + Math.cos(5.0) * rad, y: centreY + Math.sin(5.0) * rad, type: 'circle', label: 'D' }
                ];
            } else if (currentTheorem === 'alt') {
                points = [
                    { x: centreX, y: centreY + rad, type: 'tangent-point', label: 'P' },
                    { x: centreX + Math.cos(3.8) * rad, y: centreY + Math.sin(3.8) * rad, type: 'circle', label: 'A' },
                    { x: centreX + Math.cos(5.5) * rad, y: centreY + Math.sin(5.5) * rad, type: 'circle', label: 'B' }
                ];
            } else if (currentTheorem === 'equal-chords') {
                points = [
                    { x: centreX + Math.cos(0.5) * rad, y: centreY + Math.sin(0.5) * rad, type: 'circle', label: 'A' },
                    { x: centreX + Math.cos(2.0) * rad, y: centreY + Math.sin(2.0) * rad, type: 'circle', label: 'B' },
                    { x: centreX + Math.cos(3.5) * rad, y: centreY + Math.sin(3.5) * rad, type: 'circle', label: 'C' }
                ];
            } else if (currentTheorem === 'perp-bisector') {
                points = [
                    { x: centreX + Math.cos(0.8) * rad, y: centreY + Math.sin(0.8) * rad, type: 'circle', label: 'A' },
                    { x: centreX + Math.cos(2.3) * rad, y: centreY + Math.sin(2.3) * rad, type: 'circle', label: 'B' }
                ];
            } else if (currentTheorem === 'ext-tangents') {
                // Ensure the initial spawn point is comfortably within the canvas bounds
                const safeDist = Math.min(rad * 1.5, centreX - 25);
                points = [
                    { x: centreX + safeDist, y: centreY, type: 'free', label: 'P' }
                ];
            } else if (currentTheorem === 'unit-circle') {
                points = [
                    {
                        x: centreX + radius * Math.cos(-Math.PI / 4),
                        y: centreY + radius * Math.sin(-Math.PI / 4),
                        type: 'circle', label: 'P'
                    }
                ];
            }
        }

        function startDrag(e) {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            points.forEach(p => { 
                if (p.type !== 'fixed' && Math.hypot(p.x - mx, p.y - my) < 30) draggingPoint = p; 
            });
        }

        function drag(e) {
            if (!draggingPoint) return;
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            if (currentTheorem === 'ext-tangents' && draggingPoint.label === 'P') {
                let dx = mx - centreX;
                let dy = my - centreY;
                let dist = Math.hypot(dx, dy);
                
                // Keep P within canvas walls and outside the main circle
                let maxBounds = Math.min(centreX, centreY) - 15;
                if (dist < radius + 15) dist = radius + 15;
                if (dist > maxBounds) dist = maxBounds;
                
                draggingPoint.x = centreX + (dx / dist) * dist;
                draggingPoint.y = centreY + (dy / dist) * dist;
                
            } else if (draggingPoint.type === 'free') {
                // Keep strictly inside the canvas
                draggingPoint.x = Math.max(15, Math.min(rect.width - 15, mx));
                draggingPoint.y = Math.max(15, Math.min(rect.height - 15, my));
            } else {
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
            drawValueLabel(pVertex.x + Math.cos(mid) * tRad, pVertex.y + Math.sin(mid) * tRad, labelText, color, theme);
            return deg;
        }

        function drawValueLabel(x, y, text, color, theme) {
            ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; 
            ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
            ctx.strokeStyle = theme.bg; ctx.lineWidth = 5; ctx.strokeText(text, x, y);
            ctx.fillStyle = color; ctx.fillText(text, x, y); ctx.restore();
        }

        function drawPointLabel(x, y, text, theme) {
            ctx.save(); 
            ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
            ctx.strokeStyle = theme.bg; ctx.lineWidth = 4; ctx.strokeText(text, x, y);
            ctx.fillStyle = theme.text; ctx.fillText(text, x, y);
            ctx.restore();
        }

        function drawRightAngle(corner, p1x, p1y, p2x, p2y, size, color) {
            const len1 = Math.hypot(p1x - corner.x, p1y - corner.y);
            const v1 = { x: (p1x - corner.x) / len1, y: (p1y - corner.y) / len1 };
            const len2 = Math.hypot(p2x - corner.x, p2y - corner.y);
            const v2 = { x: (p2x - corner.x) / len2, y: (p2y - corner.y) / len2 };

            ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2;
            ctx.moveTo(corner.x + v1.x * size, corner.y + v1.y * size);
            ctx.lineTo(corner.x + v1.x * size + v2.x * size, corner.y + v1.y * size + v2.y * size);
            ctx.lineTo(corner.x + v2.x * size, corner.y + v2.y * size);
            ctx.stroke();
        }

        function drawTick(p1, p2, color) {
            const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
            const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const tickLen = 6;
            ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2;
            ctx.moveTo(mid.x - Math.sin(ang) * tickLen, mid.y + Math.cos(ang) * tickLen);
            ctx.lineTo(mid.x + Math.sin(ang) * tickLen, mid.y - Math.cos(ang) * tickLen);
            ctx.stroke();
        }

        function lineSide(A, B, P) { return Math.sign((B.x - A.x) * (P.y - A.y) - (B.y - A.y) * (P.x - A.x)); }

        function draw() {
            const rect = canvas.getBoundingClientRect();
            ctx.clearRect(0, 0, rect.width, rect.height);
            
            const theme = getThemeColors();

            // Draw center point O and main circle
            ctx.beginPath(); ctx.strokeStyle = theme.line; ctx.lineWidth = 3;
            ctx.arc(centreX, centreY, radius, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.fillStyle = theme.muted; ctx.arc(centreX, centreY, 5, 0, Math.PI * 2); ctx.fill();
            drawPointLabel(centreX + 10, centreY - 10, 'O', theme);

            mathOutput.innerHTML = ''; ctx.lineWidth = 2.5;

            // ... Theorem specific drawings
            if (currentTheorem === 'semicircle') {
                const [A, B, C] = points;
                ctx.setLineDash([5, 5]); ctx.strokeStyle = theme.muted; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); ctx.setLineDash([]);
                ctx.strokeStyle = theme.accent1; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(C.x, C.y); ctx.lineTo(B.x, B.y); ctx.stroke();
                drawRightAngle(C, A.x, A.y, B.x, B.y, 18, theme.accent1);
                mathOutput.innerHTML = 'Angle in a Semicircle = 90°';

            } else if (currentTheorem === 'tangent') {
                const P = points[0];
                ctx.strokeStyle = theme.accent2; ctx.beginPath(); ctx.moveTo(centreX, centreY); ctx.lineTo(P.x, P.y); ctx.stroke();

                const angP = Math.atan2(P.y - centreY, P.x - centreX);
                const t1 = { x: P.x - Math.sin(angP) * 180, y: P.y + Math.cos(angP) * 180 };
                const t2 = { x: P.x + Math.sin(angP) * 180, y: P.y - Math.cos(angP) * 180 };
                ctx.strokeStyle = theme.accent1; ctx.beginPath(); ctx.moveTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.stroke();

                drawRightAngle(P, centreX, centreY, t1.x, t1.y, 18, theme.muted);
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
                let val = arcAC < arcAB ? Math.PI * 2 - arcAB : arcAB;

                const a2 = drawInteriorArc(C, A, B, theme.accent2, 35, false, theme);
                const cleanCircum = parseFloat(a2.toFixed(1));
                const cleanCenter = (cleanCircum * 2).toFixed(1);
                drawInteriorArc({ x: centreX, y: centreY }, start, end, theme.accent1, 35, val > Math.PI, theme, `${cleanCenter}°`);

                mathOutput.innerHTML = `Center (${cleanCenter}°) = 2 × Circumference (${cleanCircum.toFixed(1)}°)`;

            } else if (currentTheorem === 'segment') {
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
                const t1 = { x: P.x - Math.sin(angP) * 200, y: P.y + Math.cos(angP) * 200 };
                const t2 = { x: P.x + Math.sin(angP) * 200, y: P.y - Math.cos(angP) * 200 };

                ctx.strokeStyle = theme.muted; ctx.beginPath(); ctx.moveTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.closePath(); ctx.stroke();
                drawPointLabel(t1.x, t1.y - 5, 'T1', theme); drawPointLabel(t2.x, t2.y - 5, 'T2', theme);

                if (activeVariant === 0) {
                    const activeTan = lineSide(P, A, B) !== lineSide(P, A, t1) ? t1 : t2;
                    const aAlt = drawInteriorArc(B, P, A, theme.accent1, 40, false, theme);
                    const cleanAlt = aAlt.toFixed(1);
                    drawInteriorArc(P, activeTan, A, theme.accent1, 40, false, theme, `${cleanAlt}°`);
                    mathOutput.innerHTML = `∠ABP = ∠AP${activeTan === t1 ? 'T1' : 'T2'} = ${cleanAlt}°`;
                } else {
                    const activeTan = lineSide(P, B, A) !== lineSide(P, B, t1) ? t1 : t2;
                    const aAlt = drawInteriorArc(A, B, P, theme.accent2, 40, false, theme);
                    const cleanAlt = aAlt.toFixed(1);
                    drawInteriorArc(P, B, activeTan, theme.accent2, 40, false, theme, `${cleanAlt}°`);
                    mathOutput.innerHTML = `∠BAP = ∠BP${activeTan === t1 ? 'T1' : 'T2'} = ${cleanAlt}°`;
                }

            } else if (currentTheorem === 'equal-chords') {
                const [A, B, C] = points;
                const angA = Math.atan2(A.y - centreY, A.x - centreX);
                const angB = Math.atan2(B.y - centreY, B.x - centreX);
                const diff = angB - angA;
                const angC = Math.atan2(C.y - centreY, C.x - centreX);
                const angD = angC + diff;

                const D = { x: centreX + Math.cos(angD) * radius, y: centreY + Math.sin(angD) * radius, label: 'D', type: 'dependent' };
                const midAB = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
                const midCD = { x: (C.x + D.x) / 2, y: (C.y + D.y) / 2 };

                ctx.strokeStyle = theme.accent1; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
                ctx.strokeStyle = theme.accent2; ctx.beginPath(); ctx.moveTo(C.x, C.y); ctx.lineTo(D.x, D.y); ctx.stroke();

                ctx.setLineDash([5, 5]); ctx.strokeStyle = theme.muted;
                ctx.beginPath(); ctx.moveTo(centreX, centreY); ctx.lineTo(midAB.x, midAB.y); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(centreX, centreY); ctx.lineTo(midCD.x, midCD.y); ctx.stroke();
                ctx.setLineDash([]);

                drawRightAngle(midAB, centreX, centreY, A.x, A.y, 10, theme.line);
                drawRightAngle(midCD, centreX, centreY, C.x, C.y, 10, theme.line);

                // explicitly draw dependent point D
                ctx.beginPath(); ctx.fillStyle = theme.accent2; ctx.arc(D.x, D.y, 8, 0, Math.PI * 2); ctx.fill();
                ctx.lineWidth = 2; ctx.strokeStyle = theme.bg; ctx.stroke();
                drawPointLabel(D.x + 12, D.y - 12, D.label, theme);

                const chordLen = Math.hypot(A.x - B.x, A.y - B.y) / 15;
                const distToCenter = Math.hypot(midAB.x - centreX, midAB.y - centreY) / 15;

                mathOutput.innerHTML = `Chords: AB = CD = ${chordLen.toFixed(1)}cm<br>Distance to Centre = ${distToCenter.toFixed(1)}cm`;

            } else if (currentTheorem === 'perp-bisector') {
                const [A, B] = points;
                const mid = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };

                ctx.strokeStyle = theme.accent1; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();

                const angMid = Math.atan2(mid.y - centreY, mid.x - centreX);
                const edge = { x: centreX + Math.cos(angMid) * radius, y: centreY + Math.sin(angMid) * radius };
                ctx.strokeStyle = theme.accent2; ctx.beginPath(); ctx.moveTo(centreX, centreY); ctx.lineTo(edge.x, edge.y); ctx.stroke();

                drawRightAngle(mid, centreX, centreY, A.x, A.y, 12, theme.line);

                // explicitly draw calculated mid point M
                ctx.beginPath(); ctx.fillStyle = theme.muted; ctx.arc(mid.x, mid.y, 5, 0, Math.PI * 2); ctx.fill();
                drawPointLabel(mid.x + 10, mid.y + 15, 'M', theme);

                const AM = Math.hypot(A.x - mid.x, A.y - mid.y) / 15;
                if (activeVariant === 0) {
                    drawTick(A, mid, theme.line);
                    drawTick(mid, B, theme.line);
                    mathOutput.innerHTML = `Bisects Chord: AM = MB = ${AM.toFixed(1)}cm`;
                } else {
                    mathOutput.innerHTML = `Passes through Centre: ∠OMA = ∠OMB = 90°`;
                }

            } else if (currentTheorem === 'ext-tangents') {
                const P = points[0];
                let dx = P.x - centreX, dy = P.y - centreY;
                let dist = Math.hypot(dx, dy);
                let angBase = Math.atan2(dy, dx);
                let theta = Math.acos(radius / dist);

                let T1 = { x: centreX + Math.cos(angBase + theta) * radius, y: centreY + Math.sin(angBase + theta) * radius, label: 'T₁' };
                let T2 = { x: centreX + Math.cos(angBase - theta) * radius, y: centreY + Math.sin(angBase - theta) * radius, label: 'T₂' };

                ctx.strokeStyle = theme.accent1; ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(T1.x, T1.y); ctx.stroke();
                ctx.strokeStyle = theme.accent2; ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(T2.x, T2.y); ctx.stroke();

                ctx.setLineDash([5, 5]); ctx.strokeStyle = theme.muted;
                ctx.beginPath(); ctx.moveTo(centreX, centreY); ctx.lineTo(T1.x, T1.y); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(centreX, centreY); ctx.lineTo(T2.x, T2.y); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(centreX, centreY); ctx.lineTo(P.x, P.y); ctx.stroke();
                ctx.setLineDash([]);

                drawRightAngle(T1, P.x, P.y, centreX, centreY, 12, theme.line);
                drawRightAngle(T2, P.x, P.y, centreX, centreY, 12, theme.line);

                // Explicitly draw dependent tangent points
                [T1, T2].forEach(pt => {
                    ctx.beginPath(); ctx.fillStyle = theme.pointFixed; ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2); ctx.fill();
                    ctx.lineWidth = 2; ctx.strokeStyle = theme.bg; ctx.stroke();
                    drawPointLabel(pt.x + 10, pt.y - 10, pt.label, theme);
                });

                if (activeVariant === 0) {
                    const tanLen = Math.hypot(P.x - T1.x, P.y - T1.y) / 15;
                    drawTick(P, T1, theme.line); drawTick(P, T2, theme.line);
                    mathOutput.innerHTML = `Equal Lengths: PT₁ = PT₂ = ${tanLen.toFixed(1)}cm`;
                } else {
                    const a1 = drawInteriorArc(P, { x: centreX, y: centreY }, T1, theme.accent1, 35, false, theme);
                    const a2 = drawInteriorArc(P, T2, { x: centreX, y: centreY }, theme.accent2, 35, false, theme);
                    mathOutput.innerHTML = `Kite Symmetry: ∠OPT₁ = ∠OPT₂ = ${a1.toFixed(1)}°`;
                }
            } else if (currentTheorem === 'unit-circle') {
                const P = points[0];
                let angleRad = Math.atan2(-(P.y - centreY), P.x - centreX);
                if (angleRad < 0) angleRad += Math.PI * 2;

                const angleDeg = (angleRad * 180 / Math.PI).toFixed(1);
                const cosVal = Math.cos(angleRad);
                const sinVal = Math.sin(angleRad);

                ctx.beginPath();
                ctx.strokeStyle = theme.text;
                ctx.lineWidth = 2;
                ctx.arc(centreX, centreY, 40, 0, -angleRad, true);
                ctx.stroke();

                ctx.setLineDash([5, 5]);
                ctx.strokeStyle = theme.accent1;
                ctx.beginPath(); ctx.moveTo(centreX, centreY); ctx.lineTo(P.x, centreY); ctx.stroke();
                ctx.strokeStyle = theme.accent2;
                ctx.beginPath(); ctx.moveTo(P.x, centreY); ctx.lineTo(P.x, P.y); ctx.stroke();
                ctx.setLineDash([]);

                if (activeVariant === 0) {
                    mathOutput.innerHTML = `
            θ = ${angleDeg}°<br>
            <span style="color:${theme.accent1}">cos θ = ${cosVal.toFixed(3)}</span><br>
            <span style="color:${theme.accent2}">sin θ = ${sinVal.toFixed(3)}</span>
        `;
                } else if (activeVariant === 1) {
                    let quad = "I";
                    if (angleRad > Math.PI / 2) quad = "II";
                    if (angleRad > Math.PI) quad = "III";
                    if (angleRad > 1.5 * Math.PI) quad = "IV";

                    mathOutput.innerHTML = `
            Quadrant ${quad}<br>
            <span style="color:${theme.accent1}">cos θ = ${cosVal.toFixed(3)}</span><br>
            <span style="color:${theme.accent2}">sin θ = ${sinVal.toFixed(3)}</span>
        `;
                }
            }

            // Universal loop to draw explicit nodes for all interactive points!
            points.forEach(p => {
                ctx.beginPath();
                // Draggable points look interactive, fixed points look muted
                ctx.fillStyle = p.type === 'fixed' ? theme.pointFixed : theme.accent1;
                ctx.arc(p.x, p.y, p.type === 'fixed' ? 6 : 8, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.lineWidth = 2;
                ctx.strokeStyle = theme.bg;
                ctx.stroke();

                // Intelligently position labels so they don't clip into the nodes
                if (p.label) {
                    let lx = p.x; 
                    let ly = p.y;
                    if (p.type === 'circle' || p.type === 'tangent-point') {
                        const ang = Math.atan2(p.y - centreY, p.x - centreX);
                        lx += Math.cos(ang) * 22;
                        ly += Math.sin(ang) * 22;
                    } else {
                        lx += 15; 
                        ly -= 15;
                    }
                    drawPointLabel(lx, ly, p.label, theme);
                }
            });
        }

        init();

        return () => {
            window.removeEventListener('resize', onResize);
            if (canvas) {
                canvas.removeEventListener('mousedown', onMouseDown);
                canvas.removeEventListener('mousemove', onMouseMove);
                canvas.removeEventListener('mouseup', onMouseUp);
                canvas.removeEventListener('mouseleave', onMouseUp);
                canvas.removeEventListener('touchstart', onTouchStart);
                canvas.removeEventListener('touchmove', onTouchMove);
                canvas.removeEventListener('touchend', onTouchEnd);
            }
            if (switchBtn) switchBtn.removeEventListener('click', onSwitch);
            if (randomBtn) randomBtn.removeEventListener('click', onRandom);
            if (animId) cancelAnimationFrame(animId);
        };
    }, [category]);

    return (
        <div className="sim-root" ref={containerRef}>
            <div className="sim-tabs" id="simTabs"></div>
            <div className="sim-canvas-container">
                <canvas id="simCanvas" className="sim-canvas"></canvas>
                <div className="sim-overlay">
                    <div className="sim-math-readout" id="mathOutput"></div>
                    <div className="sim-controls">
                        <button className="sim-action-btn" id="switchBtn">Switch ⟳</button>
                        <button className="sim-action-btn" id="randomBtn">Random</button>
                    </div>
                </div>
            </div>
        </div>
    );
}