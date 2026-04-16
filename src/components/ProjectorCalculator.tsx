import React, { useState, useRef, useEffect } from 'react';

export default function ProjectorCalculator() {
  const [isVisible, setIsVisible] = useState(false);
  const [isCalcAwake, setIsCalcAwake] = useState(true);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (calcRef.current && !calcRef.current.contains(e.target as Node)) {
        setIsCalcAwake(false);
        inputRef.current?.blur();
      } else if (calcRef.current && calcRef.current.contains(e.target as Node)) {
        setIsCalcAwake(true);
        if (document.activeElement !== inputRef.current) {
          inputRef.current?.focus();
        }
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('touchstart', handleClickOutside);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isVisible && isCalcAwake && inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible, isCalcAwake, historyIndex, justCalculated]);

  useEffect(() => {
    if (!isVisible || isMobile) return;

    const handleGlobalKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if ((target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) && target !== inputRef.current) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setIsVisible(false);
        return;
      }

      if (!isCalcAwake) return;

      const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
      const validKeys = ['Enter', '=', 'Backspace'];
      const isMathKey = e.key.length === 1 && /[0-9\.+\-*/^()]/.test(e.key);

      if (isArrowKey || validKeys.includes(e.key) || isMathKey) {
        e.stopPropagation();
      } else {
        return;
      }

      const keyMap: Record<string, string> = { '*': '×', '/': '÷', '-': '−' };

      if (isArrowKey) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          if (e.key === 'ArrowUp') handlePress('', 'history-up');
          if (e.key === 'ArrowDown') handlePress('', 'history-down');
        }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          if (historyIndex !== -1) {
            e.preventDefault();
            handlePress('', e.key === 'ArrowLeft' ? 'cursor-left' : 'cursor-right');
          } else {
            if (document.activeElement !== inputRef.current) {
              e.preventDefault();
              inputRef.current?.focus();
            }
          }
        }
        return;
      }

      if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handlePress('', 'calculate');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handlePress('', 'delete');
      } else if (isMathKey) {
        e.preventDefault();
        handlePress(keyMap[e.key] || e.key);
      }
    };

    window.addEventListener('keydown', handleGlobalKey, { capture: true });
    return () => window.removeEventListener('keydown', handleGlobalKey, { capture: true });
  }, [isVisible, isMobile, inputStr, justCalculated, historyIndex, history, selectionMode, isCalcAwake]);

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

    e.preventDefault();
    isDragging.current = true;
    setIsCalcAwake(true);
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

    if (action === 'second') return setIsSecond(!isSecond);

    if (action === 'history-up') {
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
        handlePress('', 'clear');
        return;
      }

      if (selectionMode === 'expr') {
        setSelectionMode('res');
      } else {
        if (historyIndex === 0) {
          setHistoryIndex(-1);
          setSelectionMode('expr');
        } else {
          setHistoryIndex(historyIndex - 1);
          setSelectionMode('expr');
        }
      }
      return;
    }

    if (action === 'cursor-left' || action === 'cursor-right') {
      if (historyIndex !== -1) {
        setSelectionMode(prev => prev === 'expr' ? 'res' : 'expr');
        return;
      }
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
          setLastResult(null);
          setJustCalculated(false);
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

    if (action === 'sd') {
      const toggleValue = (valStr: string | null) => {
        if (!valStr || valStr === 'Syntax Error' || valStr === 'Error' || valStr === 'Unlocked') return valStr;

        if (valStr.includes('/')) {
          const parts = valStr.split('/');
          if (parts.length === 2) {
            const decimal = parseFloat(parts[0]) / parseFloat(parts[1]);
            return parseFloat(decimal.toPrecision(12)).toString();
          }
        } else {
          const num = parseFloat(valStr);
          if (!isNaN(num)) {
            const frac = dec2frac(num);
            if (frac) return frac;
          }
        }
        return valStr;
      };

      if (historyIndex !== -1) {
        const actualIndex = history.length - 1 - historyIndex;
        const item = history[actualIndex];
        if (item.isSecret) return;

        const newRes = toggleValue(item.res);
        if (newRes && newRes !== item.res) {
          const newHistory = [...history];
          newHistory[actualIndex] = { ...item, res: newRes };
          setHistory(newHistory);
        }
      }
      else {
        const newRes = toggleValue(lastResult);
        if (newRes && newRes !== lastResult) {
          setLastResult(newRes);
        }
      }
      return;
    }

    if (action === 'calculate') {
      if (historyIndex !== -1) {
        const entry = history[history.length - 1 - historyIndex];
        const copyText = selectionMode === 'res' ? entry.res : entry.expr;

        let newStr = '';

        if (justCalculated) {
          newStr = copyText;
        } else {
          newStr = currentInput + copyText;
        }

        setInputStr(newStr);
        setLastResult(null);
        setHistoryIndex(-1);
        setSelectionMode('expr');
        setJustCalculated(false);

        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.setSelectionRange(newStr.length, newStr.length);
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
        'Cameron': 'ᕙ(  •̀ ᗜ •́  )ᕗง',
        'William': '🤪✌︎︎',
        'Kyle': '(ง •̀_•́)ง',
        'Douglas': 'ඞ',
        'Manly': 'What inspires you?',
        'Vincent': 'STOP PLAYING 𝗥⟐𝗕𝗟◘𝗫',
        'Ella': '*ੈ✩‧₊˚༺𝓔𝓵𝓵𝒂༻*ੈ✩‧₊˚',
        'Steve': 'Hey, that\'s me!',
        'Mr Cheung': 'Also known as monkey, orangutan, transformers, EO, Mr. Li, I\'m starting to forget who I really am...',
        'Mr. Cheung': 'Americans and Canadians spell it this way. Which are you?',
        'Steve Cheung': 'Congratulations, you know who I am!',
        'Steven Cheung': 'I hate it when people call me that',
        'Ewan': 'Hey buddy.',
        'Anson': 'Man, always working hard!',
        'Théo': 'You actually typed the accent aigu LOL.',
      };

      if (secretMessages[currentInput]) {
        const msg = secretMessages[currentInput];
        setLastResult(msg);
        setJustCalculated(true);
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

        // Handle Nth roots
        expr = expr.replace(/(\d+\.?\d*)\s*ˣ√\s*(\d+\.?\d*|\([^)]+\))/g, '(($2)**(1/($1)))');

        // Normalize subtraction to JS standard minus
        expr = expr
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/−/g, '-');

        // Implicit Mult
        expr = expr
          .replace(/([0-9])([a-zA-Zπ\(])/g, '$1*$2')
          .replace(/(\))([0-9a-zA-Zπ\(])/g, '$1*$2')
          .replace(/(π)([0-9a-zA-Z\(])/g, '$1*$2');

        // --- NEW UNARY MINUS FIXES ---
        // 1. Wrap negative exponents to avoid precedence errors (2^-3 -> 2^(-3))
        expr = expr.replace(/\^\s*-\s*([a-zA-Z0-9_.]+|\([^)]+\))/g, '^(-$1)');

        // 2. Prevent JS SyntaxError for consecutive subtractions (9--2 -> 9 - -2)
        expr = expr.replace(/--/g, '- -');

        // 3. Prevent JS SyntaxError for Unary minus/plus before JS exponentiation
        // Maps e.g. -3^2 -> (0-1)*3^2  which cleanly evaluates to -9
        expr = expr.replace(/(^|[+\-*/(])\s*-/g, '$1(0-1)*');
        expr = expr.replace(/(^|[+\-*/(])\s*\+/g, '$1(0+1)*');
        // -----------------------------

        expr = expr
          .replace(/pi/gi, 'π')
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
          const sin = x => {
            let res = Math.sin(${isDeg} ? d(x) : x);
            return Math.abs(res) < 1e-15 ? 0 : res;
          };
          const cos = x => {
            let res = Math.cos(${isDeg} ? d(x) : x);
            return Math.abs(res) < 1e-15 ? 0 : res;
          };
          const tan = x => {
            const c = cos(x);
            if (c === 0) return Infinity; // Handle Tan 90/270/etc.
            return sin(x) / c;
          };
          const asin = x => ${isDeg} ? r(Math.asin(x)) : Math.asin(x);
          const acos = x => ${isDeg} ? r(Math.acos(x)) : Math.acos(x);
          const atan = x => ${isDeg} ? r(Math.atan(x)) : Math.atan(x);
          return ${expr};
        `);

        let result = evaluate();
        if (isNaN(result)) {
          setLastResult('Domain Error'); // e.g., ln(-1)
        } else if (!isFinite(result)) {
          // Check if the user actually typed a division by zero
          if (currentInput.includes('/0') || currentInput.includes('÷0')) {
            setLastResult('Divide by 0');
          } else {
            setLastResult('Overflow Error'); // e.g., 8^999
          }
        } else {
          const resStr = parseFloat(result.toPrecision(12)).toString();
          setHistory(prev => [...prev, { expr: currentInput, res: resStr }]);
          setLastResult(resStr);
        }
        setJustCalculated(true);
        setHistoryIndex(-1);

      } catch (err) {
        setLastResult('Syntax Error'); // Actual typos in expression
        setJustCalculated(true);
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
        const pos = inputRef.current.selectionStart ?? targetInput.length;
        if (pos < targetInput.length) {
          setInputStr(targetInput.slice(0, pos) + val + targetInput.slice(pos));
          setTimeout(() => inputRef.current?.setSelectionRange(pos + val.length, pos + val.length), 0);
        } else {
          setInputStr(targetInput + val);
        }
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
          border-radius: 1.5rem 1.5rem 2rem 2rem; padding: 1rem; width: 320px;
          user-select: none; opacity: 0; visibility: hidden; pointer-events: none;
          transform: translateY(20px) scale(0.95);
        }
        
        #wb-calculator.ti-30xb.open {
          visibility: visible; pointer-events: auto; transform: translateY(0) scale(1);
        }

        .calc-toggle-fab {
          position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9998; display: flex;
          align-items: center; justify-content: center; width: 50px; height: 50px; border-radius: 50%;
          /* Use Starlight background */
          background: var(--sl-color-bg-nav); 
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px); 
          /* Adapt border to light/dark mode */
          border: 1px solid var(--sl-color-gray-5); 
          /* Adapt icon stroke to light/dark mode (Black in light, White in dark) */
          color: var(--sl-color-text); 
          cursor: pointer; 
          box-shadow: var(--sl-shadow-md);
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.3s ease, box-shadow 0.3s ease;
        }
        
        .calc-toggle-fab:hover {
          transform: scale(1.15); background: #6fb048; 
          color: var(--sl-color-text-invert, #fff);
          box-shadow: var(--sl-shadow-lg);
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
        
        /* 🔥 HIDE ON MOBILE */
        @media (max-width: 768px) {
          .calc-toggle-fab {
            display: none !important;
          }
          #wb-calculator.ti-30xb {
            display: none !important;
          }
        }
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

      <div
        id="wb-calculator"
        className={`ti-30xb ${isVisible ? 'open' : ''}`}
        ref={calcRef}
        onMouseDown={(e) => {
          if (e.target !== inputRef.current) e.preventDefault();
        }}
        style={{
          border: isCalcAwake ? '2px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
          opacity: isCalcAwake ? 1 : 0.45,
          filter: isCalcAwake ? 'none' : 'grayscale(100%)',
          boxShadow: isCalcAwake
            ? '0 15px 40px rgba(0,0,0,0.6), 0 0 0 4px #4ade80, 0 0 20px rgba(74, 222, 128, 0.8)'
            : '0 15px 40px rgba(0,0,0,0.6), 0 0 20px rgba(111, 176, 72, 0.2)',
          transition: 'opacity 0.25s ease, filter 0.25s ease, box-shadow 0.25s ease, transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), visibility 0.25s'
        }}
      >

        <div id="calc-header" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} style={{ cursor: 'move', display: 'flex', justifyContent: 'center', marginBottom: '10px', color: 'rgba(255,255,255,0.9)', fontWeight: 'bold', letterSpacing: '1px' }}>
          <span>TI-30XB 𓃵</span>
        </div>

        <div id="calc-screen-wrapper">
          <div className="screen-header">
            <span>{isSecond ? '2ND' : ''}</span>
            <span onClick={() => setIsDeg(!isDeg)} style={{ cursor: 'pointer' }}>{isDeg ? 'DEG' : 'RAD'}</span>
          </div>
          <div className="screen-content">
            <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%', position: 'relative' }}>
              {historyIndex !== -1 && (
                <span className={`calc-history-expr ${isInputHighlighted ? 'highlight-side' : ''}`} style={{ width: '100%' }}>
                  {displayInput || ' '}
                </span>
              )}
              <input
                ref={inputRef}
                id="calc-input"
                type="text"
                value={displayInput}
                onChange={handleInputChange}
                autoComplete="off"
                spellCheck="false"
                readOnly={isTouch || historyIndex !== -1}
                style={{
                  ...(historyIndex !== -1 ? { opacity: 0, position: 'absolute', pointerEvents: 'none' } : {}),
                  caretColor: justCalculated ? 'transparent' : 'auto'
                }}
              />
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