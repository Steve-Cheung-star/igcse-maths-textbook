import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExamTimer() {
  const [seconds, setSeconds] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isAlarming, setIsAlarming] = useState(false);
  const [mounted, setMounted] = useState(false);

  const originalTitle = useRef(typeof document !== 'undefined' ? document.title : '');
  const audioCtx = useRef(null);

  useEffect(() => {
    setMounted(true);
    const savedEnd = localStorage.getItem('exam_timer_end');
    const savedTotal = localStorage.getItem('exam_timer_total');
    
    if (savedEnd) {
      const remaining = Math.floor((parseInt(savedEnd) - Date.now()) / 1000);
      if (remaining > 0) {
        setSeconds(remaining);
        setTotalTime(parseInt(savedTotal || remaining));
        setIsActive(true);
        setIsMinimized(false);
        setShowControls(false);
      } else {
        localStorage.removeItem('exam_timer_end');
      }
    }
  }, []);

  // We keep the title update so you can still check the tab if you REALLY need to, 
  // but it's removed from the UI to prevent constant staring.
  useEffect(() => {
    if (isActive && seconds > 0) {
      document.title = `(${Math.ceil(seconds/60)}m) ${originalTitle.current}`;
    } else {
      document.title = originalTitle.current;
    }
  }, [isActive, seconds]);

  const initAudio = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
  };

  const playSound = () => {
    try {
      initAudio();
      const ctx = audioCtx.current;
      const playNote = (delay) => {
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
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        const endTime = parseInt(localStorage.getItem('exam_timer_end'));
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setSeconds(remaining);
        if (remaining <= 0) {
          setIsActive(false);
          setIsAlarming(true);
          playSound();
          localStorage.removeItem('exam_timer_end');
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  if (!mounted) return null;

  const startTimer = (mins) => {
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

  const progressPercent = totalTime > 0 ? (seconds / totalTime) * 100 : 0;

  const getStatusColor = () => {
    if (isAlarming) return '#f97316'; 
    if (seconds > 0 && seconds <= 10) return '#ef4444'; 
    if (seconds > 0 && seconds <= 60) return '#eab308'; 
    return 'var(--sl-color-accent-high)'; 
  };

  return (
    <motion.div
      drag dragMomentum={false}
      className={`ghost-timer-wrapper ${isMinimized ? 'is-mini' : 'is-expanded'} ${isAlarming ? 'alarm-active' : ''}`}
      style={{ position: 'fixed', right: '20px', bottom: '20px', zIndex: 99999, touchAction: 'none' }}
    >
      <AnimatePresence mode="wait">
        {isMinimized ? (
          <motion.div 
            key="mini" 
            className="mini-icon-trigger"
            onTap={() => { setIsMinimized(false); setIsAlarming(false); initAudio(); }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="mini-txt" style={{color: getStatusColor()}}>
              {seconds > 0 ? `${Math.ceil(seconds/60)}m` : 
               isAlarming ? '!' : 
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:'1.5rem', height:'1.5rem'}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
            </div>
          </motion.div>
        ) : (
          <motion.div key="expanded" className="timer-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="timer-header-area">
               <button className="min-btn" onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}>—</button>
               <motion.div className="time-display-wrapper" onTap={() => { setShowControls(!showControls); setIsAlarming(false); }}>
                  <span className="big-time-text" style={{ color: getStatusColor() }}>
                    {isAlarming ? "TIME'S UP" : seconds > 0 ? "FOCUSING" : "READY"}
                  </span>
               </motion.div>
            </div>

            <AnimatePresence>
              {showControls && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0 }} className="controls-section">
                  <div className="grid-presets">
                    {[1, 5, 10, 20].map(m => ( <button key={m} onClick={() => startTimer(m)}>{m}m</button> ))}
                    <button onClick={() => startTimer(0.083)} style={{opacity: 0.3}}>5s</button>
                  </div>
                  <div className="action-btns">
                    <button className="add-1" onClick={addOneMinute}>+1m</button>
                    <button className="reset-clr" onClick={resetTimer}>Reset</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bottom-progress-container">
              <div className="tick t-25" /><div className="tick t-50" /><div className="tick t-75" />
              <motion.div 
                className="progress-fill" 
                style={{ backgroundColor: getStatusColor() }} 
                initial={false}
                animate={{ width: `${progressPercent}%` }} 
                transition={{ duration: 1, ease: "linear" }} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .ghost-timer-wrapper { 
            background: rgba(var(--sl-color-bg-rgb), 0.7); 
            backdrop-filter: blur(12px); 
            border: 1px solid var(--sl-color-gray-5); 
            font-family: var(--__sl-font), sans-serif; 
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            cursor: grab;
        }
        .ghost-timer-wrapper:active { cursor: grabbing; }

        .is-mini { width: 56px; height: 56px; border-radius: 28px; }
        .is-expanded { width: 220px; border-radius: 8px; }
        
        .mini-icon-trigger { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; }
        .mini-txt { font-weight: 800; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; line-height: 1; }
        
        .timer-header-area { position: relative; padding: 15px 10px 5px 10px; }
        .min-btn { position: absolute; top: 8px; right: 12px; background: none; border: none; color: var(--sl-color-gray-3); cursor: pointer; font-size: 1.2rem; z-index: 20; }
        .time-display-wrapper { cursor: pointer; padding: 10px 0; }
        .big-time-text { font-size: 1.2rem; font-weight: 800; letter-spacing: 0.1em; display: block; text-align: center; pointer-events: none; }
        
        .controls-section { padding: 5px 12px 15px 12px; display: flex; flex-direction: column; gap: 8px; }
        .grid-presets { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }
        .grid-presets button { background: var(--sl-color-gray-6); color: var(--sl-color-gray-2); border: 1px solid var(--sl-color-gray-5); padding: 8px 0; font-size: 0.7rem; cursor: pointer; border-radius: 4px; }
        
        .action-btns { display: flex; gap: 6px; }
        .action-btns button { flex: 1; padding: 10px; border: none; font-size: 0.85rem; font-weight: bold; cursor: pointer; border-radius: 4px; color: white; }
        .add-1 { background: var(--sl-color-accent-low) !important; color: var(--sl-color-accent-high) !important; border: 1px solid var(--sl-color-accent) !important; }
        .reset-clr { background: rgba(var(--sl-color-orange-rgb), 0.15) !important; color: var(--sl-color-orange) !important; border: 1px solid var(--sl-color-orange) !important; }
        
        .bottom-progress-container { height: 8px; background: rgba(var(--sl-color-gray-5-rgb), 0.2); width: 100%; position: relative; overflow: hidden; }
        .progress-fill { height: 100%; width: 0%; }
        .tick { position: absolute; top: 0; width: 1px; height: 100%; background: rgba(255,255,255,0.15); z-index: 1; }
        .t-25 { left: 25%; } .t-50 { left: 50%; } .t-75 { left: 75%; }

        .alarm-active { animation: pulse-all 1s infinite ease-in-out; }
        @keyframes pulse-all { 
            0% { border-color: var(--sl-color-orange); }
            50% { border-color: transparent; }
            100% { border-color: var(--sl-color-orange); }
        }
        
        @media (max-width: 768px) { .ghost-timer-wrapper { display: none; } }
      `}</style>
    </motion.div>
  );
}