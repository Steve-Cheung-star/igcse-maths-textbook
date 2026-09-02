import React, { useState, useEffect, useCallback, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const ANGLES = [0, 30, 45, 60, 90];
const FUNCS = ['sin', 'cos', 'tan'];

const RATIOS = {
  sin: { 0: '0', 30: '\\frac{1}{2}', 45: '\\frac{\\sqrt{2}}{2}', 60: '\\frac{\\sqrt{3}}{2}', 90: '1' },
  cos: { 0: '1', 30: '\\frac{\\sqrt{3}}{2}', 45: '\\frac{\\sqrt{2}}{2}', 60: '\\frac{1}{2}', 90: '0' },
  tan: { 0: '0', 30: '\\frac{\\sqrt{3}}{3}', 45: '1', 60: '\\sqrt{3}', 90: '\\text{Undef.}' }
};

const ALL_ANSWERS = Array.from(new Set([
  ...Object.values(RATIOS.sin),
  ...Object.values(RATIOS.cos),
  ...Object.values(RATIOS.tan)
]));

const SUCCESS_MSGS = ["Spot on! 🎯", "Excellent! 🌟", "Great job! 🔥", "You got it! ✨", "Perfect! 👏"];
const CONSOLE_MSGS = ["Not quite.", "Keep practicing!", "Oops, almost!", "Don't give up!", "Tricky one!"];

// Helper to safely render KaTeX to an HTML string
const renderMath = (mathStr) => {
  try {
    return { __html: katex.renderToString(mathStr, { throwOnError: false }) };
  } catch (err) {
    console.error("KaTeX error:", err);
    return { __html: mathStr };
  }
};

export default function ExactTrigRatios() {
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState({ show: false, status: '', message: '' });
  
  // Track selection and waiting state for visual highlights
  const [isWaiting, setIsWaiting] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  
  const quizRef = useRef(null);

  const generateQuestion = useCallback(() => {
    const fn = FUNCS[Math.floor(Math.random() * FUNCS.length)];
    const angle = ANGLES[Math.floor(Math.random() * ANGLES.length)];
    const correctAns = RATIOS[fn][angle];

    const newOptions = new Set([correctAns]);
    while (newOptions.size < 4) {
      const randomDistractor = ALL_ANSWERS[Math.floor(Math.random() * ALL_ANSWERS.length)];
      newOptions.add(randomDistractor);
    }

    const shuffledOptions = Array.from(newOptions).sort(() => Math.random() - 0.5);

    setQuestion({ fn, angle, correctAns });
    setOptions(shuffledOptions);
    setFeedback({ show: false, status: '', message: '' });
    setIsWaiting(false);
    setSelectedAnswer(null);
  }, []);

  useEffect(() => {
    generateQuestion();
    if (quizRef.current) {
      quizRef.current.focus();
    }
  }, [generateQuestion]);

  const handleSelect = useCallback((selectedAns) => {
    if (isWaiting || !question) return;
    
    setIsWaiting(true);
    setSelectedAnswer(selectedAns);

    const isCorrect = selectedAns === question.correctAns;

    if (isCorrect) {
      setScore(s => s + 1);
      setStreak(s => s + 1);
      const msg = SUCCESS_MSGS[Math.floor(Math.random() * SUCCESS_MSGS.length)];
      setFeedback({ show: true, status: 'correct', message: msg });
    } else {
      setStreak(0);
      const msg = CONSOLE_MSGS[Math.floor(Math.random() * CONSOLE_MSGS.length)];
      setFeedback({ show: true, status: 'incorrect', message: msg });
    }

    setTimeout(() => {
      generateQuestion();
    }, 1500);
  }, [isWaiting, question, generateQuestion]);

  const handleKeyDown = (e) => {
    if (['1', '2', '3', '4'].includes(e.key)) {
      const index = parseInt(e.key, 10) - 1;
      if (options[index]) {
        handleSelect(options[index]);
      }
    }
  };

  if (!question) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div 
      ref={quizRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ 
        background: '#0f172a', 
        padding: '32px', 
        borderRadius: '24px', 
        color: 'white', 
        maxWidth: '600px', 
        margin: '0 auto', 
        fontFamily: 'sans-serif', 
        borderBottom: '8px solid #4f46e5',
        outline: 'none',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', background: '#4f46e5', borderRadius: '50%', opacity: 0.2, filter: 'blur(40px)', pointerEvents: 'none' }}></div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 10 }}>
        <h2 style={{ color: '#a5b4fc', margin: 0, fontSize: '1.25rem', letterSpacing: '-0.025em' }}>Rapid Recall (0° - 90°)</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {streak >= 3 && (
            <div style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#fb923c', padding: '4px 12px', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 'bold', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
              🔥 {streak}
            </div>
          )}
          <div style={{ background: 'rgba(30, 27, 75, 0.8)', color: '#c7d2fe', padding: '4px 16px', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 'bold', border: '1px solid rgba(79, 70, 229, 0.5)' }}>
            Score: {score}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', margin: '40px 0', minHeight: '60px', position: 'relative', zIndex: 10 }}>
        <div 
          style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}
          dangerouslySetInnerHTML={renderMath(`\\${question.fn}(${question.angle}^\\circ)`)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', position: 'relative', zIndex: 10 }}>
        {options.map((opt, i) => {
          
          let bgColor = 'rgba(255, 255, 255, 0.05)';
          let borderColor = 'rgba(255, 255, 255, 0.1)';
          let opacity = 1;

          if (isWaiting) {
            if (opt === question.correctAns) {
              bgColor = 'rgba(16, 185, 129, 0.2)'; 
              borderColor = 'rgba(16, 185, 129, 0.5)';
            } else if (opt === selectedAnswer) {
              bgColor = 'rgba(244, 63, 94, 0.2)'; 
              borderColor = 'rgba(244, 63, 94, 0.5)';
            } else {
              opacity = 0.4; 
            }
          }

          return (
            <button
              key={i}
              disabled={isWaiting}
              onClick={() => handleSelect(opt)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '96px', // Locked height
                background: bgColor,
                border: `1px solid ${borderColor}`,
                padding: '0 12px',
                borderRadius: '16px',
                color: 'white',
                fontSize: '1.5rem',
                cursor: isWaiting ? 'default' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: opacity,
                backdropFilter: 'blur(4px)'
              }}
              onMouseOver={(e) => { if (!isWaiting) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)' }}
              onMouseOut={(e) => { if (!isWaiting) e.currentTarget.style.background = bgColor }}
            >
              <div style={{ position: 'absolute', top: '8px', left: '12px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'sans-serif' }}>
                {i + 1}
              </div>
              <span dangerouslySetInnerHTML={renderMath(opt)} />
            </button>
          )
        })}
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', marginTop: '20px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>
        Pro tip: Click here and use keys 1-4 to answer quickly
      </p>

      <div style={{ 
        marginTop: '16px', 
        height: '48px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontSize: '1.125rem', 
        fontWeight: 'bold', 
        borderRadius: '16px',
        opacity: feedback.show ? 1 : 0,
        transform: feedback.show ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.3s ease',
        background: feedback.status === 'correct' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
        color: feedback.status === 'correct' ? '#6ee7b7' : '#fda4af',
        border: `1px solid ${feedback.status === 'correct' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(244, 63, 94, 0.5)'}`,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        {feedback.message}
      </div>
    </div>
  );
}