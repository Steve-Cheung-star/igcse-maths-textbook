import React, { useState, useRef } from 'react';

// --- Lightweight 3D Vector Math Engine ---
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];
const len = (a) => Math.sqrt(dot(a, a));
const norm = (a) => {
  const l = len(a);
  return l === 0 ? [0, 0, 0] : [a[0] / l, a[1] / l, a[2] / l];
};
const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];

const getLinePlaneIntersection = (l1, l2, p1, normal) => {
  const u = sub(l2, l1);
  const w = sub(l1, p1);
  const D = dot(normal, u);
  if (Math.abs(D) < 1e-6) return null;
  const N = -dot(normal, w);
  return add(l1, scale(u, N / D));
};

// --- Projection Engines ---
const obliqueProjConstants = { oX: 80, oY: 330, uX: [26, 0], uY: [14, -11], uZ: [0, -28] };
const isoProjConstants = { oX: 225, oY: 290, uX: [22, -12], uY: [-22, -12], uZ: [0, -26] };

const generateCircle = (w, d, z) => {
  const pts = [];
  const steps = 64; 
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    pts.push([w/2 + (w/2) * Math.cos(t), d/2 + (d/2) * Math.sin(t), z]);
  }
  return pts;
};

const generateSolid = (type, w, d, h, r) => {
  let coords3D, edges, faces, labels, paths = [];
  const isOblique = (type === 'cuboid' || type === 'rect_pyramid');
  const activeProjConstants = isOblique ? obliqueProjConstants : isoProjConstants;

  if (type === 'cuboid') {
    coords3D = {
      A: [0, 0, 0], B: [w, 0, 0], C: [w, d, 0], D: [0, d, 0],
      E: [0, 0, h], F: [w, 0, h], G: [w, d, h], H: [0, d, h]
    };
    edges = [
      ['A','B'], ['B','C'], ['C','D'], ['D','A'],
      ['E','F'], ['F','G'], ['G','H'], ['H','E'],
      ['A','E'], ['B','F'], ['C','G'], ['D','H']
    ];
    faces = [
      { id: 'ABCD', name: 'Bottom Base', points: ['A', 'B', 'C', 'D'] },
      { id: 'EFGH', name: 'Top Base', points: ['E', 'F', 'G', 'H'] },
      { id: 'ABFE', name: 'Front Face', points: ['A', 'B', 'F', 'E'] },
      { id: 'DCGH', name: 'Back Face', points: ['D', 'C', 'G', 'H'] },
      { id: 'BCGF', name: 'Right Face', points: ['B', 'C', 'G', 'F'] },
      { id: 'ADHE', name: 'Left Face', points: ['A', 'D', 'H', 'E'] }
    ];
    labels = [
      { text: `w=${w}`, p1: [0, 0, 0], p2: [w, 0, 0], offset: [0, 15] },
      { text: `d=${d}`, p1: [0, 0, 0], p2: [0, d, 0], offset: [-30, 10] },
      { text: `h=${h}`, p1: [0, 0, 0], p2: [0, 0, h], offset: [-35, 0] }
    ];
  } else if (type === 'rect_pyramid') {
    coords3D = {
      A: [0, 0, 0], B: [w, 0, 0], C: [w, d, 0], D: [0, d, 0],
      E: [w/2, d/2, h], O: [w/2, d/2, 0] 
    };
    edges = [
      ['A','B'], ['B','C'], ['C','D'], ['D','A'],
      ['A','E'], ['B','E'], ['C','E'], ['D','E']
    ];
    faces = [
      { id: 'ABCD', name: 'Bottom Base', points: ['A', 'B', 'C', 'D', 'O'], visualPoints: ['A', 'B', 'C', 'D'] },
      { id: 'ABE', name: 'Front Face', points: ['A', 'B', 'E'] },
      { id: 'BCE', name: 'Right Face', points: ['B', 'C', 'E'] },
      { id: 'CDE', name: 'Back Face', points: ['C', 'D', 'E'] },
      { id: 'ADE', name: 'Left Face', points: ['A', 'D', 'E'] }
    ];
    labels = [
      { text: `w=${w}`, p1: [0, 0, 0], p2: [w, 0, 0], offset: [0, 15] },
      { text: `d=${d}`, p1: [0, 0, 0], p2: [0, d, 0], offset: [-30, 10] },
      { text: `h=${h}`, p1: [w/2, d/2, 0], p2: [w/2, d/2, h], offset: [15, 0] }
    ];
  } else if (type === 'cylinder' || type === 'cone') {
    // Generate bounding box dimensions purely from radius
    const effW = r * 2;
    const effD = r * 2;
    const cx = r, cy = r, rx = r, ry = r;
    const t_R = -Math.atan2(effD, effW);
    const t_L = Math.PI + t_R;
    const t_Back = Math.atan2(effD, effW);
    const t_Front = Math.PI + t_Back;
    
    const getPt = (t, z) => [cx + rx * Math.cos(t), cy + ry * Math.sin(t), z];
    const A = getPt(t_L, 0), B = getPt(t_R, 0);
    const F = getPt(t_Front, 0), K = getPt(t_Back, 0);
    const O = [cx, cy, 0];

    if (type === 'cylinder') {
      const C = getPt(t_L, h), D = getPt(t_R, h);
      const G = getPt(t_Front, h), L = getPt(t_Back, h);
      const P = [cx, cy, h];
      
      coords3D = { A, B, F, K, C, D, G, L, O, P };
      edges = [['A', 'C'], ['B', 'D']];
      paths = [generateCircle(effW, effD, 0), generateCircle(effW, effD, h)];
      faces = [
        { id: 'Axial', name: 'Axial Plane', points: ['A', 'B', 'C', 'D', 'O', 'P'], visualPoints: ['A', 'B', 'D', 'C'] },
        { id: 'Base', name: 'Bottom Base', points: ['A', 'B', 'F', 'K', 'O'], isCircle: true, pathIndex: 0 },
        { id: 'Top', name: 'Top Base', points: ['C', 'D', 'G', 'L', 'P'], isCircle: true, pathIndex: 1 }
      ];
      labels = [
        { text: `r=${r}`, p1: O, p2: B, offset: [10, 15] },
        { text: `h=${h}`, p1: A, p2: C, offset: [-25, 0] }
      ];
    } else {
      const V = [cx, cy, h];
      
      coords3D = { A, B, F, K, V, O };
      edges = [['A', 'V'], ['B', 'V']];
      paths = [generateCircle(effW, effD, 0)];
      faces = [
        { id: 'Axial', name: 'Axial Plane', points: ['A', 'B', 'V', 'O'], visualPoints: ['A', 'B', 'V'] },
        { id: 'Base', name: 'Bottom Base', points: ['A', 'B', 'F', 'K', 'O'], isCircle: true, pathIndex: 0 }
      ];
      labels = [
        { text: `r=${r}`, p1: O, p2: B, offset: [10, 15] },
        { text: `h=${h}`, p1: [cx, cy, 0], p2: V, offset: [25, 0] }
      ];
    }
  }

  const midpoints = {};
  edges.forEach(([v1, v2]) => {
    midpoints[`M_${v1}${v2}`] = [
      (coords3D[v1][0] + coords3D[v2][0]) / 2,
      (coords3D[v1][1] + coords3D[v2][1]) / 2,
      (coords3D[v1][2] + coords3D[v2][2]) / 2
    ];
  });

  return {
    name: type === 'cuboid' ? 'Cuboid' : type === 'rect_pyramid' ? 'Pyramid' : type === 'cylinder' ? 'Cylinder' : 'Cone',
    coords3D: { ...coords3D, ...midpoints },
    edges,
    faces,
    paths,
    labels,
    projConstants: activeProjConstants
  };
};

