import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const renderMath = (latex) => {
  try {
    return katex.renderToString(latex, { throwOnError: false, displayMode: true });
  } catch (err) {
    return latex;
  }
};

const CONGRATULATIONS = [
  "Spot on! Great work! 🎉",
  "Boom! Perfect setup! 🎯",
  "You nailed that trig relation! 🔥",
  "Excellent logic! Keep it rolling! 🚀"
];

const CONSOLATIONS = [
  "Ah, close! Check your opposite vs. adjacent sides. 💡",
  "Not quite! Remember: SOH-CAH-TOA. 📐",
  "Tricky one! Keep an eye on which side is the hypotenuse. 🧐",
  "Almost! Review the position relative to angle x. 💪"
];

// Lightweight SVG Re-renderer for History Cards
function MiniTriangleSVG({ params }) {
  if (!params) return null;
  const { visW, visH, rotation, angleVertex, leftLegLabel, bottomLegLabel, hypSideLabel, angleLabel } = params;

  const halfW = visW / 2;
  const halfH = visH / 2;
  const maxRadius = Math.sqrt(halfW * halfW + halfH * halfH) + 40;
  const safeScale = maxRadius > 180 ? 180 / maxRadius : 1.0;

  let angleX = 0, angleY = 0;
  if (angleVertex === 'topLeft') {
    const cornerAngleRad = Math.atan2(2 * halfW, 2 * halfH);
    const dynamicOffset = Math.min(68, Math.max(40, 24 / Math.sin(cornerAngleRad / 2)));
    const hypLen = Math.sqrt(4 * halfW * halfW + 4 * halfH * halfH);
    const bisectX = (2 * halfW) / hypLen;
    const bisectY = 1 + (2 * halfH) / hypLen;
    const bisectLen = Math.sqrt(bisectX * bisectX + bisectY * bisectY);
    angleX = -halfW + (bisectX / bisectLen) * dynamicOffset;
    angleY = -halfH + (bisectY / bisectLen) * dynamicOffset;
  } else {
    const cornerAngleRad = Math.atan2(2 * halfH, 2 * halfW);
    const dynamicOffset = Math.min(68, Math.max(40, 24 / Math.sin(cornerAngleRad / 2)));
    const hypLen = Math.sqrt(4 * halfW * halfW + 4 * halfH * halfH);
    const bisectX = -1 - (2 * halfW) / hypLen;
    const bisectY = -(2 * halfH) / hypLen;
    const bisectLen = Math.sqrt(bisectX * bisectX + bisectY * bisectY);
    angleX = halfW + (bisectX / bisectLen) * dynamicOffset;
    angleY = halfH + (bisectY / bisectLen) * dynamicOffset;
  }

  const renderLabel = (val) => (val === 'x' ? <tspan fontStyle="italic" fontFamily="serif">x</tspan> : val);

  return (
    <svg width="120" height="120" viewBox="-200 -200 400 400" style={{ background: '#f1f5f9', borderRadius: '8px', flexShrink: 0 }}>
      <g transform={`scale(${safeScale}) rotate(${rotation})`}>
        <polygon points={`-${halfW},${halfH} ${halfW},${halfH} -${halfW},-${halfH}`} fill="#e0f2fe" stroke="#0284c7" strokeWidth="5" strokeLinejoin="round" />
        <path d={`M -${halfW},${halfH - 22} L -${halfW - 22},${halfH - 22} L -${halfW - 22},${halfH}`} fill="none" stroke="#0284c7" strokeWidth="3" />
        {bottomLegLabel && <text x="0" y={halfH + 34} textAnchor="middle" dominantBaseline="middle" fill="#1e293b" fontSize="22" fontWeight="bold" transform={`rotate(${-rotation}, 0, ${halfH + 34})`}>{renderLabel(bottomLegLabel)}</text>}
        {leftLegLabel && <text x={-halfW - 34} y="0" textAnchor="middle" dominantBaseline="middle" fill="#1e293b" fontSize="22" fontWeight="bold" transform={`rotate(${-rotation}, ${-halfW - 34}, 0)`}>{renderLabel(leftLegLabel)}</text>}
        {hypSideLabel && <text x={22} y={-22} textAnchor="middle" dominantBaseline="middle" fill="#1e293b" fontSize="22" fontWeight="bold" transform={`rotate(${-rotation}, 22, -22)`}>{renderLabel(hypSideLabel)}</text>}
        <text x={angleX} y={angleY} textAnchor="middle" dominantBaseline="middle" fill="#1e293b" fontSize="18" fontWeight="bold" transform={`rotate(${-rotation}, ${angleX}, ${angleY})`}>{renderLabel(angleLabel)}</text>
      </g>
    </svg>
  );
}

