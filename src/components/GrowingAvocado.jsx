import React, { useState, useEffect, useRef } from 'react';

const GrowingAvocado = () => {
  const [clicks, setClicks] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  
  const k = 1.0 + (clicks * 0.2); 
  const kArea = Math.pow(k, 2);    
  const kVol = Math.pow(k, 3);

  // 1. Create a ref for the HUD to target it specifically
  const hudRef = useRef(null);

  useEffect(() => {
    // Load KaTeX Assets if they don't exist
    if (!document.getElementById('katex-css')) {
      const link = document.createElement('link');
      link.id = 'katex-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
      document.head.appendChild(link);
    }

    const renderMath = () => {
      if (window.katex && hudRef.current) {
        // Find all elements with our data-latex attribute and render them
        const mathElements = hudRef.current.querySelectorAll('[data-latex]');
        mathElements.forEach(el => {
          const formula = el.getAttribute('data-latex');
          window.katex.render(formula, el, { throwOnError: false, displayMode: false });
        });
      }
    };

    if (!window.katex) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
      script.async = true;
      script.onload = renderMath;
      document.head.appendChild(script);
    } else {
      renderMath();
    }
  }, [clicks]); // Triggers every time the numbers change

  const handleInteraction = (e) => {
    if (e.cancelable) e.preventDefault();
    setClicks(prev => prev + 1);
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 100);
  };

  const AvocadoSVG = () => (
    <svg viewBox="0 0 51.36 81.14" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible', marginBottom: '-1.5px' }}>
      <g transform="matrix(0.35277, 0, 0, -0.35277, -12.65, 184.2)">
        <path d="m 99.951,521.64 c 25.759,0 47.259,-35.29 52.229,-82.2 l 0.38,-4.83 0.56,-0.37 c 3.97,-3.6 6.76,-12.03 6.76,-21.85 l -0.02,-0.35 3.17,-3.71 c 7.07,-9.58 11.57,-24.09 11.57,-40.33 0,-21.64 -8.01,-40.22 -19.42,-48.15 l -0.84,-0.51 -0.86,-0.92 c -8.16,-7.54 -27.28,-12.84 -49.56,-12.84 -11.14,0 -21.489,1.33 -30.074,3.59 l -3.222,0.94 -2.468,-0.25 c -17.561,0 -31.796,29.17 -31.796,65.16 0,17.99 3.559,34.28 9.313,46.08 l 1.076,1.82 0.165,6.29 c 2.73,51.92 25.434,92.43 53.037,92.43 z" fill="#37321b" stroke="currentColor" strokeWidth="1.5" />
        <path d="m 106.47,517.31 c 20.53,0 37.66,-34.58 41.62,-80.55 l 0.31,-4.73 0.44,-0.36 c 3.17,-3.53 5.39,-11.79 5.39,-21.42 l -0.02,-0.34 2.53,-3.63 c 5.63,-9.4 9.22,-23.61 9.22,-39.52 0,-21.22 -6.38,-39.42 -15.47,-47.2 l -0.67,-0.49 -0.69,-0.9 c -6.51,-7.4 -21.74,-12.59 -39.49,-12.59 -8.88,0 -17.127,1.3 -23.968,3.52 l -2.568,0.92 -1.967,-0.25 c -13.993,0 -25.337,28.59 -25.337,63.86 0,17.64 2.836,33.6 7.421,45.16 l 0.858,1.78 0.131,6.17 c 2.176,50.87 20.268,90.57 42.26,90.57 z" fill="#879751" stroke="currentColor" strokeWidth="1.5" />
        <path d="m 110.33,330.79 c 8.46,0 15.31,-8.55 15.31,-19.09 0,-10.54 -6.85,-19.08 -15.31,-19.08 -4.22,0 -8.05,2.13 -10.818,5.59 l -1.309,1.98 -0.016,-0.06 -10.863,4.21 -3.444,5.79 11.228,2.55 0.232,2.87 c 1.427,8.7 7.6,15.24 14.99,15.24 z" fill="#976b53" stroke="currentColor" strokeWidth="1.5" />
        <path d="m 172.45,337.62 c 1.82,-0.02 3.48,-0.5 4.87,-1.5 5.56,-4.01 4.63,-14.79 -2.07,-24.09 -6.71,-9.3 -16.64,-13.58 -22.2,-9.57 l -0.06,0.05 -25.64,8.91 12.22,10.37 11.56,-2.55 0.06,0.18 c 0.95,2.38 2.26,4.8 3.94,7.12 5.02,6.98 11.87,11.13 17.32,11.08 z" fill="#976b53" stroke="currentColor" strokeWidth="1.5" />
        <path d="m 94.68,374.72 c 0,20.28 11.6,36.73 25.92,36.73 14.32,0 25.92,-16.45 25.92,-36.73 0,-20.29 -11.6,-36.73 -25.92,-36.73 -14.32,0 -25.92,16.44 -25.92,36.73 z" fill="#643312" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="93.24" cy="453.94" r="5.04" fill="currentColor" />
        <circle cx="128.52" cy="456.82" r="3.6" fill="currentColor" />
        <path d="m 126.3,441.96 c -0.7,-8.91 -7.2,-15.44 -14.52,-14.6 -5.45,0.64 -10.03,5.26 -11.54,11.67" fill="none" stroke="currentColor" strokeWidth="2.5" />
      </g>
    </svg>
  );

  return (
    <div style={{ padding: '20px', width: '100%', height: '450px', background: 'transparent', color: 'inherit', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      {/* HUD: Ref is used to tell KaTeX where to look */}
      <div ref={hudRef} style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center',
        position: 'absolute', top: '10px', left: '10px', right: '10px', zIndex: 100,
        background: 'rgba(128, 128, 128, 0.1)', backdropFilter: 'blur(10px)', padding: '12px', 
        borderRadius: '12px', border: '1px solid rgba(128, 128, 128, 0.2)', pointerEvents: 'none'
      }}>
        <div>
          <div style={{ fontSize: '1rem', opacity: 0.6 }}>Linear</div>
          <div data-latex={`k = ${k.toFixed(2)}`} style={{ fontSize: '1.5rem', fontWeight: 'bold' }}></div>
        </div>
        <div>
          <div style={{ fontSize: '1rem', opacity: 0.6 }}>Area</div>
          <div data-latex={`k^2 = ${kArea.toFixed(2)}`} style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2ecc71' }}></div>
        </div>
        <div>
          <div style={{ fontSize: '1rem', opacity: 0.6 }}>Volume</div>
          <div data-latex={`k^3 = ${kVol.toFixed(2)}`} style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e67e22' }}></div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', borderBottom: '2px solid currentColor', marginBottom: '80px', opacity: 0.8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.2 }}>
          <div style={{ width: '60px', height: '90px' }}><AvocadoSVG /></div>
        </div>
        <div onMouseDown={handleInteraction} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
          <div style={{ 
            width: `${60 * k}px`, height: `${90 * k}px`, 
            display: 'flex', alignItems: 'flex-end', transition: '0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transformOrigin: 'bottom center', transform: isPressed ? 'scale(0.97)' : 'scale(1)',
          }}><AvocadoSVG /></div>
        </div>
      </div>

      <button onClick={() => setClicks(0)} style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(128, 128, 128, 0.1)', border: '1px solid rgba(128, 128, 128, 0.2)', color: 'currentColor', padding: '6px 15px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem' }}>
        Reset Plushie
      </button>
    </div>
  );
};

export default GrowingAvocado;