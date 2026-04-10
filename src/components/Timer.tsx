import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  
  const [isMinimized, setIsMinimized] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isAlarming, setIsAlarming] = useState(false);
  
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false); 
  
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });

  const originalTitle = useRef(typeof document !== 'undefined' ? document.title : '');
  const audioCtx = useRef<AudioContext | null>(null);
  
  // Ref for the physical element to check its screen coordinates
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile(); 
    window.addEventListener('resize', checkMobile); 

    const savedEnd = localStorage.getItem('exam_timer_end');
    const savedTotal = localStorage.getItem('exam_timer_total');
    const savedMini = localStorage.getItem('exam_timer_mini');
    const savedPos = localStorage.getItem('exam_timer_pos');

    if (savedMini !== null) setIsMinimized(savedMini === 'true');
    
    if (savedPos) {
      try { setDragPos(JSON.parse(savedPos)); } catch(e) {}
    }
    
    if (savedEnd) {
      const remaining = Math.floor((parseInt(savedEnd) - Date.now()) / 1000);
      if (remaining > 0) {
        setSeconds(remaining);
        setTotalTime(parseInt(savedTotal || remaining.toString()));
        setIsActive(true);
        if (savedMini === null) setIsMinimized(false);
        setShowControls(false);
      } else {
        localStorage.removeItem('exam_timer_end');
      }
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  if (!mounted || isMobile) return null;

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
    const newPos = { 
      x: dragPos.x + info.offset.x, 
      y: dragPos.y + info.offset.y 
    };
    setDragPos(newPos);
    localStorage.setItem('exam_timer_pos', JSON.stringify(newPos));
  };

  // SMART EXPAND: Ensure component doesn't clip out of the top/left of the screen
  const handleExpand = () => {
    setIsMinimized(false);
    setIsAlarming(false);
    initAudio();

    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      
      // Calculate how far up and left the panel will grow
      // Width grows 56px -> 220px (delta 164)
      // Height grows ~56px -> ~210px (delta ~154)
      const expectedTop = rect.top - 160; 
      const expectedLeft = rect.left - 170;

      let newX = dragPos.x;
      let newY = dragPos.y;

      // If it will clip, push it exactly 20px away from the screen edge
      if (expectedTop < 20) newY += (20 - expectedTop);
      if (expectedLeft < 20) newX += (20 - expectedLeft);

      // If an adjustment was made, smoothly update position
      if (newX !== dragPos.x || newY !== dragPos.y) {
        const newPos = { x: newX, y: newY };
        setDragPos(newPos);
        localStorage.setItem('exam_timer_pos', JSON.stringify(newPos));
      }
    }
  };

  const progressPercent = totalTime > 0 ? (seconds / totalTime) * 100 : 0;

  const getStatusColor = () => {
    if (isAlarming) return '#ff4444'; 
    if (seconds > 0 && seconds <= 10) return '#ff4444'; 
    if (seconds > 0 && seconds <= 60) return '#ffcc00'; 
    return '#00ffff'; 
  };

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = totalTime > 0 ? circumference - (seconds / totalTime) * circumference : 0;

  return (
    <>
      <motion.div
        ref={wrapperRef}
        drag 
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        animate={{ x: dragPos.x, y: dragPos.y }}
        className={`ghost-timer-wrapper ${isMinimized ? 'is-mini' : 'is-expanded'} ${isAlarming ? 'alarm-active' : ''}`}
        style={{ 
          position: 'fixed', 
          right: 'calc(2rem + 56px + 1rem)', 
          bottom: '2rem', 
          zIndex: 99999, 
          touchAction: 'none' 
        }}
      >
        <AnimatePresence mode="wait">
          {isMinimized ? (
            <motion.div 
              key="mini" 
              className="mini-icon-trigger"
              onTap={handleExpand}
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {isActive || seconds > 0 ? (
                <div className="mini-running-state">
                  <svg className="mini-ring" width="56" height="56">
                    <circle cx="28" cy="28" r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none" />
                    <circle 
                      cx="28" cy="28" r={radius} 
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:'1.6rem', height:'1.6rem'}}>
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  }
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="expanded" className="timer-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="timer-header-area">
                 <button className="min-btn" onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}>
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                 </button>
                 <motion.div className="time-display-wrapper" onTap={() => { setShowControls(!showControls); setIsAlarming(false); }}>
                    <span className="big-time-text" style={{ color: getStatusColor(), textShadow: `0 0 12px ${getStatusColor()}40` }}>
                      {isAlarming ? "TIME'S UP" : seconds > 0 ? "FOCUSING" : "READY"}
                    </span>
                 </motion.div>
              </div>

              <AnimatePresence>
                {showControls && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0 }} className="controls-section">
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
            background: transparent; 
            font-family: var(--__sl-font), system-ui, sans-serif; 
            overflow: hidden;
            cursor: grab;
        }
        .ghost-timer-wrapper:active { cursor: grabbing; }

        .is-mini { width: 56px; height: 56px; border-radius: 50%; }
        .is-expanded { width: 220px; border-radius: 16px; }
        
        .mini-icon-trigger { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; position: relative; }
        .mini-txt { font-weight: 800; font-size: 0.9rem; position: absolute; z-index: 2; transition: color 0.2s; }
        .mini-icon-trigger:hover .mini-txt { color: white !important; } 
        
        .mini-running-state { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; position: relative; }
        .mini-ring { position: absolute; top: 0; left: 0; z-index: 1; filter: drop-shadow(0 0 4px rgba(0, 255, 255, 0.3)); }

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