export default function GeometryVisualizer() {
  const [selectedSolidType, setSelectedSolidType] = useState('cuboid');
  const [dims, setDims] = useState({ w: 4, d: 4, h: 4, r: 2 });
  const [step, setStep] = useState(1);
  const [userLine, setUserLine] = useState([]);
  const [userPlanePoints, setUserPlanePoints] = useState([]);
  
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const svgRef = useRef(null);

  const solid = generateSolid(selectedSolidType, dims.w, dims.d, dims.h, dims.r);

  const handleSolidChange = (type) => {
    setSelectedSolidType(type);
    setStep(1); setUserLine([]); setUserPlanePoints([]); setHoveredPoint(null);
  };

  const handleDimChange = (axis, value) => {
    setDims(prev => ({ ...prev, [axis]: parseFloat(value) }));
  };

  const handleVertexClick = (v) => {
    if (!v) return;
    if (step === 1) {
      setUserLine([v]); setStep(2);
    } else if (step === 2 && !userLine.includes(v)) {
      setUserLine([...userLine, v]); setStep(3);
    } else if (step >= 3 && step <= 5 && !userPlanePoints.includes(v)) {
      const newPoints = [...userPlanePoints, v];
      setUserPlanePoints(newPoints);
      setStep(step + 1); 
    }
  };

  const handleMouseMove = (e) => {
    if (step > 5 || !svgRef.current) return;
    
    const svg = svgRef.current;
    let pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    let cursor = pt.matrixTransform(svg.getScreenCTM().inverse());

    let closest = null;
    let minDist = 40; 

    Object.entries(solid.coords3D).forEach(([label, coords]) => {
      const isMidpoint = label.startsWith('M_');
      if (isMidpoint && step > 2) return;

      const pt2D = projectTo2D(coords);
      const dist = Math.hypot(pt2D[0] - cursor.x, pt2D[1] - cursor.y);
      
      if (dist < minDist) {
        minDist = dist;
        closest = label;
      }
    });

    setHoveredPoint(closest);
  };

  const getDisplayName = (vId) => {
    if (!vId.startsWith('M_')) return vId;
    const midpointsInLine = userLine.filter(id => id.startsWith('M_'));
    const idx = userLine.indexOf(vId);
    
    if (idx !== -1) {
      return midpointsInLine[0] === vId ? 'M' : 'N';
    } else {
      return midpointsInLine.length > 0 ? 'N' : 'M';
    }
  };

  const projectTo2D = (pt3D) => {
    const { oX, oY, uX, uY, uZ } = solid.projConstants;
    return [
      oX + pt3D[0] * uX[0] + pt3D[1] * uY[0] + pt3D[2] * uZ[0],
      oY + pt3D[0] * uX[1] + pt3D[1] * uY[1] + pt3D[2] * uZ[1]
    ];
  };

  const generateArcPath = (center, v1, v2, radius) => {
    const u = norm([v1[0], v1[1], 0]);
    const v = norm([v2[0], v2[1], 0]);
    const p1 = [center[0] + u[0] * radius, center[1] + u[1] * radius];
    const p2 = [center[0] + v[0] * radius, center[1] + v[1] * radius];
    const sweep = (u[0] * v[1] - u[1] * v[0]) > 0 ? 1 : 0;
    return `M ${p1[0]} ${p1[1]} A ${radius} ${radius} 0 0 ${sweep} ${p2[0]} ${p2[1]}`;
  };

  const findVertexName = (pt3D) => {
    for (const [name, coords] of Object.entries(solid.coords3D)) {
      if (len(sub(coords, pt3D)) < 0.1) return getDisplayName(name);
    }
    return 'Q'; 
  };

  let analysis = null;
  let matchedFace = null;

  if (step === 6) {
    matchedFace = solid.faces.find(f => userPlanePoints.every(pt => f.points.includes(pt)));
    const L1 = solid.coords3D[userLine[0]];
    const L2 = solid.coords3D[userLine[1]];
    const P1 = solid.coords3D[userPlanePoints[0]];
    const P2 = solid.coords3D[userPlanePoints[1]];
    const P3 = solid.coords3D[userPlanePoints[2]];

    const v1 = sub(P2, P1);
    const v2 = sub(P3, P1);
    const planeNormal = norm(cross(v1, v2));
    
    if (len(planeNormal) > 0.001) {
      const int3D = getLinePlaneIntersection(L1, L2, P1, planeNormal);

      if (int3D) {
        const dist1 = len(sub(L1, int3D));
        const dist2 = len(sub(L2, int3D));
        const target3D = dist1 > dist2 ? L1 : L2; 
        const targetName = dist1 > dist2 ? getDisplayName(userLine[0]) : getDisplayName(userLine[1]);

        const wVec = sub(target3D, P1);
        const distToPlane = dot(wVec, planeNormal);
        const drop3D = sub(target3D, scale(planeNormal, distToPlane));

        const vecLine = norm(sub(target3D, int3D));
        const vecProj = norm(sub(drop3D, int3D));
        const angleRad = Math.acos(Math.max(-1, Math.min(1, dot(vecLine, vecProj))));
        const angleDeg = (angleRad * 180 / Math.PI).toFixed(1);

        const intName = findVertexName(int3D);
        const dropName = findVertexName(drop3D);
        const fullAngleName = `∠${targetName}${intName}${dropName}`;

        const markerSize = 0.4;
        const vToInt = norm(sub(int3D, drop3D));
        const vToTarget = norm(sub(target3D, drop3D));
        
        const rightAngleP1 = add(drop3D, scale(vToInt, markerSize));
        const rightAngleP3 = add(drop3D, scale(vToTarget, markerSize));
        const rightAngleP2 = add(drop3D, add(scale(vToInt, markerSize), scale(vToTarget, markerSize)));

        analysis = {
          int2D: projectTo2D(int3D), 
          target2D: projectTo2D(target3D), 
          drop2D: projectTo2D(drop3D),
          rightAngle2D: [projectTo2D(rightAngleP1), projectTo2D(rightAngleP2), projectTo2D(rightAngleP3)],
          arcPath: generateArcPath(projectTo2D(int3D), sub(projectTo2D(target3D), projectTo2D(int3D)), sub(projectTo2D(drop3D), projectTo2D(int3D)), 35), 
          angleDeg, targetName, intName, dropName, fullAngleName,
          isZero: angleDeg < 0.1
        };
      }
    }
  }

  const isCircularSolid = (selectedSolidType === 'cylinder' || selectedSolidType === 'cone');
  const dynamicViewBox = isCircularSolid ? "-50 -230 550 560" : "0 -20 450 400";

  return (
    <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden font-sans text-gray-800">
      
      <div className="w-full md:w-1/2 bg-slate-50 flex flex-col items-center p-6 border-b md:border-b-0 md:border-r border-gray-200 min-h-[500px] relative overflow-hidden">
        
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded shadow-sm text-sm font-semibold border border-gray-100 z-10 pointer-events-none">
          {step === 1 && <span className="text-red-600">Step 1: Select 1st vertex for the Line</span>}
          {step === 2 && <span className="text-red-600">Step 2: Select 2nd vertex for the Line</span>}
          {step === 3 && <span className="text-blue-600">Step 3: Select 1st vertex for Plane</span>}
          {step === 4 && <span className="text-blue-600">Step 4: Select 2nd vertex for Plane</span>}
          {step === 5 && <span className="text-blue-600">Step 5: Select 3rd vertex for Plane</span>}
          {step === 6 && <span className="text-green-600">Dynamic Analysis Complete</span>}
        </div>

        <svg 
          ref={svgRef}
          width="100%" 
          height="100%" 
          viewBox={dynamicViewBox} 
          className={`max-w-full h-auto mt-4 overflow-visible ${step <= 5 ? 'cursor-pointer' : ''}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
          onClick={() => { if (hoveredPoint && step <= 5) handleVertexClick(hoveredPoint); }}
        >
          {userPlanePoints.length === 3 && (
            <polygon
              points={
                (matchedFace && matchedFace.isCircle)
                  ? solid.paths[matchedFace.pathIndex].map(p => projectTo2D(p).join(',')).join(' ')
                  : (matchedFace ? (matchedFace.visualPoints || matchedFace.points) : userPlanePoints)
                      .filter(v => solid.coords3D[v]) 
                      .map(v => projectTo2D(solid.coords3D[v]).join(','))
                      .join(' ')
              }
              fill="rgba(59, 130, 246, 0.15)" stroke="rgba(37, 99, 235, 0.4)" strokeWidth="2"
              className="pointer-events-none"
            />
          )}

          {analysis && !analysis.isZero && (
            <g className="pointer-events-none">
              <polygon
                points={`
                  ${analysis.int2D[0]},${analysis.int2D[1]} 
                  ${analysis.target2D[0]},${analysis.target2D[1]} 
                  ${analysis.drop2D[0]},${analysis.drop2D[1]}
                `}
                fill="rgba(99, 102, 241, 0.2)" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round"
              />
              <polyline
                points={`
                  ${analysis.rightAngle2D[0].join(',')} 
                  ${analysis.rightAngle2D[1].join(',')} 
                  ${analysis.rightAngle2D[2].join(',')}
                `}
                fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="miter"
              />
            </g>
          )}

          {solid.paths?.map((pathPts, idx) => (
            <polygon
              key={`path-${idx}`}
              points={pathPts.map(p => projectTo2D(p).join(',')).join(' ')}
              fill={idx === 0 ? "rgba(203, 213, 225, 0.15)" : "transparent"} 
              stroke="#cbd5e1" 
              strokeWidth="2"
              className="pointer-events-none"
            />
          ))}

          {solid.edges.map((edge, idx) => {
            const edgeId = `M_${edge[0]}${edge[1]}`;
            const p1 = projectTo2D(solid.coords3D[edge[0]]);
            const p2 = projectTo2D(solid.coords3D[edge[1]]);
            const isHoveredEdge = hoveredPoint === edgeId && step <= 2;

            return (
              <line
                key={`edge-${idx}`} 
                x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]}
                stroke={isHoveredEdge ? "#94a3b8" : "#cbd5e1"} 
                strokeWidth={isHoveredEdge ? "3" : "2"} 
                strokeLinecap="round" 
                className="transition-colors duration-200 pointer-events-none"
              />
            );
          })}

          {solid.edges.map((edge, idx) => {
            const edgeId = `M_${edge[0]}${edge[1]}`;
            const isSelected = userLine.includes(edgeId);
            const isHovered = hoveredPoint === edgeId;
            const canInteract = step <= 2;
            
            if (!isSelected && !(isHovered && canInteract)) return null;

            const displayName = getDisplayName(edgeId);
            const pt = projectTo2D(solid.coords3D[edgeId]);
            
            return (
              <g key={`mid-${idx}`} className="pointer-events-none">
                <circle 
                  cx={pt[0]} cy={pt[1]} r="16" 
                  fill={isHovered && !isSelected ? "rgba(100, 116, 139, 0.15)" : "transparent"} 
                  className="transition-all duration-200"
                />
                <circle cx={pt[0]} cy={pt[1]} r={isSelected ? "7" : "5"} fill={isSelected ? "#ef4444" : "#64748b"} />
                <text
                  x={pt[0] + 12} y={pt[1] + 14}
                  fontSize="12" fontWeight="bold" fill={isSelected ? "#ef4444" : "#64748b"}
                  className="select-none drop-shadow-sm"
                >
                  {displayName}
                </text>
              </g>
            );
          })}

          {selectedSolidType === 'rect_pyramid' && (
            <line
              x1={projectTo2D(solid.coords3D['O'])[0]} y1={projectTo2D(solid.coords3D['O'])[1]}
              x2={projectTo2D(solid.coords3D['E'])[0]} y2={projectTo2D(solid.coords3D['E'])[1]}
              stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,4" className="pointer-events-none"
            />
          )}

          {solid.labels.map((lbl, idx) => {
            const mid3D = [(lbl.p1[0] + lbl.p2[0]) / 2, (lbl.p1[1] + lbl.p2[1]) / 2, (lbl.p1[2] + lbl.p2[2]) / 2];
            const mid2D = projectTo2D(mid3D);
            return (
              <g key={`lbl-${idx}`} className="pointer-events-none">
                <text
                  x={mid2D[0] + lbl.offset[0]} y={mid2D[1] + lbl.offset[1]}
                  fontSize="14" fill="#64748b" fontWeight="600" textAnchor="middle"
                >
                  {lbl.text}
                </text>
              </g>
            );
          })}

          {userLine.length === 2 && (
            <line
              x1={projectTo2D(solid.coords3D[userLine[0]])[0]} y1={projectTo2D(solid.coords3D[userLine[0]])[1]}
              x2={projectTo2D(solid.coords3D[userLine[1]])[0]} y2={projectTo2D(solid.coords3D[userLine[1]])[1]}
              stroke="#ef4444" strokeWidth="4" strokeLinecap="round" className="pointer-events-none"
            />
          )}

          {analysis && !analysis.isZero && (
            <g className="pointer-events-none">
              <path d={analysis.arcPath} fill="transparent" stroke="#ef4444" strokeWidth="3" />
              <text
                x={analysis.int2D[0] + (analysis.target2D[0] - analysis.int2D[0])*0.18 + (analysis.drop2D[0] - analysis.int2D[0])*0.18}
                y={analysis.int2D[1] + (analysis.target2D[1] - analysis.int2D[1])*0.18 + (analysis.drop2D[1] - analysis.int2D[1])*0.18}
                fontSize="16" fontWeight="bold" fill="#ef4444" textAnchor="middle"
              >
                θ
              </text>
              <circle cx={analysis.drop2D[0]} cy={analysis.drop2D[1]} r="4" fill="#6366f1" />
            </g>
          )}

          {Object.entries(solid.coords3D).map(([label, coords]) => {
            if (label.startsWith('M_')) return null; 

            const pt = projectTo2D(coords);
            const isLinePoint = userLine.includes(label);
            const isPlanePoint = userPlanePoints.includes(label);
            const isHovered = hoveredPoint === label && step <= 5;
            const isCenterPoint = label === 'O' || label === 'P';
            
            let dotColor = isCenterPoint ? "#94a3b8" : "#334155";
            let haloColor = "rgba(51, 65, 85, 0.15)";
            
            if (isLinePoint) { dotColor = "#ef4444"; haloColor = "rgba(239, 68, 68, 0.15)"; }
            else if (isPlanePoint) { dotColor = "#3b82f6"; haloColor = "rgba(59, 130, 246, 0.15)"; }
            
            const isOblique = (selectedSolidType === 'cuboid' || selectedSolidType === 'rect_pyramid');
            const offsetX = isOblique ? (pt[0] > 200 ? 12 : -22) : (pt[0] > 225 ? 12 : -22);
            const offsetY = isOblique ? (pt[1] > 150 ? 20 : -10) : (pt[1] > 290 ? 20 : -10);

            return (
              <g key={`label-${label}`} className="pointer-events-none">
                <circle 
                  cx={pt[0]} cy={pt[1]} r="16" 
                  fill={isHovered ? haloColor : "transparent"} 
                  className="transition-all duration-200"
                />
                <circle cx={pt[0]} cy={pt[1]} r={isLinePoint || isPlanePoint ? "7" : "5"} fill={dotColor} />
                <text
                  x={pt[0] + offsetX}
                  y={pt[1] + offsetY}
                  fontSize="16" fontWeight="bold" fill={dotColor}
                  className="select-none drop-shadow-sm"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="w-full md:w-1/2 p-8 flex flex-col space-y-6">
        <div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => handleSolidChange('cuboid')}
              className={`py-2 px-4 rounded-lg font-bold transition-all border-2 ${
                selectedSolidType === 'cuboid' 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                  : 'bg-white text-slate-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              Cuboid
            </button>
            <button
              onClick={() => handleSolidChange('rect_pyramid')}
              className={`py-2 px-4 rounded-lg font-bold transition-all border-2 ${
                selectedSolidType === 'rect_pyramid' 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                  : 'bg-white text-slate-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              Pyramid
            </button>
            <button
              onClick={() => handleSolidChange('cylinder')}
              className={`py-2 px-4 rounded-lg font-bold transition-all border-2 ${
                selectedSolidType === 'cylinder' 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                  : 'bg-white text-slate-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              Cylinder
            </button>
            <button
              onClick={() => handleSolidChange('cone')}
              className={`py-2 px-4 rounded-lg font-bold transition-all border-2 ${
                selectedSolidType === 'cone' 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                  : 'bg-white text-slate-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              Cone
            </button>
          </div>

          <div className={`grid ${isCircularSolid ? 'grid-cols-2' : 'grid-cols-3'} gap-4 mb-2`}>
            {(isCircularSolid ? ['r', 'h'] : ['w', 'd', 'h']).map((axis) => (
              <div key={axis}>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  {axis === 'w' ? 'Width' : axis === 'd' ? 'Depth' : axis === 'h' ? 'Height' : 'Radius'} ({dims[axis]})
                </label>
                <input 
                  type="range" min="2" 
                  max={axis === 'r' ? "4" : "8"} 
                  step="0.5"
                  value={dims[axis]} onChange={(e) => handleDimChange(axis, e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <button 
            onClick={() => { setStep(1); setUserLine([]); setUserPlanePoints([]); setHoveredPoint(null); }}
            className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg transition-colors border-2 border-transparent"
          >
            Reset Selection
          </button>
        </div>

        {step === 6 && (
          <div className="p-5 rounded-lg border-l-4 mt-auto shadow-sm bg-blue-50 border-blue-600">
            {analysis ? (
              analysis.isZero ? (
                <>
                  <h3 className="font-bold text-lg text-blue-900 mb-1">Parallel Entities</h3>
                  <p className="text-sm text-blue-800">The line is parallel to the plane. Angle is exactly <strong>0°</strong>.</p>
                </>
              ) : (
                <div className="flex items-end justify-between">
                  <h3 className="font-bold text-lg text-blue-900">Calculated Angle:</h3>
                  <div className="text-right">
                    <span className="text-3xl font-black text-red-600">{analysis.angleDeg}°</span>
                    <span className="block text-md font-bold text-blue-800 tracking-wider">({analysis.fullAngleName})</span>
                  </div>
                </div>
              )
            ) : (
              <p className="text-sm text-red-800 font-semibold">Invalid selection: The 3 chosen points are collinear and cannot define a valid 3D plane.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}