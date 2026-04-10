import React, { useState, useRef, useEffect } from 'react';

export default function ProjectorCalculator() {
  const [isVisible, setIsVisible] = useState(false);
  const [inputStr, setInputStr] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSecond, setIsSecond] = useState(false);
  const [isDeg, setIsDeg] = useState(true);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [justCalculated, setJustCalculated] = useState(false);

  // Mobile check state
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  // New state to specifically detect iPads/Tablets (touch capability)
  const [isTouch, setIsTouch] = useState(false);

  const calcRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  // Handle Window Resizing to block on mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      // This is the most reliable way to detect iPad/Tablets to block keyboard
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Only auto-focus if it is NOT a touch device
    if (isVisible && inputRef.current && !isTouch) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isVisible, isTouch]);

  useEffect(() => {
    if (!isVisible || isMobile) return;

    const handleGlobalKey = (e: KeyboardEvent) => {
      if (calcRef.current && calcRef.current.contains(e.target as Node)) {
        e.stopImmediatePropagation();

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          document.getElementById('btn-hist-up')?.click();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          document.getElementById('btn-hist-down')?.click();
        } else if (e.key === 'Enter' || e.key === '=') {
          e.preventDefault();
          document.getElementById('btn-calc-enter')?.click();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setIsVisible(false);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKey, { capture: true });
    return () => window.removeEventListener('keydown', handleGlobalKey, { capture: true });
  }, [isVisible, isMobile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (justCalculated) setJustCalculated(false);
    setInputStr(e.target.value);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).tagName === 'INPUT') return;

    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };

    if (calcRef.current) {
      const rect = calcRef.current.getBoundingClientRect();
      initialPos.current = { x: rect.left, y: rect.top };

      calcRef.current.style.bottom = 'auto';
      calcRef.current.style.right = 'auto';
      calcRef.current.style.left = `${rect.left}px`;
      calcRef.current.style.top = `${rect.top}px`;
      calcRef.current.style.margin = '0';
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !calcRef.current) return;
    let newX = initialPos.current.x + (e.clientX - dragStart.current.x);
    let newY = initialPos.current.y + (e.clientY - dragStart.current.y);

    newX = Math.max(0, Math.min(newX, window.innerWidth - calcRef.current.offsetWidth));
    newY = Math.max(0, Math.min(newY, window.innerHeight - calcRef.current.offsetHeight));

    calcRef.current.style.left = `${newX}px`;
    calcRef.current.style.top = `${newY}px`;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    isDragging.current = false;
  };

  const dec2frac = (d: number) => {
    if (!d || Number.isInteger(d) || isNaN(d)) return null;
    let sign = d < 0 ? "-" : "";
    d = Math.abs(d);
    let h1 = 1, h2 = 0, k1 = 0, k2 = 1, b = d;
    do {
      let a = Math.floor(b);
      let aux = h1; h1 = a * h1 + h2; h2 = aux;
      aux = k1; k1 = a * k1 + k2; k2 = aux;
      b = 1 / (b - a);
    } while (Math.abs(d - h1 / k1) > d * 1.0E-6 && k1 < 10000);
    if (k1 > 10000) return null;
    return `${sign}${h1}/${k1}`;
  };

  const handlePress = (val: string, action?: string) => {
    let currentInput = inputStr;

    // Only trigger focus on desktop to keep cursor alive
    if (inputRef.current && !isTouch) inputRef.current.focus();

    if (action === 'second') return setIsSecond(!isSecond);

    if (action === 'history-up') {
      setJustCalculated(false);
      if (history.length === 0) return;
      const newIndex = historyIndex + 1 < history.length ? historyIndex + 1 : historyIndex;
      setHistoryIndex(newIndex);
      setInputStr(history[history.length - 1 - newIndex] || '');
      return;
    }

    if (action === 'history-down') {
      setJustCalculated(false);
      if (historyIndex <= 0) {
        setHistoryIndex(-1);
        setInputStr('');
        return;
      }
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setInputStr(history[history.length - 1 - newIndex]);
      return;
    }

    if (action === 'cursor-left' || action === 'cursor-right') {
      setJustCalculated(false);
      if (!inputRef.current) return;
      const pos = inputRef.current.selectionStart || 0;
      const newPos = action === 'cursor-left' ? Math.max(0, pos - 1) : pos + 1;
      inputRef.current.setSelectionRange(newPos, newPos);
      return;
    }

    if (action === 'clear') {
      setInputStr(''); setHistoryIndex(-1); setLastResult(null); setJustCalculated(false); return;
    }

    if (action === 'delete') {
      setJustCalculated(false);
      if (inputRef.current && !isTouch) {
        const pos = inputRef.current.selectionStart || 0;
        if (pos > 0) {
          setInputStr(currentInput.slice(0, pos - 1) + currentInput.slice(pos));
          setTimeout(() => inputRef.current?.setSelectionRange(pos - 1, pos - 1), 0);
        }
      } else {
        setInputStr(currentInput.length > 0 ? currentInput.slice(0, -1) : '');
      }
      return;
    }

    if (action === 'sd' && lastResult !== null) {
      setJustCalculated(false);
      if (currentInput.includes('/')) {
        setInputStr(parseFloat(lastResult.toPrecision(10)).toString());
      } else {
        const frac = dec2frac(lastResult);
        if (frac) setInputStr(frac);
      }
      return;
    }

    if (action === 'calculate') {
      if (!currentInput) return;

      const secretMessages: Record<string, string> = {
        '80085': 'Naughty naughty',
        '5318008': 'Get your head out of the gutter already',
        '0.7734': 'hELLO',
        '42': 'The Answer',
        '69': 'Nice.',
        '1337': 'LEET HAX0R',
        'Abi': 'Hi Abi! ⸜(｡˃ ᵕ ˂ )⸝♡',
        'Henry': 'Put that rubics cube away',
        'Kanna': 'My comfy chair thief, get her!',
        'Kiichi': 'derp',
        'Karley': 'meow',
        'Bartlett': 'Stop Cheunging me',
        'Laszlo': '',
      };

      if (secretMessages[currentInput]) {
        setInputStr(secretMessages[currentInput]);
        setLastResult(null);
        setJustCalculated(true);
        setHistory(prev => [...prev, currentInput]);
        setHistoryIndex(-1);
        return;
      }

      try {
        let expr = currentInput;

        const openBrackets = (expr.match(/\(/g) || []).length;
        const closeBrackets = (expr.match(/\)/g) || []).length;
        if (openBrackets > closeBrackets) {
          expr += ')'.repeat(openBrackets - closeBrackets);
        }

        // Translates A ˣ√ B  into (B)**(1/A) using the superscript x
        expr = expr.replace(/(\d+\.?\d*)\s*ˣ√\s*(\d+\.?\d*|\([^)]+\))/g, '(($2)**(1/($1)))');

        expr = expr
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/−/g, '-')
          .replace(/pi/gi, 'π')
          .replace(/([0-9])([a-zA-Zπ\(])/g, '$1*$2')
          .replace(/(\))([0-9a-zA-Zπ\(])/g, '$1*$2')
          .replace(/(π)([0-9a-zA-Z\(])/g, '$1*$2')
          .replace(/π/g, 'Math.PI')
          .replace(/²/g, '**2')
          .replace(/\^/g, '**')
          .replace(/√\(/g, 'Math.sqrt(')
          .replace(/log\(/g, 'Math.log10(')
          .replace(/ln\(/g, 'Math.log(')
          .replace(/e\*\*\(/g, 'Math.E**(')
          .replace(/\be\b/g, 'Math.E');

        const evaluate = new Function(`
          const d = x => x * (Math.PI / 180);
          const r = x => x * (180 / Math.PI);
          const sin = x => Math.sin(${isDeg} ? d(x) : x);
          const cos = x => Math.cos(${isDeg} ? d(x) : x);
          const tan = x => Math.tan(${isDeg} ? d(x) : x);
          const asin = x => ${isDeg} ? r(Math.asin(x)) : Math.asin(x);
          const acos = x => ${isDeg} ? r(Math.acos(x)) : Math.acos(x);
          const atan = x => ${isDeg} ? r(Math.atan(x)) : Math.atan(x);
          return ${expr};
        `);

        let result = evaluate();
        if (!isFinite(result)) throw new Error('Math Error');
        result = parseFloat(result.toPrecision(12));

        setHistory(prev => [...prev, currentInput]);
        setHistoryIndex(-1);
        setLastResult(result);
        setInputStr(result.toString());
        setJustCalculated(true);
      } catch (err) {
        setInputStr('Syntax Error');
        setLastResult(null);
        setJustCalculated(false);
      }
      return;
    }

    if (val) {
      let targetInput = currentInput;

      if (justCalculated) {
        setJustCalculated(false);
        const operators = ['+', '−', '×', '÷', '^', '^-1', '²', 'ˣ√'];
        if (operators.includes(val) && lastResult !== null) {
          targetInput = lastResult.toString();
        } else {
          targetInput = '';
        }
      }

      // Cursor support logic only runs if we are NOT on a tablet/touch device
      if (inputRef.current && !justCalculated && !isTouch) {
        const pos = inputRef.current.selectionStart || 0;
        setInputStr(targetInput.slice(0, pos) + val + targetInput.slice(pos));
        setTimeout(() => inputRef.current?.setSelectionRange(pos + val.length, pos + val.length), 0);
      } else {
        setInputStr(targetInput + val);
      }
      if (isSecond) setIsSecond(false);
    }
  };

  // If the screen is mobile, return absolutely nothing.
  if (isMobile) return null;

  return (
    <>
      <style>{`
        #wb-calculator.ti-30xb {
          position: fixed;
          bottom: 1rem; 
          right: 1rem;  
          z-index: 9999;
          
          background-color: #6fb048; 
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 15px 40px rgba(0,0,0,0.6), 0 0 20px rgba(111, 176, 72, 0.4);
          
          border-radius: 1.5rem 1.5rem 2rem 2rem;
          padding: 1rem;
          width: 320px;
          user-select: none;
          
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateY(20px) scale(0.95);
          transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), visibility 0.25s;
        }
        
        #wb-calculator.ti-30xb.open {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateY(0) scale(1);
        }

        .calc-toggle-fab {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          z-index: 9998;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          
          background: var(--sl-color-bg-nav, rgba(20, 20, 20, 0.65));
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.3s ease, box-shadow 0.3s ease;
        }
        
        .calc-toggle-fab:hover {
          transform: scale(1.15);
          background: #5a8e3a; 
          box-shadow: 0 8px 20px rgba(0,0,0,0.4), 0 0 15px rgba(90, 142, 58, 0.6);
        }
        
        #calc-screen-wrapper {
          background-color: #a9bca1;
          border-radius: 8px;
          padding: 10px;
          margin-bottom: 15px;
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.2), 0 0 10px rgba(169, 188, 161, 0.1);
          border: 2px solid #333;
          height: 80px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .screen-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          color: #333;
          font-family: monospace;
          margin-bottom: 5px;
        }

        #calc-input {
          background: transparent;
          border: none;
          outline: none;
          font-size: 1.5rem;
          font-family: monospace;
          text-align: right;
          width: 100%;
          color: #111;
        }

        .ti-grid-5 {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px 8px;
        }

        .calc-btn {
          border-radius: 20px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.85rem;
          border: none;
          box-shadow: 0 3px 0 rgba(0,0,0,0.4);
          cursor: pointer;
          color: white;
          transition: filter 0.1s;
        }

        .calc-btn:active {
          transform: translateY(3px);
          box-shadow: none;
        }

        .calc-btn:hover {
          filter: brightness(1.2);
        }

        .btn-gray { background-color: #444; }
        .btn-green { background-color: #4a752f; }
        .btn-blue { background-color: #006bc2; }
        
        .btn-white { 
          background-color: #ddd; 
          color: #000; 
          box-shadow: 0 3px 0 rgba(0,0,0,0.2); 
          font-size: 1.2rem;
          font-weight: 900;
        }
        
        .btn-white-blue { 
          background-color: #ddd; 
          color: #006bc2; 
          font-weight: 900; 
          box-shadow: 0 3px 0 rgba(0,0,0,0.2);
        }
        
        .d-pad-wrapper {
          grid-column: 4 / span 2;
          grid-row: 1 / span 2;
          background-color: #006bc2;
          border-radius: 30px;
          padding: 4px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          box-shadow: 0 3px 0 rgba(0,0,0,0.5);
        }

        .d-pad-btn {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .d-pad-btn svg {
          fill: white;
          width: 12px;
          height: 12px;
        }
        
        .d-pad-btn:hover {
          filter: brightness(1.2);
        }
        
        .d-pad-up { grid-column: 2; grid-row: 1; }
        .d-pad-down { grid-column: 2; grid-row: 2; }
        .d-pad-left { grid-column: 1; grid-row: 1 / span 2; }
        .d-pad-right { grid-column: 3; grid-row: 1 / span 2; }

      `}</style>

      {!isVisible && (
        <button className="calc-toggle-fab" onClick={() => setIsVisible(true)} title="Open Calculator">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
            <line x1="8" y1="6" x2="16" y2="6"></line>
            <line x1="16" y1="14" x2="16" y2="14.01"></line>
            <line x1="12" y1="14" x2="12" y2="14.01"></line>
            <line x1="8" y1="14" x2="8" y2="14.01"></line>
            <line x1="16" y1="10" x2="16" y2="10.01"></line>
            <line x1="12" y1="10" x2="12" y2="10.01"></line>
            <line x1="8" y1="10" x2="8" y2="10.01"></line>
            <line x1="16" y1="18" x2="16" y2="18.01"></line>
            <line x1="12" y1="18" x2="12" y2="18.01"></line>
            <line x1="8" y1="18" x2="8" y2="18.01"></line>
          </svg>
        </button>
      )}

      <div id="wb-calculator" className={`ti-30xb ${isVisible ? 'open' : ''}`} ref={calcRef}>

        <div id="calc-header" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} style={{ cursor: 'move', display: 'flex', justifyContent: 'center', marginBottom: '10px', color: 'rgba(255,255,255,0.9)', fontWeight: 'bold', letterSpacing: '1px' }}>
          <span>TI-30XB 𓃵</span>
        </div>

        <div id="calc-screen-wrapper">
          <div className="screen-header">
            <span>{isSecond ? '2ND' : ''}</span>
            <span onClick={() => setIsDeg(!isDeg)} style={{ cursor: 'pointer' }}>{isDeg ? 'DEG' : 'RAD'}</span>
          </div>
          <input
            ref={inputRef}
            id="calc-input"
            type="text"
            value={inputStr}
            onChange={handleInputChange}
            placeholder="0"
            autoComplete="off"
            spellCheck="false"
            // FIX: Set readOnly on touch devices to block the virtual keyboard
            readOnly={isTouch}
          />
        </div>

        <div className="ti-grid-5">
          <button className="calc-btn btn-gray" onClick={() => handlePress('', 'second')}>2nd</button>
          <button className="calc-btn btn-green" onClick={() => { }}>mode</button>
          <button className="calc-btn btn-green" onClick={() => handlePress('', 'delete')}>del</button>

          <div className="d-pad-wrapper">
            <button id="btn-hist-up" className="d-pad-btn d-pad-up" onClick={() => handlePress('', 'history-up')}>
              <svg viewBox="0 0 100 100"><path d="M50 20 L80 80 L20 80 Z" /></svg>
            </button>
            <button className="d-pad-btn d-pad-left" onClick={() => handlePress('', 'cursor-left')}>
              <svg viewBox="0 0 100 100"><path d="M20 50 L80 20 L80 80 Z" /></svg>
            </button>
            <button className="d-pad-btn d-pad-right" onClick={() => handlePress('', 'cursor-right')}>
              <svg viewBox="0 0 100 100"><path d="M80 50 L20 20 L20 80 Z" /></svg>
            </button>
            <button id="btn-hist-down" className="d-pad-btn d-pad-down" onClick={() => handlePress('', 'history-down')}>
              <svg viewBox="0 0 100 100"><path d="M50 80 L80 20 L20 20 Z" /></svg>
            </button>
          </div>

          <button className="calc-btn btn-green" onClick={() => handlePress(isSecond ? '10^(' : 'log(')}>{isSecond ? '10^x' : 'log'}</button>
          <button className="calc-btn btn-green" onClick={() => { }}>prb</button>
          <button className="calc-btn btn-green" onClick={() => { }}>data</button>

          <button className="calc-btn btn-green" onClick={() => handlePress(isSecond ? 'e^(' : 'ln(')}>{isSecond ? 'e^x' : 'ln'}</button>
          <button className="calc-btn btn-green" onClick={() => handlePress('/')}>n/d</button>
          <button className="calc-btn btn-green" onClick={() => handlePress('×10^(')}>x10ⁿ</button>
          <button className="calc-btn btn-green" onClick={() => { }}>table</button>
          <button className="calc-btn btn-green" onClick={() => handlePress('', 'clear')}>clear</button>

          <button className="calc-btn btn-green" onClick={() => handlePress('π')}>π</button>
          <button className="calc-btn btn-green" onClick={() => handlePress(isSecond ? 'asin(' : 'sin(')}>{isSecond ? 'sin⁻¹' : 'sin'}</button>
          <button className="calc-btn btn-green" onClick={() => handlePress(isSecond ? 'acos(' : 'cos(')}>{isSecond ? 'cos⁻¹' : 'cos'}</button>
          <button className="calc-btn btn-green" onClick={() => handlePress(isSecond ? 'atan(' : 'tan(')}>{isSecond ? 'tan⁻¹' : 'tan'}</button>
          <button className="calc-btn btn-blue" onClick={() => handlePress('÷')}>÷</button>

          <button className="calc-btn btn-green" onClick={() => handlePress(isSecond ? 'ˣ√' : '^')}>{isSecond ? 'ˣ√' : '^'}</button>
          <button className="calc-btn btn-green" onClick={() => handlePress('^-1')}>x⁻¹</button>
          <button className="calc-btn btn-green" onClick={() => handlePress('(')}>(</button>
          <button className="calc-btn btn-green" onClick={() => handlePress(')')}>)</button>
          <button className="calc-btn btn-blue" onClick={() => handlePress('×')}>×</button>

          <button className="calc-btn btn-green" onClick={() => handlePress(isSecond ? '√(' : '²')}>{isSecond ? '√' : 'x²'}</button>
          <button className="calc-btn btn-white" onClick={() => handlePress('7')}>7</button>
          <button className="calc-btn btn-white" onClick={() => handlePress('8')}>8</button>
          <button className="calc-btn btn-white" onClick={() => handlePress('9')}>9</button>
          <button className="calc-btn btn-blue" onClick={() => handlePress('−')}>−</button>

          <button className="calc-btn btn-green" onClick={() => { }}>x_abc</button>
          <button className="calc-btn btn-white" onClick={() => handlePress('4')}>4</button>
          <button className="calc-btn btn-white" onClick={() => handlePress('5')}>5</button>
          <button className="calc-btn btn-white" onClick={() => handlePress('6')}>6</button>
          <button className="calc-btn btn-blue" onClick={() => handlePress('+')}>+</button>

          <button className="calc-btn btn-green" onClick={() => { }}>sto→</button>
          <button className="calc-btn btn-white" onClick={() => handlePress('1')}>1</button>
          <button className="calc-btn btn-white" onClick={() => handlePress('2')}>2</button>
          <button className="calc-btn btn-white" onClick={() => handlePress('3')}>3</button>

          <button className="calc-btn btn-white-blue" style={{ fontSize: '0.8rem' }} onClick={() => handlePress('', 'sd')}>
            <svg viewBox="0 0 100 100" style={{ fill: '#006bc2', width: '20px', height: '20px' }}>
              {/* Balanced version: 10-unit center gap, symmetrical 30-unit width for each triangle */}
              <path d="M15 50 L45 22 L45 78 Z M85 50 L55 22 L55 78 Z" />
            </svg>
          </button>

          <button className="calc-btn btn-green" onClick={() => setIsVisible(false)}>off</button>
          <button className="calc-btn btn-white" onClick={() => handlePress('0')}>0</button>
          <button className="calc-btn btn-white" onClick={() => handlePress('.')}>.</button>
          <button className="calc-btn btn-white" onClick={() => handlePress('-')}>(-)</button>

          <button id="btn-calc-enter" className="calc-btn btn-white-blue" onClick={() => handlePress('', 'calculate')}>enter</button>
        </div>
      </div>
    </>
  );
}