import React, { useState, useEffect } from 'react';

// === LOOTLOCKER CONFIGURATION ===
// ⚠️ Replace these with your actual LootLocker details!
const LL_GAME_KEY = 'dev_4cc563c215814b8fbad45fba55b38701'; 
const LL_LEADERBOARD_ID = '34069';

// === GEOMETRY ENGINE: QUADRILATERALS ===
const QUADRILATERALS = [
  { 
    name: 'Square', 
    riddles: [
      "I have 4 equal sides and 4 right angles. Who am I?",
      "I am a regular quadrilateral. Who am I?",
      "I have the properties of both a rectangle and a rhombus. Who am I?"
    ], 
    path: "M 60 60 L 240 60 L 240 240 L 60 240 Z" 
  },
  { 
    name: 'Rectangle', 
    riddles: [
      "I have 4 right angles, but my adjacent sides aren't always equal. Who am I?",
      "My opposite sides are parallel and equal, and all my angles are 90 degrees. Who am I?"
    ], 
    path: "M 30 90 L 270 90 L 270 210 L 30 210 Z" 
  },
  { 
    name: 'Rhombus', 
    riddles: [
      "I have 4 equal sides but no right angles. Who am I?",
      "My diagonals cross at 90 degrees and all my sides are equal, but I'm not a square. Who am I?"
    ], 
    path: "M 150 20 L 260 150 L 150 280 L 40 150 Z" 
  },
  { 
    name: 'Parallelogram', 
    riddles: [
      "I have two pairs of parallel sides but no right angles. Who am I?",
      "My opposite sides are parallel and equal, but I am slanted. Who am I?"
    ], 
    path: "M 90 90 L 280 90 L 210 210 L 20 210 Z" 
  },
  { 
    name: 'Trapezium', 
    riddles: [
      "I have exactly one pair of parallel sides. Who am I?",
      "I look like a triangle with its top cut off. Who am I?"
    ], 
    path: "M 100 80 L 200 80 L 270 220 L 30 220 Z" 
  },
  { 
    name: 'Kite', 
    riddles: [
      "I have two pairs of adjacent equal sides, but no parallel sides. Who am I?",
      "My diagonals cross at 90 degrees, but only one is cut perfectly in half. Who am I?"
    ], 
    path: "M 150 20 L 230 100 L 150 280 L 70 100 Z" 
  }
];

const SHAPE_COLORS = [
  '#f43f5e', '#a855f7', '#10b981', '#f59e0b', '#0ea5e9', '#ec4899', '#8b5cf6'
];