export default function TrigQuiz() {
  const [question, setQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  
  // History & Review Drawer States
  const [history, setHistory] = useState([]);
  const [showReview, setShowReview] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);

  const timerRef = useRef(null);

  const generateQuestion = () => {
    const angleVal = getRandomInt(25, 65);
    const funcs = ['sin', 'cos', 'tan'];
    const targetFunc = funcs[getRandomInt(0, 2)];
    const isAngleQuery = Math.random() > 0.5;
    const angleVertex = Math.random() > 0.5 ? 'topLeft' : 'bottomRight';

    let oppVal = '', adjVal = '', hypVal = '';
    let promptText = 'Which equation correctly sets up the problem to find x?';
    let correctEq = '';
    let optionsPool = [];

    let val1 = getRandomInt(5, 25);
    let val2 = getRandomInt(5, 25);
    while (val1 === val2) val2 = getRandomInt(5, 25);
    const leg = Math.min(val1, val2);
    const hypotenuse = Math.max(val1, val2);

    if (isAngleQuery) {
      let num, den, otherLeg;
      if (targetFunc === 'sin') { num = leg; den = hypotenuse; otherLeg = Math.round(Math.sqrt(den * den - num * num)) || 12; oppVal = leg; hypVal = hypotenuse; }
      else if (targetFunc === 'cos') { num = leg; den = hypotenuse; otherLeg = Math.round(Math.sqrt(den * den - num * num)) || 12; adjVal = leg; hypVal = hypotenuse; }
      else { num = val1; den = val2; otherLeg = Math.round(Math.sqrt(num * num + den * den)) || 20; oppVal = val1; adjVal = val2; }

      correctEq = `\\${targetFunc}(x) = \\displaystyle\\frac{${num}}{${den}}`;
      const reciprocal = `\\${targetFunc}(x) = \\displaystyle\\frac{${den}}{${num}}`;
      const otherFuncs = funcs.filter(f => f !== targetFunc);
      optionsPool = [
        correctEq, reciprocal,
        `\\${otherFuncs[0]}(x) = \\displaystyle\\frac{${num}}{${den}}`,
        `\\${otherFuncs[0]}(x) = \\displaystyle\\frac{${den}}{${num}}`,
        `\\${otherFuncs[1]}(x) = \\displaystyle\\frac{${num}}{${otherLeg}}`,
        `\\${otherFuncs[1]}(x) = \\displaystyle\\frac{${otherLeg}}{${den}}`
      ];
    } else {
      const numIsX = Math.random() > 0.5;
      const sideVal = getRandomInt(8, 20);
      let num = numIsX ? 'x' : sideVal;
      let den = numIsX ? sideVal : 'x';

      if (targetFunc === 'sin') { oppVal = num; hypVal = den; }
      else if (targetFunc === 'cos') { adjVal = num; hypVal = den; }
      else { oppVal = num; adjVal = den; }

      correctEq = `\\${targetFunc}(${angleVal}^\\circ) = \\displaystyle\\frac{${num}}{${den}}`;
      const reciprocal = `\\${targetFunc}(${angleVal}^\\circ) = \\displaystyle\\frac{${den}}{${num}}`;
      const otherFuncs = funcs.filter(f => f !== targetFunc);
      optionsPool = [
        correctEq, reciprocal,
        `\\${otherFuncs[0]}(${angleVal}^\\circ) = \\displaystyle\\frac{${num}}{${den}}`,
        `\\${otherFuncs[0]}(${angleVal}^\\circ) = \\displaystyle\\frac{${den}}{${num}}`,
        `\\${otherFuncs[1]}(${angleVal}^\\circ) = \\displaystyle\\frac{${num}}{${den}}`
      ];
    }

    let leftLegLabel = angleVertex === 'topLeft' ? adjVal : oppVal;
    let bottomLegLabel = angleVertex === 'topLeft' ? oppVal : adjVal;
    let hypSideLabel = hypVal;

    const finalOptions = Array.from(new Set(optionsPool)).slice(0, 4).sort(() => Math.random() - 0.5);
    const visW = getRandomInt(110, 180);
    const visH = getRandomInt(110, 180);
    const rotation = getRandomInt(0, 360);
    const angleLabel = isAngleQuery ? 'x' : `${angleVal}°`;

    setQuestion({
      id: Date.now(),
      angleLabel,
      angleVertex,
      leftLegLabel,
      bottomLegLabel,
      hypSideLabel,
      promptText,
      correctAnswer: correctEq,
      options: finalOptions,
      rotation,
      visW,
      visH,
      svgParams: { visW, visH, rotation, angleVertex, leftLegLabel, bottomLegLabel, hypSideLabel, angleLabel }
    });

    setSelectedOption(null);
    setIsSubmitted(false);
    setFeedbackMessage('');
  };

  useEffect(() => {
    generateQuestion();
    return () => clearTimeout(timerRef.current);
  }, []);

  const handleSelect = (option) => {
    if (isSubmitted) return;
    setSelectedOption(option);
    setIsSubmitted(true);

    const isCorrect = option === question.correctAnswer;

    setHistory((prev) => [
      ...prev,
      {
        id: question.id,
        promptText: question.promptText,
        selectedOption: option,
        correctAnswer: question.correctAnswer,
        isCorrect,
        svgParams: question.svgParams,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    if (isCorrect) {
      setScore((prev) => prev + 100);
      setStreak((prev) => prev + 1);
      setFeedbackMessage(CONGRATULATIONS[getRandomInt(0, CONGRATULATIONS.length - 1)]);
    } else {
      setStreak(0);
      setFeedbackMessage(CONSOLATIONS[getRandomInt(0, CONSOLATIONS.length - 1)]);
    }

    timerRef.current = setTimeout(() => { generateQuestion(); }, 3000);
  };

  if (!question) return null;

  const reviewItems = history.filter((item) => !item.isCorrect);

  const handlePrevReview = () => {
    setReviewIndex((prev) => (prev > 0 ? prev - 1 : reviewItems.length - 1));
  };

  const handleNextReview = () => {
    setReviewIndex((prev) => (prev < reviewItems.length - 1 ? prev + 1 : 0));
  };

  const currentReview = reviewItems[reviewIndex];

  const halfW = question.visW / 2;
  const halfH = question.visH / 2;
  const maxRadius = Math.sqrt(halfW * halfW + halfH * halfH) + 40;
  const safeScale = maxRadius > 180 ? 180 / maxRadius : 1.0;

  let angleX = 0, angleY = 0;
  if (question.angleVertex === 'topLeft') {
    const cornerAngleRad = Math.atan2(2 * halfW, 2 * halfH);
    const dynamicOffset = Math.min(68, Math.max(40, 24 / Math.sin(cornerAngleRad / 2)));
    const hypLen = Math.sqrt(4 * halfW * halfW + 4 * halfH * halfH);
    const bisectX = (2 * halfW) / hypLen;
    const bisectY = 1 + (2 * halfH) / hypLen;
    const bisectLen = Math.sqrt(bisectX * bisectX + bisectY * bisectY);
    angleX = -halfW + (bisectX / bisectLen) * dynamicOffset;
    angleY = -halfH + (bisectY / bisectLen) * dynamicOffset;
  } else {
    const cornerAngleRad = Math.atan2(2 * halfH, 2 * halfW);
    const dynamicOffset = Math.min(68, Math.max(40, 24 / Math.sin(cornerAngleRad / 2)));
    const hypLen = Math.sqrt(4 * halfW * halfW + 4 * halfH * halfH);
    const bisectX = -1 - (2 * halfW) / hypLen;
    const bisectY = -(2 * halfH) / hypLen;
    const bisectLen = Math.sqrt(bisectX * bisectX + bisectY * bisectY);
    angleX = halfW + (bisectX / bisectLen) * dynamicOffset;
    angleY = halfH + (bisectY / bisectLen) * dynamicOffset;
  }

  const renderLabel = (val) => (val === 'x' ? <tspan fontStyle="italic" fontFamily="serif">x</tspan> : val);

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '30px', maxWidth: '700px', margin: '0 auto', background: '#fff', fontFamily: 'sans-serif', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      <style>{`
        .trig-quiz-btn, .trig-quiz-btn:focus, .trig-quiz-btn:focus-visible, .trig-quiz-btn:active {
          outline: none !important;
          box-shadow: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '1.1rem' }}>
        <div>
          <span style={{ marginRight: '15px' }}><strong>Score:</strong> {score}</span>
          <span><strong>Streak:</strong> 🔥 {streak}</span>
        </div>
        <button
          onClick={() => {
            setShowReview(!showReview);
            setReviewIndex(0);
          }}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: reviewItems.length > 0 ? '#fef2f2' : '#f8fafc',
            color: reviewItems.length > 0 ? '#991b1b' : '#64748b',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}
        >
          📖 Review ({reviewItems.length})
        </button>
      </div>

      {/* Paginated Review Carousel Drawer */}
      {showReview && (
        <div style={{ marginBottom: '25px', padding: '16px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1rem' }}>
              Review Carousel
            </h4>
            {reviewItems.length > 0 && (
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>
                {reviewIndex + 1} of {reviewItems.length}
              </span>
            )}
          </div>

          {reviewItems.length === 0 ? (
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>No items to review yet! Keep going! 👏</p>
          ) : (
            <div>
              {/* Card content with Mini SVG */}
              <div style={{ padding: '14px', borderRadius: '8px', background: '#fff', border: '1px solid #fee2e2', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <MiniTriangleSVG params={currentReview.svgParams} />
                <div style={{ fontSize: '0.9rem', flex: 1 }}>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '6px' }}>Attempted at {currentReview.timestamp}</div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Your Answer:</strong> <span style={{ color: '#b91c1c' }} dangerouslySetInnerHTML={{ __html: renderMath(currentReview.selectedOption) }} />
                  </div>
                  <div>
                    <strong>Correct Answer:</strong> <span style={{ color: '#15803d' }} dangerouslySetInnerHTML={{ __html: renderMath(currentReview.correctAnswer) }} />
                  </div>
                </div>
              </div>

              {/* Navigation Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                <button
                  onClick={handlePrevReview}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    color: '#334155'
                  }}
                >
                  ◄ Previous
                </button>
                <button
                  onClick={handleNextReview}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    color: '#334155'
                  }}
                >
                  Next ►
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Question Display */}
      <h3 style={{ minHeight: '2.5rem', fontSize: '1.25rem', marginBottom: '10px', color: '#0f172a' }}>
        {question.promptText}
      </h3>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
        <svg width="340" height="340" viewBox="-200 -200 400 400">
          <g transform={`scale(${safeScale}) rotate(${question.rotation})`}>
            <polygon points={`-${halfW},${halfH} ${halfW},${halfH} -${halfW},-${halfH}`} fill="#e0f2fe" stroke="#0284c7" strokeWidth="4" strokeLinejoin="round" />
            <path d={`M -${halfW},${halfH - 18} L -${halfW - 18},${halfH - 18} L -${halfW - 18},${halfH}`} fill="none" stroke="#0284c7" strokeWidth="2.5" />
            {question.bottomLegLabel && <text x="0" y={halfH + 28} textAnchor="middle" dominantBaseline="middle" fill="#1e293b" fontSize="19" fontWeight="bold" transform={`rotate(${-question.rotation}, 0, ${halfH + 28})`}>{renderLabel(question.bottomLegLabel)}</text>}
            {question.leftLegLabel && <text x={-halfW - 28} y="0" textAnchor="middle" dominantBaseline="middle" fill="#1e293b" fontSize="19" fontWeight="bold" transform={`rotate(${-question.rotation}, ${-halfW - 28}, 0)`}>{renderLabel(question.leftLegLabel)}</text>}
            {question.hypSideLabel && <text x={18} y={-18} textAnchor="middle" dominantBaseline="middle" fill="#1e293b" fontSize="19" fontWeight="bold" transform={`rotate(${-question.rotation}, 18, -18)`}>{renderLabel(question.hypSideLabel)}</text>}
            <text x={angleX} y={angleY} textAnchor="middle" dominantBaseline="middle" fill="#1e293b" fontSize="16" fontWeight="bold" transform={`rotate(${-question.rotation}, ${angleX}, ${angleY})`}>{renderLabel(question.angleLabel)}</text>
          </g>
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {question.options.map((opt, i) => {
          let cardStyle = {
            padding: '15px 10px',
            borderRadius: '12px',
            border: '2px solid #cbd5e1',
            cursor: isSubmitted ? 'default' : 'pointer',
            background: '#f8fafc',
            transition: 'all 0.15s ease-in-out',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80px',
            userSelect: 'none'
          };

          if (isSubmitted) {
            if (opt === question.correctAnswer) {
              cardStyle.background = '#dcfce7';
              cardStyle.borderColor = '#22c55e';
              cardStyle.color = '#166534';
            } else if (selectedOption === opt) {
              cardStyle.background = '#fee2e2';
              cardStyle.borderColor = '#ef4444';
              cardStyle.color = '#991b1b';
            } else {
              cardStyle.opacity = '0.35';
            }
          }

          return (
            <div
              key={`${question.id}-option-${i}`}
              role="button"
              tabIndex={0}
              className="trig-quiz-btn"
              onClick={() => handleSelect(opt)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(opt); }}
              style={cardStyle}
              dangerouslySetInnerHTML={{ __html: renderMath(opt) }}
            />
          );
        })}
      </div>

      <div style={{ minHeight: '24px', marginTop: '20px', textAlign: 'center', fontSize: '15px', fontWeight: 'bold', color: selectedOption === question.correctAnswer ? '#15803d' : '#b91c1c' }}>
        {feedbackMessage}
      </div>
    </div>
  );
}