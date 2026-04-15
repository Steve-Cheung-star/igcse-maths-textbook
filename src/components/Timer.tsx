import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // New visibility state
  
  const [isMinimized, setIsMinimized] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedMini = localStorage.getItem('exam_timer_mini');
      if (savedMini !== null) return savedMini === 'true';
    }
    return true;
  });

  const [showControls, setShowControls] = useState(true);
  const [isAlarming, setIsAlarming] = useState(false);
  
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false); 
  
  const [dragPos, setDragPos] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedPos = localStorage.getItem('exam_timer_pos');
      if (savedPos) {
        try { return JSON.parse(savedPos); } catch(e) {}
      }
    }
    return { x: 0, y: 0 };
  });

  const originalTitle = useRef(typeof document !== 'undefined' ? document.title : '');
  const audioCtx = useRef<AudioContext | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Keyboard Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Listens for Option + C (Mac) or Alt + C (Windows)
      // We use e.code === 'KeyC' to be layout-agnostic
      if (e.altKey && (e.code === 'KeyC' || e.key.toLowerCase() === 'c')) {
        e.preventDefault(); // Prevents typing characters in inputs
        setIsVisible(prev => !prev);
      }
      
      // Keep Alt + T as a secondary backup
      if (e.altKey && (e.code === 'KeyT' || e.key.toLowerCase() === 't')) {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }

      // Hide with Escape
      if (e.key === 'Escape') {
        setIsVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setMounted(true);
    
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile(); 
    window.addEventListener('resize', checkMobile); 

    const savedEnd = localStorage.getItem('exam_timer_end');
    const savedTotal = localStorage.getItem('exam_timer_total');
    
    if (savedEnd) {
      const remaining = Math.floor((parseInt(savedEnd) - Date.now()) / 1000);
      if (remaining > 0) {
        setSeconds(remaining);
        setTotalTime(parseInt(savedTotal || remaining.toString()));
        setIsActive(true);
        setIsVisible(true); // Automatically show if a timer is already running
        if (localStorage.getItem('exam_timer_mini') === null) setIsMinimized(false);
        setShowControls(false);
      } else {
        localStorage.removeItem('exam_timer_end');
      }
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!mounted || !wrapperRef.current) return;
    
    const rescueTimer = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const MARGIN = 50; 

      const isLost = 
        rect.top > window.innerHeight - MARGIN || 
        rect.bottom < MARGIN || 
        rect.left > window.innerWidth - MARGIN || 
        rect.right < MARGIN;

      if (isLost) {
        setDragPos({ x: 0, y: 0 }); 
        localStorage.removeItem('exam_timer_pos');
      }
    };

    const timeout = setTimeout(rescueTimer, 100);
    window.addEventListener('resize', rescueTimer);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', rescueTimer);
    };
  }, [mounted, isMinimized, isVisible]); 

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('exam_timer_mini', isMinimized.toString());
    }
  }, [isMinimized, mounted]);

  useEffect(() => {
    if (isActive && seconds > 0) {
      document.title = `(${Math.ceil(seconds/60)}m) ${originalTitle.current}`;
    } else {
      document.title = originalTitle.current;
    }
  }, [isActive, seconds]);

  const initAudio = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
  };

  const playSound = () => {
    try {
      initAudio();
      const ctx = audioCtx.current;
      if (!ctx) return;
      const playNote = (delay: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.5);
      };
      playNote(0); playNote(0.2);
    } catch (e) { console.error("Audio failed", e); }
  };

  useEffect(() => {
    if (isMobile) return; 

    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        const endTimeStr = localStorage.getItem('exam_timer_end');
        if (!endTimeStr) return;
        
        const endTime = parseInt(endTimeStr);
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        
        setSeconds(remaining);
        if (remaining <= 0) {
          setIsActive(false);
          setIsAlarming(true);
          playSound();
          localStorage.removeItem('exam_timer_end');
          if (interval) clearInterval(interval);
        }
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, isMobile]);

  // Don't render if not visible
  if (!mounted || isMobile || !isVisible) return null;

  const startTimer = (mins: number) => {
    initAudio();
    setIsAlarming(false);
    const s = Math.round(mins * 60);
    const endTime = Date.now() + s * 1000;
    localStorage.setItem('exam_timer_end', endTime.toString());
    localStorage.setItem('exam_timer_total', s.toString());
    setSeconds(s);
    setTotalTime(s);
    setIsActive(true);
    setShowControls(false);
  };

  const addOneMinute = () => {
    const newSeconds = seconds + 60;
    const newTotal = totalTime + 60;
    const newEnd = Date.now() + (newSeconds * 1000);
    setSeconds(newSeconds);
    setTotalTime(newTotal);
    localStorage.setItem('exam_timer_end', newEnd.toString());
    localStorage.setItem('exam_timer_total', newTotal.toString());
    setIsAlarming(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsAlarming(false);
    setSeconds(0);
    setTotalTime(0);
    localStorage.removeItem('exam_timer_end');
    localStorage.removeItem('exam_timer_total');
  };

  const handleDragEnd = (_e: any, info: any) => {
    let targetX = dragPos.x + info.offset.x;
    let targetY = dragPos.y + info.offset.y;

    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const MARGIN = 20;

      const overflowTop = MARGIN - rect.top;
      const overflowBottom = rect.bottom - (window.innerHeight - MARGIN);
      const overflowLeft = MARGIN - rect.left;
      const overflowRight = rect.right - (window.innerWidth - MARGIN);

      if (overflowTop > 0) targetY += overflowTop;
      else if (overflowBottom > 0) targetY -= overflowBottom;

      if (overflowLeft > 0) targetX += overflowLeft;
      else if (overflowRight > 0) targetX -= overflowRight;
    }

    const newPos = { x: targetX, y: targetY };
    setDragPos(newPos);
    localStorage.setItem('exam_timer_pos', JSON.stringify(newPos));
  };

  const toggleSize = (minimize: boolean) => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const MARGIN = 20;
      let targetX = dragPos.x;
      let targetY = dragPos.y;

      if (!minimize) {
        const predictedBottom = rect.top + 200; 
        const predictedLeft = rect.left - 172; 
        
        if (predictedBottom > window.innerHeight - MARGIN) {
          targetY -= (predictedBottom - (window.innerHeight - MARGIN));
        }
        if (predictedLeft < MARGIN) {
          targetX += (MARGIN - predictedLeft);
        }
      }

      if (targetX !== dragPos.x || targetY !== dragPos.y) {
        setDragPos({ x: targetX, y: targetY });
      }
    }

    setIsMinimized(minimize);
    if (!minimize) {
      setIsAlarming(false);
      initAudio();
    }
  };

  const progressPercent = totalTime > 0 ? (seconds / totalTime) * 100 : 0;

  const getStatusColor = () => {
    if (isAlarming) return '#ff4444'; 
    if (seconds > 0 && seconds <= 10) return '#ff4444'; 
    if (seconds > 0 && seconds <= 60) return '#ffcc00'; 
    return '#00ffff'; 
  };

  const radius = 19; 
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = totalTime > 0 ? circumference - (seconds / totalTime) * circumference : 0;

  return (
    <>
      <motion.div
        ref={wrapperRef}
        layout 
        drag 
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        initial={{ x: dragPos.x, y: dragPos.y }} 
        animate={{ x: dragPos.x, y: dragPos.y }}
        className={`ghost-timer-wrapper ${isMinimized ? 'is-mini' : 'is-expanded'} ${isAlarming ? 'alarm-active' : ''}`}
        style={{ 
          position: 'fixed', 
          right: 'calc(2rem + 48px + 1rem)', 
          top: '2rem', 
          zIndex: 99999, 
          touchAction: 'none' 
        }}
      >
        <AnimatePresence mode="wait">
          {isMinimized ? (
            <motion.div 
              key="mini" 
              className="mini-icon-trigger"
              onTap={(e) => { e.stopPropagation(); toggleSize(false); }}
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
            >
              {isActive || seconds > 0 ? (
                <div className="mini-running-state">
                  <svg className="mini-ring" viewBox="0 0 48 48" width="48" height="48">
                    <circle cx="24" cy="24" r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none" />
                    <circle 
                      cx="24" cy="24" r={radius} 
                      stroke={getStatusColor()} 
                      strokeWidth="3" fill="none" 
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    />
                  </svg>
                  <span className="mini-txt" style={{ color: getStatusColor() }}>
                    {Math.ceil(seconds/60)}m
                  </span>
                </div>
              ) : (
                <div className="mini-txt" style={{ color: isAlarming ? '#ff4444' : '#888' }}>
                  {isAlarming ? '!' : 
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:'1.5rem', height:'1.5rem'}}>
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  }
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="expanded" 
              className="timer-panel" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1, transition: { delay: 0.1 } }} 
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              <div className="timer-header-area">
                 {/* Close Button */}
                 <button 
                   onClick={() => setIsVisible(false)}
                   style={{ position: 'absolute', top: 10, left: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
                 >
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                 </button>

                 <motion.button className="min-btn" onTap={(e) => { e.stopPropagation(); toggleSize(true); }}>
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                 </motion.button>
                 
                 <motion.div className="time-display-wrapper" onTap={() => { setShowControls(!showControls); setIsAlarming(false); }}>
                    <span className="big-time-text" style={{ color: getStatusColor(), textShadow: `0 0 12px ${getStatusColor()}40` }}>
                      {isAlarming ? "TIME'S UP" : seconds > 0 ? "FOCUSING" : "READY"}
                    </span>
                 </motion.div>
              </div>

              <AnimatePresence>
                {showControls && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="controls-section">
                    <div className="grid-presets">
                      {[1, 5, 10, 25, 45].map(m => ( 
                        <button key={m} className="preset-btn" onClick={() => startTimer(m)}>{m}m</button> 
                      ))}
                    </div>
                    <div className="action-btns">
                      <button className="add-1" onClick={addOneMinute}>+1 min</button>
                      <button className="reset-clr" onClick={resetTimer}>Reset</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bottom-progress-container">
                <div className="tick t-25" /><div className="tick t-50" /><div className="tick t-75" />
                <motion.div 
                  className="progress-fill" 
                  style={{ backgroundColor: getStatusColor(), boxShadow: `0 0 10px ${getStatusColor()}` }} 
                  initial={false}
                  animate={{ width: `${progressPercent}%` }} 
                  transition={{ duration: 1, ease: "linear" }} 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        .ghost-timer-wrapper { 
            background: rgba(20, 20, 20, 0.85); 
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            font-family: system-ui, sans-serif; 
            overflow: hidden;
            cursor: grab;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            box-sizing: border-box; 
        }
        .ghost-timer-wrapper:active { cursor: grabbing; }

        .is-mini { width: 48px; height: 48px; border-radius: 50%; }
        .is-expanded { width: 220px; border-radius: 16px; }
        
        .mini-icon-trigger { width: 48px; height: 48px; display: block; position: relative; cursor: pointer; }
        
        .mini-txt { 
            font-weight: 800; 
            font-size: 0.85rem; 
            position: absolute; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%); 
            z-index: 2; 
            transition: color 0.2s; 
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
        }
        
        .mini-running-state { display: block; width: 100%; height: 100%; position: relative; pointer-events: none;}
        
        .mini-ring { 
            position: absolute; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%); 
            z-index: 1; 
            filter: drop-shadow(0 0 4px rgba(0, 255, 255, 0.3)); 
            display: block;
        }

        .timer-header-area { position: relative; padding: 20px 10px 10px 10px; }
        .min-btn { position: absolute; top: 10px; right: 12px; background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; display: flex; transition: color 0.2s; }
        .min-btn:hover { color: white; }
        
        .time-display-wrapper { cursor: pointer; padding: 10px 0; transition: transform 0.1s; }
        .time-display-wrapper:active { transform: scale(0.97); }
        .big-time-text { font-size: 1.3rem; font-weight: 900; letter-spacing: 0.15em; display: block; text-align: center; pointer-events: none; }
        
        .controls-section { padding: 5px 15px 20px 15px; display: flex; flex-direction: column; gap: 10px; }
        .grid-presets { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
        .preset-btn { 
          background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); 
          border: 1px solid rgba(255,255,255,0.1); padding: 8px 0; 
          font-size: 0.75rem; font-weight: 600; cursor: pointer; 
          border-radius: 6px; transition: all 0.2s ease; 
        }
        .preset-btn:hover { background: rgba(255,255,255,0.15); color: white; transform: translateY(-1px); }
        
        .action-btns { display: flex; gap: 8px; }
        .action-btns button { flex: 1; padding: 10px; font-size: 0.85rem; font-weight: bold; cursor: pointer; border-radius: 6px; transition: all 0.2s; }
        .add-1 { background: rgba(0, 255, 255, 0.1); color: #00ffff; border: 1px solid rgba(0, 255, 255, 0.3); }
        .add-1:hover { background: rgba(0, 255, 255, 0.2); }
        .reset-clr { background: rgba(255, 68, 68, 0.1); color: #ff4444; border: 1px solid rgba(255, 68, 68, 0.3); }
        .reset-clr:hover { background: rgba(255, 68, 68, 0.2); }
        
        .bottom-progress-container { height: 6px; background: rgba(255,255,255,0.05); width: 100%; position: relative; overflow: hidden; border-radius: 4px; }
        .progress-fill { height: 100%; width: 0%; border-radius: 0 4px 4px 0; }
        .tick { position: absolute; top: 0; width: 2px; height: 100%; background: rgba(0,0,0,0.3); z-index: 1; }
        .t-25 { left: 25%; } .t-50 { left: 50%; } .t-75 { left: 75%; }

        .alarm-active .mini-txt, .alarm-active .big-time-text { animation: blink-danger 1s infinite ease-in-out; }
        @keyframes blink-danger { 
            0%, 100% { opacity: 1; text-shadow: 0 0 10px #ff4444; }
            50% { opacity: 0.5; text-shadow: none; }
        }
      `}</style>
    </>
  );
}