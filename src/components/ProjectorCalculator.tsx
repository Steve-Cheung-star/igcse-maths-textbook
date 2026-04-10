import React, { useState, useRef, useEffect } from 'react';

export default function ProjectorCalculator() {
  const [isVisible, setIsVisible] = useState(false);
  const [inputStr, setInputStr] = useState('');

  const [history, setHistory] = useState<{ expr: string, res: string, isSecret?: boolean }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectionMode, setSelectionMode] = useState<'expr' | 'res'>('expr');

  const [isSecond, setIsSecond] = useState(false);
  const [isDeg, setIsDeg] = useState(true);

  const [lastResult, setLastResult] = useState<string | null>(null);
  const [justCalculated, setJustCalculated] = useState(false);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  const [isTouch, setIsTouch] = useState(false);

  const calcRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-focus when the calculator is opened
  useEffect(() => {
    if (isVisible && !isMobile && !isTouch) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isVisible, isMobile, isTouch]);

  // Handle global keyboard inputs without stealing Astro's shortcuts
  useEffect(() => {
    if (!isVisible || isMobile) return;

    const handleGlobalKey = (e: KeyboardEvent) => {
      // 1. Ignore if typing in another standard input on the page
      const target = e.target as HTMLElement;
      if ((target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) && target !== inputRef.current) {
        return;
      }

      // 2. Escape puts the calculator away
      if (e.key === 'Escape') {
        setIsVisible(false);
        return;
      }

      // 3. If we clicked the whiteboard, completely ignore the keys so Astro can use "1", "2" and arrow keys scroll the page
      if (!isCalcAwake) return;

      // --- WE ARE AWAKE. TRAP THE KEYS. ---
      const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
      const validKeys = ['Enter', '=', 'Backspace'];
      const isMathKey = e.key.length === 1 && /[0-9\.+\-*/^()]/.test(e.key);

      if (isArrowKey || validKeys.includes(e.key) || isMathKey) {
        e.stopPropagation(); // Block Astro from seeing this key
      } else {
        return; // Let random keys (like letters) pass through natively
      }

      const keyMap: Record<string, string> = { '*': '×', '/': '÷', '-': '−' };

      // STRICT ARROW TRAPPING
      if (isArrowKey) {
        // ALWAYS prevent default on arrows when awake so the presentation NEVER scrolls
        // unless it's Left/Right moving the native text cursor
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          if (e.key === 'ArrowUp') handlePress('', 'history-up');
          if (e.key === 'ArrowDown') handlePress('', 'history-down');
        }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          // If we are interacting with history, we manually control the cursor
          if (historyIndex !== -1) {
            e.preventDefault();
            handlePress('', e.key === 'ArrowLeft' ? 'cursor-left' : 'cursor-right');
          } else {
            // We are just typing normally. Make sure the input is focused so native left/right works without scrolling the page!
            if (document.activeElement !== inputRef.current) {
              e.preventDefault();
              inputRef.current?.focus();
            }
          }
        }
        return;
      }

      // HANDLE MATH & ACTIONS
      if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handlePress('', 'calculate');
      } else if (e.key === 'Backspace') {
        if (justCalculated || historyIndex !== -1) {
          e.preventDefault();
          handlePress('', 'delete');
        }
      } else if (isMathKey) {
        if (justCalculated || historyIndex !== -1) {
          e.preventDefault();
          handlePress(keyMap[e.key] || e.key);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKey, { capture: true });
    return () => window.removeEventListener('keydown', handleGlobalKey, { capture: true });
  }, [isVisible, isMobile, inputStr, lastResult, justCalculated, historyIndex, history, selectionMode, isSecond, isDeg, isCalcAwake]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    if (justCalculated) {
      setJustCalculated(false);
      const lastChar = newVal.slice(-1);
      const operators = ['+', '-', '*', '/', '^', '−', '×', '÷'];

      if (operators.includes(lastChar) && lastResult !== null && lastResult !== 'Syntax Error') {
        setInputStr(lastResult + lastChar);
      } else {
        setInputStr(lastChar);
      }
      setLastResult(null);
      return;
    }
    setInputStr(newVal);
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

    if (!isTouch && action !== 'calculate' && action !== 'history-up' && action !== 'history-down') {
      inputRef.current?.focus();
    }

    if (action === 'second') return setIsSecond(!isSecond);

    if (action === 'history-up') {
      inputRef.current?.blur();
      if (history.length === 0) return;
      if (historyIndex === -1) {
        setHistoryIndex(0);
        setSelectionMode('res');
      } else if (selectionMode === 'res') {
        setSelectionMode('expr');
      } else if (historyIndex + 1 < history.length) {
        setHistoryIndex(historyIndex + 1);
        setSelectionMode('res');
      }
      return;
    }

    if (action === 'history-down') {
      if (historyIndex === -1) {
        // Acts like clear if pressing down on the current input line
        handlePress('', 'clear');
        setTimeout(() => inputRef.current?.focus(), 0);
        return;
      }

      inputRef.current?.blur();
      if (selectionMode === 'expr') {
        setSelectionMode('res');
      } else {
        if (historyIndex === 0) {
          setHistoryIndex(-1);
          setSelectionMode('expr');
          setTimeout(() => inputRef.current?.focus(), 0);
        } else {
          setHistoryIndex(historyIndex - 1);
          setSelectionMode('expr');
        }
      }
      return;
    }

    if (action === 'cursor-left' || action === 'cursor-right') {
      if (historyIndex !== -1) return;
      if (!inputRef.current) return;
      const pos = inputRef.current.selectionStart || 0;
      const newPos = action === 'cursor-left' ? Math.max(0, pos - 1) : pos + 1;
      setTimeout(() => inputRef.current?.setSelectionRange(newPos, newPos), 0);
      return;
    }

    if (action === 'clear') {
      setInputStr(''); setHistoryIndex(-1); setLastResult(null); setJustCalculated(false); return;
    }

    if (action === 'delete') {
      if (historyIndex !== -1) {
        setHistoryIndex(-1); setInputStr(''); setLastResult(null); setJustCalculated(false); return;
      }
      if (justCalculated) {
        if (lastResult === 'Syntax Error') {
          // Keep the expression, just clear the error and restore focus
          setLastResult(null);
          setJustCalculated(false);
          setTimeout(() => inputRef.current?.focus(), 0);
        } else {
          setInputStr(''); setLastResult(null); setJustCalculated(false);
        }
        return;
      }
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

    if (action === 'sd' && lastResult !== null && lastResult !== 'Syntax Error') {
      const numRes = parseFloat(lastResult);
      if (isNaN(numRes)) return;

      if (currentInput.includes('/')) {
        setInputStr(numRes.toPrecision(10).toString());
      } else {
        const frac = dec2frac(numRes);
        if (frac) setInputStr(frac);
      }
      return;
    }

    if (action === 'calculate') {
      if (historyIndex !== -1) {
        const entry = history[history.length - 1 - historyIndex];
        const copyText = selectionMode === 'res' ? entry.res : entry.expr;

        let newStr = '';
        let newPos = 0;

        // If we just solved a math problem, treat the copied history as a fresh start. 
        // Otherwise, append it seamlessly.
        if (justCalculated) {
          newStr = copyText;
          newPos = newStr.length;
        } else {
          if (inputRef.current && !isTouch) {
            const pos = inputRef.current.selectionStart || 0;
            newStr = currentInput.slice(0, pos) + copyText + currentInput.slice(pos);
            newPos = pos + copyText.length;
          } else {
            newStr = currentInput + copyText;
            newPos = newStr.length;
          }
        }

        setInputStr(newStr);
        setLastResult(null);
        setHistoryIndex(-1);
        setSelectionMode('expr');
        setJustCalculated(false);

        // Keep the calculator actively focused so the cursor blinks instantly
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.setSelectionRange(newPos, newPos);
          }
        }, 0);
        return;
      }

      if (!currentInput) return;

      const secretMessages: Record<string, string> = {
        '67': '⁶🤷‍♂️⁷',
        '80085': 'Naughty naughty',
        '5318008': 'Get your head out of the gutter already',
        '0.7734': 'hELLO',
        '42': 'The Answer',
        '69': 'Nice.',
        '1337': 'LEET HAX0R',
        'Abi': 'Hi Abi! ⸜(｡˃ ᵕ ˂ )⸝♡',
        'Henry': 'Put that Rubik\'s cube away!',
        'Kanna': 'My comfy chair thief, get her!',
        'Kiichi': 'derp',
        'Karley': 'meow ₍^. .^₎⟆',
        'Bartlett': 'Cheung, Cheung, what, whhhhhatttt?!!',
        'Tsuki': '⋆˖⁺‧₊☽◯☾₊‧⁺˖⋆',
        'Chenia': '做乜唔識啊？',
        'Kaya': 'Living a good life, thx!',
        'Hannah': 'Banana!',
        'Cameron': 'Work harder, eh?',
        'William': '🤪✌︎︎',
        'Kyle': '(ง •̀_•́)ง',
        'Douglas': 'ඞ',
        'Manly': 'What inspires you?',
        'Vincent': 'STOP PLAYING 𝗥⟐𝗕𝗟◘𝗫',
        'Ella': '*ੈ✩‧₊˚༺𝓔𝓵𝓵𝒂༻*ੈ✩‧₊˚',
      };

      if (secretMessages[currentInput]) {
        const msg = secretMessages[currentInput];
        setLastResult(msg); // Output to answer line
        setJustCalculated(true);
        inputRef.current?.blur();
        setHistory(prev => [...prev, { expr: currentInput, res: msg, isSecret: true }]);
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
        const resStr = parseFloat(result.toPrecision(12)).toString();

        setHistory(prev => [...prev, { expr: currentInput, res: resStr }]);
        setHistoryIndex(-1);
        setLastResult(resStr);
        setJustCalculated(true);
        inputRef.current?.blur();
      } catch (err) {
        setLastResult('Syntax Error'); // Output to answer line
        setJustCalculated(true);
        inputRef.current?.blur();
      }
      return;
    }

    if (val) {
      if (historyIndex !== -1) {
        setInputStr(val);
        setLastResult(null);
        setHistoryIndex(-1);
        setSelectionMode('expr');
        setJustCalculated(false);
        return;
      }

      const operators = ['+', '−', '×', '÷', '^', '^-1', '²', 'ˣ√'];
      let targetInput = currentInput;

      if (justCalculated) {
        setJustCalculated(false);
        if (operators.includes(val) && lastResult !== null && lastResult !== 'Syntax Error') {
          targetInput = lastResult + val;
        } else {
          targetInput = val;
        }
        setInputStr(targetInput);
        setLastResult(null);
        setTimeout(() => inputRef.current?.setSelectionRange(targetInput.length, targetInput.length), 0);
        return;
      }

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

  let displayInput = inputStr;
  let displayResult = lastResult;
  if (historyIndex !== -1) {
    const entry = history[history.length - 1 - historyIndex];
    displayInput = entry.expr;
    displayResult = entry.res;
  }

  const isInputHighlighted = historyIndex !== -1 && selectionMode === 'expr';
  const isResultHighlighted = historyIndex !== -1 && selectionMode === 'res';

  if (isMobile) return null;

  return (
    <>
      <style>{`
        #wb-calculator.ti-30xb {
          position: fixed; bottom: 1rem; right: 1rem; z-index: 9999;
          background-color: #6fb048; border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 15px 40px rgba(0,0,0,0.6), 0 0 20px rgba(111, 176, 72, 0.4);
          border-radius: 1.5rem 1.5rem 2rem 2rem; padding: 1rem; width: 320px;
          user-select: none; opacity: 0; visibility: hidden; pointer-events: none;
          transform: translateY(20px) scale(0.95);
          transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), visibility 0.25s;
        }
        
        #wb-calculator.ti-30xb.open {
          opacity: 1; visibility: visible; pointer-events: auto; transform: translateY(0) scale(1);
        }

        .calc-toggle-fab {
          position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9998; display: flex;
          align-items: center; justify-content: center; width: 50px; height: 50px; border-radius: 50%;
          background: var(--sl-color-bg-nav, rgba(20, 20, 20, 0.65)); backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); color: white;
          cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.3s ease, box-shadow 0.3s ease;
        }
        
        .calc-toggle-fab:hover {
          transform: scale(1.15); background: #5a8e3a; 
          box-shadow: 0 8px 20px rgba(0,0,0,0.4), 0 0 15px rgba(90, 142, 58, 0.6);
        }
        
        #calc-screen-wrapper {
          background-color: #a9bca1; border-radius: 8px; padding: 10px; margin-bottom: 15px;
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.2), 0 0 10px rgba(169, 188, 161, 0.1);
          border: 2px solid #333; height: 125px; display: flex; flex-direction: column;
        }

        .screen-header {
          display: flex; justify-content: space-between; font-size: 0.7rem; color: #333;
          font-family: monospace; margin-bottom: 5px; flex-shrink: 0;
        }

        .screen-content {
          display: flex; flex-direction: column; flex-grow: 1; justify-content: space-between;
          width: 100%; font-family: monospace; overflow: hidden;
        }

        #calc-input {
          background: transparent; border: none; outline: none; font-size: 1.2rem;
          font-family: monospace; text-align: left; color: #111; padding: 2px 4px;
          border-radius: 3px; width: 100%;
        }

        .calc-history-expr {
          font-size: 1.2rem; font-family: monospace; text-align: left; color: #111;
          padding: 2px 4px; font-style: italic; white-space: pre; border-radius: 3px;
        }

        .calc-result-display {
          font-size: 1.2rem; font-weight: bold; color: #111;
          padding: 2px 4px; border-radius: 3px; display: inline-block;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .highlight-side {
          background: rgba(0,0,0,0.15) !important;
        }

        .ti-grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px 8px; }

        .calc-btn {
          border-radius: 20px; height: 34px; display: flex; align-items: center; justify-content: center;
          font-weight: bold; font-size: 0.85rem; border: none; box-shadow: 0 3px 0 rgba(0,0,0,0.4);
          cursor: pointer; color: white; transition: filter 0.1s;
        }

        .calc-btn:active { transform: translateY(3px); box-shadow: none; }
        .calc-btn:hover { filter: brightness(1.2); }

        .btn-gray { background-color: #444; }
        .btn-green { background-color: #4a752f; }
        .btn-blue { background-color: #006bc2; }
        
        .btn-white { 
          background-color: #ddd; color: #000; box-shadow: 0 3px 0 rgba(0,0,0,0.2); 
          font-size: 1.2rem; font-weight: 900;
        }
        
        .btn-white-blue { 
          background-color: #ddd; color: #006bc2; font-weight: 900; box-shadow: 0 3px 0 rgba(0,0,0,0.2);
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
          background: transparent; border: none; color: white; cursor: pointer;
          font-size: 0.8rem; display: flex; align-items: center; justify-content: center;
        }
        
        .d-pad-btn:hover { text-shadow: 0 0 5px rgba(255,255,255,0.8); }
        .d-pad-btn:active { transform: scale(0.9); }
        
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
          <div className="screen-content">
            <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
              {historyIndex !== -1 ? (
                <span className={`calc-history-expr ${isInputHighlighted ? 'highlight-side' : ''}`}>
                  {displayInput || ' '}
                </span>
              ) : (
                <input
                  ref={inputRef}
                  id="calc-input"
                  type="text"
                  value={displayInput}
                  onChange={handleInputChange}
                  autoComplete="off"
                  spellCheck="false"
                  readOnly={isTouch}
                />
              )}
            </div>
            {displayResult !== null && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                <span className={`calc-result-display ${isResultHighlighted ? 'highlight-side' : ''}`}>
                  {displayResult}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="ti-grid-5">
          <button className="calc-btn btn-gray" onClick={() => handlePress('', 'second')}>2nd</button>
          <button className="calc-btn btn-green" onClick={() => { }}>mode</button>
          <button className="calc-btn btn-green" onClick={() => handlePress('', 'delete')}>del</button>

          <div className="d-pad-wrapper">
            <button id="btn-hist-up" className="d-pad-btn d-pad-up" onClick={() => handlePress('', 'history-up')}>
              <svg viewBox="0 0 100 100" style={{ width: '12px', height: '12px', fill: 'white' }}><path d="M50 20 L80 80 L20 80 Z" /></svg>
            </button>
            <button className="d-pad-btn d-pad-left" onClick={() => handlePress('', 'cursor-left')}>
              <svg viewBox="0 0 100 100" style={{ width: '12px', height: '12px', fill: 'white' }}><path d="M20 50 L80 20 L80 80 Z" /></svg>
            </button>
            <button className="d-pad-btn d-pad-right" onClick={() => handlePress('', 'cursor-right')}>
              <svg viewBox="0 0 100 100" style={{ width: '12px', height: '12px', fill: 'white' }}><path d="M80 50 L20 20 L20 80 Z" /></svg>
            </button>
            <button id="btn-hist-down" className="d-pad-btn d-pad-down" onClick={() => handlePress('', 'history-down')}>
              <svg viewBox="0 0 100 100" style={{ width: '12px', height: '12px', fill: 'white' }}><path d="M50 80 L80 20 L20 20 Z" /></svg>
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

          <button className="calc-btn btn-white-blue" onClick={() => handlePress('', 'sd')}>
            <svg viewBox="0 0 100 100" style={{ fill: '#006bc2', width: '20px', height: '20px' }}>
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