const shuffle = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function QuadRoyale() {
  const [gameState, setGameState] = useState('start'); 
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(3);
  const [question, setQuestion] = useState(null);
  
  const [animState, setAnimState] = useState('hidden'); 
  const [feedback, setFeedback] = useState(null); 
  const [selectedOpt, setSelectedOpt] = useState(null);
  
  const [timeLeft, setTimeLeft] = useState(100);
  const [timerSpeed, setTimerSpeed] = useState(0.4);

  // === LOOTLOCKER STATE ===
  const [sessionToken, setSessionToken] = useState(null);
  const [playerID, setPlayerID] = useState(null); 
  const [initials, setInitials] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [topScores, setTopScores] = useState([]);

  useEffect(() => {
    fetch('https://api.lootlocker.io/game/v2/session/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_key: LL_GAME_KEY, game_version: "1.0.0" })
    })
    .then(res => res.json())
    .then(data => {
      setSessionToken(data.session_token);
      setPlayerID(data.player_identifier); 
    })
    .catch(err => console.error("LootLocker Auth Error:", err));
  }, []);

  useEffect(() => {
    if (gameState !== 'playing' || animState !== 'idle' || feedback) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) { handleGuess(null); return 0; }
        return prev - timerSpeed;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [gameState, animState, feedback, timerSpeed]);

  const loadNextShape = () => {
    setAnimState('hidden');
    setFeedback(null);
    setSelectedOpt(null);
    setTimeLeft(100);
    setTimerSpeed(0.4 + Math.floor(score / 300) * 0.1);

    setTimeout(() => {
      const targetQuad = QUADRILATERALS[Math.floor(Math.random() * QUADRILATERALS.length)];
      const riddle = targetQuad.riddles[Math.floor(Math.random() * targetQuad.riddles.length)];
      
      const allNames = QUADRILATERALS.map(q => q.name);
      const distractors = shuffle(allNames.filter(n => n !== targetQuad.name)).slice(0, 3);
      const options = shuffle([targetQuad.name, ...distractors]);
      
      // Randomly choose between a text riddle OR visually identifying the shape
      const gameMode = Math.random() > 0.5 ? 'riddle' : 'visual';
      
      setQuestion({
        correctAnswer: targetQuad.name,
        riddle: riddle,
        mode: gameMode,
        path: targetQuad.path,
        options: options,
        color: SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)]
      });

      setAnimState('entering');
      setTimeout(() => setAnimState('idle'), 400); 
    }, 100);
  };

  const startGame = () => {
    setScore(0);
    setHealth(3);
    setTimerSpeed(0.4);
    setScoreSubmitted(false);
    setInitials('');
    setGameState('playing');
    loadNextShape();
  };

  const handleGuess = (guess) => {
    if (animState !== 'idle' || feedback) return;

    setSelectedOpt(guess);
    const isCorrect = guess === question?.correctAnswer;

    if (isCorrect) {
      setFeedback('correct');
      setScore(s => s + 100);
    } else {
      setFeedback('wrong');
      setHealth(h => Math.max(0, h - 1));
    }

    setTimeout(() => {
      setAnimState('exiting');
      setTimeout(() => {
        if (health <= 1 && !isCorrect) {
          setGameState('gameover');
        } else {
          loadNextShape();
        }
      }, 400); 
    }, 1500); 
  };

  const submitHighScore = async () => {
    if (!sessionToken || !initials || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await fetch('https://api.lootlocker.io/game/player/name', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-session-token': sessionToken },
        body: JSON.stringify({ name: initials })
      });

      const submitRes = await fetch(`https://api.lootlocker.io/game/leaderboards/${LL_LEADERBOARD_ID}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-token': sessionToken },
        body: JSON.stringify({ score: score, member_id: playerID }) 
      });

      const submitData = await submitRes.json();
      
      if (!submitRes.ok || submitData.error) {
        console.error("LootLocker API Error:", submitData);
        alert(`API Error: ${submitData.error || 'Check console'}`);
        setIsSubmitting(false);
        return; 
      }

      const boardRes = await fetch(`https://api.lootlocker.io/game/leaderboards/${LL_LEADERBOARD_ID}/list?count=5`, {
        headers: { 'x-session-token': sessionToken }
      });
      const boardData = await boardRes.json();
      setTopScores(boardData.items || []);
      
      setScoreSubmitted(true);
    } catch (err) {
      console.error("Score Submit Network Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getShapeStyle = () => {
    let base = { transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease' };
    if (animState === 'hidden') return { ...base, transform: 'scale(0)', opacity: 0 };
    if (animState === 'entering') return { ...base, transform: 'scale(1)', opacity: 1 };
    if (animState === 'idle') return { animation: 'bounceShape 2.5s ease-in-out infinite', opacity: 1, transform: 'scale(1)' };
    if (animState === 'exiting') return { transform: 'scale(0)', opacity: 0, transition: 'transform 0.4s ease-in, opacity 0.3s ease-in' };
    return {};
  };

  return (
    <div className="font-black tracking-wide flex flex-col select-none relative rounded-3xl" 
         style={{ 
           backgroundColor: '#0f172a', 
           border: '4px solid #1e293b', 
           color: '#ffffff', 
           width: '100%', 
           boxSizing: 'border-box', 
           padding: '1.5rem', 
           paddingBottom: '2rem',
           margin: '0 auto',
           overflow: 'visible' 
         }}>
      
      <style>
        {`
          @keyframes bounceShape {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-10px) scale(1); }
          }
          @keyframes pulseMystery { 
            0%, 100% { transform: scale(1); opacity: 0.8; } 
            50% { transform: scale(1.05); opacity: 1; } 
          }
          .custom-starfield {
            background-image: 
              radial-gradient(2px 2px at 20px 30px, #ffffff, rgba(0,0,0,0)),
              radial-gradient(2px 2px at 40px 70px, #ffffff, rgba(0,0,0,0)),
              radial-gradient(2px 2px at 50px 160px, #ffffff, rgba(0,0,0,0));
            background-repeat: repeat;
            background-size: 200px 200px;
          }
          .arcade-input::placeholder {
            color: #475569;
          }
        `}
      </style>

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '1.25rem', overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
        <div className="absolute inset-0 opacity-20 custom-starfield"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full" style={{ flex: 1 }}>

        {/* HEADER BAR */}
        <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '2px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderRadius: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#38bdf8', textShadow: '0 0 10px rgba(56, 189, 248, 0.8)', fontSize: '1.875rem' }}>
            <span>⭐</span>
            <span style={{ marginTop: '4px' }}>SCORE: {score}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: '8px', alignItems: 'center' }}>
            {[...Array(health)].map((_, i) => <div key={`full-${i}`} style={{ fontSize: '2.25rem', textShadow: '0 0 10px rgba(244,63,94,0.8)' }}>❤️</div>)}
            {[...Array(3 - health)].map((_, i) => <div key={`empty-${i}`} style={{ fontSize: '2.25rem', opacity: 0.3, filter: 'grayscale(100%)' }}>🖤</div>)}
          </div>
        </div>

        {/* START SCREEN */}
        {gameState === 'start' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem', padding: '2rem 0' }}>
            <div style={{ transform: 'rotate(-3deg)', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <h1 style={{ color: '#ffffff', textShadow: '0 4px 0 #0f172a', margin: 0, fontSize: 'clamp(3rem, 10vw, 5rem)', lineHeight: 1.1 }}>QUAD</h1>
              <h1 style={{ color: '#8b5cf6', textShadow: '0 6px 0 #4c1d95', margin: 0, fontSize: 'clamp(3.5rem, 12vw, 6rem)', lineHeight: 1.1 }}>ROYALE! MR CHEUNG MADE THIS</h1>
            </div>
            <p style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '2px solid #1e293b', color: '#e2e8f0', margin: '0 auto', padding: '1.5rem', borderRadius: '1.5rem', fontSize: 'clamp(1rem, 4vw, 1.25rem)', maxWidth: '90%', textAlign: 'center' }}>
              Read the riddle or look at the shape, and guess the quadrilateral before the timer runs out!
            </p>
            <button 
              onClick={startGame}
              style={{ border: 'none', backgroundColor: '#10b981', borderBottom: '8px solid #047857', color: '#ffffff', cursor: 'pointer', padding: '1.25rem 3rem', fontSize: '2rem', borderRadius: '1.5rem', textTransform: 'uppercase' }}
            >
              START GAME!
            </button>
          </div>
        )}

        {/* PLAYING SCREEN */}
        {gameState === 'playing' && question && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            
            {/* TIMER */}
            <div style={{ backgroundColor: '#1e293b', border: '4px solid #0f172a', width: '100%', maxWidth: '768px', margin: '0 auto 1rem auto', height: '1.5rem', borderRadius: '9999px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', width: `${timeLeft}%`, 
                  backgroundColor: timeLeft > 30 ? '#38bdf8' : '#f43f5e',
                  boxShadow: timeLeft > 30 ? '0 0 15px rgba(56,189,248,0.8)' : '0 0 15px rgba(244,63,94,0.8)',
                  transition: 'width 75ms linear'
                }}
              ></div>
            </div>

            {/* RIDDLE BOX (FIXED HEIGHT TO PREVENT BOUNCING) */}
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '2px solid #8b5cf6', borderRadius: '1rem', padding: '0 1.25rem', maxWidth: '768px', margin: '0 auto 0.75rem auto', width: '100%', height: '85px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', boxSizing: 'border-box', zIndex: 20 }}>
              <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', margin: 0, fontStyle: 'italic', fontWeight: 600, lineHeight: 1.3 }}>
                {question.mode === 'riddle' ? `"${question.riddle}"` : "Identify this quadrilateral:"}
              </h2>
            </div>

            {/* MYSTERY SHAPE AREA */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative', minHeight: '220px', marginBottom: '1rem' }}>
              <div style={{ ...getShapeStyle(), position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '220px', height: '220px' }}>
                
                {question.mode === 'riddle' && feedback === null ? (
                  // The Mystery Pulse (Only for Riddles)
                  <div style={{ animation: 'pulseMystery 2s infinite', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '140px', height: '140px', borderRadius: '50%', border: '4px dashed #475569', backgroundColor: '#1e293b' }}>
                    <span style={{ fontSize: '5rem', color: '#64748b', fontWeight: 900 }}>?</span>
                  </div>
                ) : (
                  // The Revealed Shape (Or immediately visible if in 'Visual' mode)
                  <svg viewBox="0 0 300 300" style={{ width: '100%', height: '100%', overflow: 'visible', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))' }}>
                    <path 
                      d={question.path} 
                      fill={question.color} 
                      stroke="#ffffff" 
                      strokeWidth="8" 
                      strokeLinejoin="round" 
                    />
                  </svg>
                )}
              </div>

              {/* BOOM / OOF EFFECTS */}
              {feedback === 'correct' && (
                <div style={{ position: 'absolute', top: '10%', right: '15%', transform: 'rotate(15deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100px', height: '100px', pointerEvents: 'none', zIndex: 50 }}>
                  <svg viewBox="0 0 200 200" style={{ position: 'absolute', width: '100%', height: '100%' }}>
                    <path d="M100 10 L120 70 L180 50 L140 90 L190 140 L130 130 L100 190 L70 130 L10 140 L60 90 L20 50 L80 70 Z" fill="#facc15" stroke="#ea580c" strokeWidth="6" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ position: 'relative', zIndex: 10, fontSize: '1.5rem', fontStyle: 'italic', fontWeight: 900, color: '#ffffff', textShadow: '0 3px 0 #ea580c' }}>BOOM!</span>
                </div>
              )}
              {feedback === 'wrong' && (
                <div style={{ position: 'absolute', top: '10%', right: '15%', transform: 'rotate(-15deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100px', height: '100px', pointerEvents: 'none', zIndex: 50 }}>
                  <svg viewBox="0 0 200 200" style={{ position: 'absolute', width: '100%', height: '100%' }}>
                     <path d="M100 20 C140 -10, 180 30, 160 70 C200 90, 180 150, 140 140 C120 180, 80 180, 60 140 C20 150, 0 90, 40 70 C20 30, 60 -10, 100 20 Z" fill="#7c3aed" stroke="#f43f5e" strokeWidth="6" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ position: 'relative', zIndex: 10, fontSize: '1.75rem', fontStyle: 'italic', fontWeight: 900, color: '#ffffff', textShadow: '0 3px 0 #000000' }}>OOF!</span>
                </div>
              )}
            </div>

            {/* MULTIPLE CHOICE GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', maxWidth: '768px', margin: '0 auto', marginBottom: '16px' }}>
              {question.options.map((opt, idx) => {
                let bgHex = '#1e293b', borderHex = '#0f172a', textHex = '#ffffff';
                let customStyle = { border: 'none', borderBottom: `8px solid ${borderHex}`, boxShadow: 'none' };

                if (selectedOpt === opt) {
                  if (feedback === 'correct') { bgHex = '#10b981'; borderHex = '#047857'; customStyle = { border: 'none', borderBottom: '0px', transform: 'translateY(8px)', boxShadow: 'none' }; }
                  if (feedback === 'wrong') { bgHex = '#e11d48'; borderHex = '#9f1239'; customStyle = { border: 'none', borderBottom: '0px', transform: 'translateY(8px)', boxShadow: 'none' }; }
                } else if (feedback && opt === question.correctAnswer) {
                  bgHex = '#10b981'; borderHex = '#047857'; 
                } else if (feedback) {
                  bgHex = '#0f172a'; textHex = '#64748b'; customStyle = { border: 'none', borderBottom: `4px solid ${borderHex}`, opacity: 0.5, boxShadow: 'none' };
                }

                return (
                  <button key={idx} onClick={() => handleGuess(opt)} disabled={animState !== 'idle' || feedback !== null} style={{ ...customStyle, backgroundColor: bgHex, color: textHex, cursor: 'pointer', minHeight: '72px', padding: '0.75rem', borderRadius: '1.25rem', fontSize: 'clamp(1rem, 3vw, 1.25rem)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', outline: 'none' }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* GAME OVER & LEADERBOARD SCREEN */}
        {gameState === 'gameover' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, zIndex: 10, gap: '1.5rem', padding: '1rem 0' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 8vw, 3rem)', transform: 'rotate(-2deg)', color: '#f43f5e', textShadow: '0 4px 0 #9f1239', margin: 0, textAlign: 'center' }}>
              GAME OVER!
            </h2>
            
            <div style={{ display: 'flex', gap: '1.5rem', width: '100%', maxWidth: '768px', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              
              <div style={{ flex: '1 1 300px', backgroundColor: '#1e293b', border: '4px solid #334155', padding: '1.5rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <p style={{ fontSize: '1rem', letterSpacing: '0.1em', color: '#94a3b8', margin: 0 }}>YOUR SCORE</p>
                <p style={{ fontSize: '3rem', color: '#facc15', textShadow: '0 0 15px rgba(250,204,21,0.5)', margin: 0 }}>{score}</p>
                
                {!scoreSubmitted ? (
                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '1rem' }}>
                    <input 
                      type="text" 
                      maxLength="3" 
                      placeholder="AAA"
                      value={initials}
                      onChange={(e) => setInitials(e.target.value.toUpperCase())}
                      disabled={isSubmitting}
                      className="arcade-input"
                      style={{ flex: 1, backgroundColor: '#0f172a', border: '2px solid #475569', borderRadius: '0.75rem', color: '#fff', fontSize: '1.5rem', textAlign: 'center', textTransform: 'uppercase', padding: '0.5rem', outline: 'none' }}
                    />
                    <button 
                      onClick={submitHighScore}
                      disabled={isSubmitting || initials.length < 1}
                      style={{ border: 'none', backgroundColor: '#0ea5e9', borderBottom: '4px solid #0369a1', color: '#ffffff', cursor: (isSubmitting || initials.length < 1) ? 'not-allowed' : 'pointer', padding: '0.75rem 1.5rem', fontSize: '1.25rem', borderRadius: '0.75rem', textTransform: 'uppercase', opacity: (isSubmitting || initials.length < 1) ? 0.5 : 1 }}
                    >
                      {isSubmitting ? '...' : 'SAVE'}
                    </button>
                  </div>
                ) : (
                  <p style={{ color: '#10b981', fontSize: '1.25rem', margin: '1rem 0 0 0' }}>SCORE SAVED!</p>
                )}
              </div>

              {scoreSubmitted && (
                <div style={{ flex: '1 1 300px', backgroundColor: '#0f172a', border: '4px solid #38bdf8', padding: '1.5rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ color: '#38bdf8', margin: '0 0 1rem 0', fontSize: '1.5rem', textAlign: 'center', textShadow: '0 0 10px rgba(56,189,248,0.5)' }}>TOP 5 PLAYERS</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {topScores.map((entry, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem', color: i === 0 ? '#facc15' : '#e2e8f0' }}>
                        <span>{i + 1}. {entry.player?.name || '???'}</span>
                        <span>{entry.score}</span>
                      </div>
                    ))}
                    {topScores.length === 0 && <p style={{ color: '#64748b', textAlign: 'center' }}>No scores yet!</p>}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={startGame}
              style={{ border: 'none', backgroundColor: '#f59e0b', borderBottom: '8px solid #b45309', color: '#ffffff', cursor: 'pointer', padding: '1rem 2.5rem', fontSize: '1.5rem', borderRadius: '1.5rem', textTransform: 'uppercase', marginTop: '1rem' }}
            >
              PLAY AGAIN!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}