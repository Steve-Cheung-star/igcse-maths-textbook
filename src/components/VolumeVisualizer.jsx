import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import * as LucideIcons from 'lucide-react';

const { Box, CircleDashed, Hexagon, BoxSelect, Shrink, Maximize, Minimize } = LucideIcons;

export default function VolumeVisualizer() {
  const containerRef = useRef(null);
  const [is3D, setIs3D] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shapeType, setShapeType] = useState('rectangle');
  
  // Dimensions
  const [width, setWidth] = useState(6);
  const [length, setLength] = useState(14);
  const [radius, setRadius] = useState(5);
  const [sides, setSides] = useState(6);
  const [angle, setAngle] = useState(270);
  const [height, setHeight] = useState(4.5);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  // 1. Generate the Solid Geometry Shape
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    if (shapeType === 'rectangle') {
      s.moveTo(-width / 2, -length / 2);
      s.lineTo(width / 2, -length / 2);
      s.lineTo(width / 2, length / 2);
      s.lineTo(-width / 2, length / 2);
      s.closePath(); 
    } else if (shapeType === 'polygon') {
      for (let i = 0; i < sides; i++) {
        const theta = (i / sides) * Math.PI * 2;
        if (i === 0) s.moveTo(Math.cos(theta) * radius, Math.sin(theta) * radius);
        else s.lineTo(Math.cos(theta) * radius, Math.sin(theta) * radius);
      }
      s.closePath(); 
    } else if (shapeType === 'sector') {
      if (angle >= 360) {
        s.moveTo(radius, 0); 
        s.absarc(0, 0, radius, 0, Math.PI * 2, false);
      } else {
        const rad = (angle * Math.PI) / 180;
        s.moveTo(0, 0);
        // FIX: Explicitly draw a line from the center to the edge so Three.js doesn't skip the origin
        s.lineTo(radius, 0); 
        s.absarc(0, 0, radius, 0, rad, false);
        // FIX: Explicitly draw a line from the arc end back to the center
        s.lineTo(0, 0);
      }
    }
    return s;
  }, [shapeType, width, length, radius, sides, angle]);

  // 2. Generate the 100% Perfect Mathematical Edges
  const edgesGeometry = useMemo(() => {
    const pts = [];
    if (shapeType === 'rectangle') {
      pts.push([-width / 2, -length / 2], [width / 2, -length / 2], [width / 2, length / 2], [-width / 2, length / 2]);
    } else if (shapeType === 'polygon') {
      for (let i = 0; i < sides; i++) {
        const theta = (i / sides) * Math.PI * 2;
        pts.push([Math.cos(theta) * radius, Math.sin(theta) * radius]);
      }
    } else if (shapeType === 'sector') {
      if (angle >= 360) {
        for (let i = 0; i < 64; i++) {
          const theta = (i / 64) * Math.PI * 2;
          pts.push([Math.cos(theta) * radius, Math.sin(theta) * radius]);
        }
      } else {
        pts.push([0, 0]);
        const maxTheta = (angle * Math.PI) / 180;
        for (let i = 0; i <= 64; i++) {
          const theta = (i / 64) * maxTheta;
          pts.push([Math.cos(theta) * radius, Math.sin(theta) * radius]);
        }
      }
    }

    const lines = [];
    const h = is3D ? height : 0.1;
    const addLine = (p1, p2, z1, z2) => lines.push(p1[0], p1[1], z1, p2[0], p2[1], z2);

    // Draw top and bottom perimeter loops
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      addLine(p1, p2, 0, 0); // Bottom loop
      addLine(p1, p2, h, h); // Top loop
    }

    // Draw strict vertical seam lines
    if (shapeType === 'rectangle' || shapeType === 'polygon') {
      for (let i = 0; i < pts.length; i++) addLine(pts[i], pts[i], 0, h);
    } else if (shapeType === 'sector' && angle < 360) {
      addLine(pts[0], pts[0], 0, h); // Center seam
      addLine(pts[1], pts[1], 0, h); // Arc start seam
      addLine(pts[pts.length - 1], pts[pts.length - 1], 0, h); // Arc end seam
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
    return geo;
  }, [shapeType, width, length, radius, sides, angle, is3D, height]);

  const baseArea = useMemo(() => {
    if (shapeType === 'rectangle') return width * length;
    if (shapeType === 'polygon') return (sides * Math.pow(radius, 2) * Math.sin((2 * Math.PI) / sides)) / 2;
    if (shapeType === 'sector') return Math.PI * Math.pow(radius, 2) * (angle / 360);
    return 0;
  }, [shapeType, width, length, radius, sides, angle]);

  const styles = {
    container: { position: 'relative', width: '100%', height: isFullscreen ? '100vh' : '700px', backgroundColor: '#0f172a', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif', borderRadius: isFullscreen ? '0' : '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
    canvasWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 },
    leftHUD: { position: 'absolute', top: '20px', left: '20px', zIndex: 10, width: '320px', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: 'calc(100% - 40px)', overflowY: 'auto' },
    rightHUD: { position: 'absolute', top: '20px', right: '20px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' },
    card: { backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', minWidth: '220px' },
    buttonToggle: { flex: 1, padding: '10px 0', border: 'none', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' },
    sliderLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' },
    sliderValue: { color: '#4f46e5', minWidth: '70px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '700', whiteSpace: 'nowrap' },
    inputRange: { width: '100%', cursor: 'pointer', accentColor: '#4f46e5' },
    statRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '14px', color: '#475569' },
    statValue: { fontFamily: 'monospace', fontWeight: '700', color: '#1e293b', width: '80px', textAlign: 'right' }
  };

  return (
    <div ref={containerRef} style={styles.container}>
      
      {/* 3D CANVAS */}
      <div style={styles.canvasWrap}>
        <Canvas camera={{ position: [10, 12, 10], fov: 40 }}>
          <ambientLight intensity={0.7} />
          <pointLight position={[20, 30, 10]} intensity={1.5} />
          <group position={[0, is3D ? -height/2 : 0, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <extrudeGeometry args={[shape, { depth: is3D ? height : 0.1, bevelEnabled: false, curveSegments: shapeType === 'sector' ? 64 : 1 }]} />
              <meshStandardMaterial color="#6366f1" transparent opacity={is3D ? 0.9 : 0.7} roughness={0.2} polygonOffset={true} polygonOffsetFactor={1} polygonOffsetUnits={1} />
              {/* MATHEMATICALLY PERFECT CUSTOM WIREFRAME */}
              <lineSegments geometry={edgesGeometry}>
                <lineBasicMaterial color="white" linewidth={1} />
              </lineSegments>
            </mesh>
            <gridHelper args={[40, 40, '#334155', '#1e293b']} position={[0, -0.05, 0]} />
          </group>
          <OrbitControls makeDefault minDistance={5} maxDistance={40} />
        </Canvas>
      </div>

      {/* LEFT HUD: CONTROLS */}
      <div style={styles.leftHUD}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>Volume Builder</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Design & Extrude Base</p>
        </div>

        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
          <button onClick={() => setShapeType('rectangle')} style={{ ...styles.buttonToggle, backgroundColor: shapeType === 'rectangle' ? '#fff' : 'transparent', color: shapeType === 'rectangle' ? '#4f46e5' : '#64748b', boxShadow: shapeType === 'rectangle' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            <Box size={18} /> Rect
          </button>
          <button onClick={() => setShapeType('polygon')} style={{ ...styles.buttonToggle, backgroundColor: shapeType === 'polygon' ? '#fff' : 'transparent', color: shapeType === 'polygon' ? '#4f46e5' : '#64748b', boxShadow: shapeType === 'polygon' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            <Hexagon size={18} /> Poly
          </button>
          <button onClick={() => setShapeType('sector')} style={{ ...styles.buttonToggle, backgroundColor: shapeType === 'sector' ? '#fff' : 'transparent', color: shapeType === 'sector' ? '#4f46e5' : '#64748b', boxShadow: shapeType === 'sector' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            <CircleDashed size={18} /> Sector
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>1. Edit Base (2D)</h3>
          
          {shapeType === 'rectangle' && (
            <>
              <div>
                <div style={styles.sliderLabel}><span>Width</span><span style={styles.sliderValue}>{width.toFixed(1)} u</span></div>
                <input type="range" min="1" max="15" step="0.5" value={width} onChange={(e) => setWidth(Number(e.target.value))} style={styles.inputRange} />
              </div>
              <div>
                <div style={styles.sliderLabel}><span>Length</span><span style={styles.sliderValue}>{length.toFixed(1)} u</span></div>
                <input type="range" min="1" max="15" step="0.5" value={length} onChange={(e) => setLength(Number(e.target.value))} style={styles.inputRange} />
              </div>
            </>
          )}

          {shapeType === 'polygon' && (
            <>
              <div>
                <div style={styles.sliderLabel}><span>Radius</span><span style={styles.sliderValue}>{radius.toFixed(1)} u</span></div>
                <input type="range" min="1" max="12" step="0.5" value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={styles.inputRange} />
              </div>
              <div>
                <div style={styles.sliderLabel}><span>Sides</span><span style={styles.sliderValue}>{sides}</span></div>
                <input type="range" min="3" max="15" step="1" value={sides} onChange={(e) => setSides(Number(e.target.value))} style={styles.inputRange} />
              </div>
            </>
          )}

          {shapeType === 'sector' && (
            <>
              <div>
                <div style={styles.sliderLabel}><span>Radius</span><span style={styles.sliderValue}>{radius.toFixed(1)} u</span></div>
                <input type="range" min="1" max="12" step="0.5" value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={styles.inputRange} />
              </div>
              <div>
                <div style={styles.sliderLabel}><span>Angle</span><span style={styles.sliderValue}>{angle}°</span></div>
                <input type="range" min="10" max="360" step="10" value={angle} onChange={(e) => setAngle(Number(e.target.value))} style={styles.inputRange} />
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', opacity: is3D ? 1 : 0.5, transition: 'opacity 0.3s' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>2. Extrude Prism (3D)</h3>
          <div>
            <div style={styles.sliderLabel}><span>Height</span><span style={styles.sliderValue}>{height.toFixed(1)} u</span></div>
            <input type="range" min="1" max="20" step="0.5" value={height} onChange={(e) => setHeight(Number(e.target.value))} disabled={!is3D} style={styles.inputRange} />
          </div>
        </div>

        <button
          onClick={() => setIs3D(!is3D)}
          style={{ marginTop: '8px', padding: '16px', border: 'none', borderRadius: '12px', backgroundColor: is3D ? '#1e293b' : '#4f46e5', color: '#fff', fontWeight: '900', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: is3D ? 'none' : '0 10px 15px -3px rgba(79, 70, 229, 0.4)' }}
        >
          {is3D ? <><Shrink size={20} /> FLATTEN TO 2D</> : <><BoxSelect size={20} /> EXTRUDE PRISM</>}
        </button>
      </div>

      {/* RIGHT HUD: STATS & CONTROLS */}
      <div style={styles.rightHUD}>
        
        <button 
          onClick={toggleFullscreen}
          style={{ ...styles.card, minWidth: 'auto', padding: '12px', cursor: 'pointer', border: 'none', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
        </button>

        <div style={styles.card}>
          <div style={{ fontSize: '11px', fontWeight: '900', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Live Measurements</div>
          <div style={styles.statRow}><span>Base Area:</span><span style={styles.statValue}>{baseArea.toFixed(1)} u²</span></div>
          <div style={{ ...styles.statRow, opacity: is3D ? 1 : 0.4 }}><span>Height:</span><span style={styles.statValue}>× {is3D ? height.toFixed(1) : '0.0'} u</span></div>
          <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '12px 0' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' }}>Volume</span>
            <span style={{ fontSize: '28px', fontWeight: '900', color: '#4f46e5', fontFamily: 'monospace', lineHeight: '1' }}>{(is3D ? baseArea * height : 0).toFixed(1)} <span style={{ fontSize: '14px', color: '#818cf8' }}>u³</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}