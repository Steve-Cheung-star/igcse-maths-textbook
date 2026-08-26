import React, { useState, useEffect, useRef } from 'react';

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const CONGRATULATIONS = [
  "Spot on! Great work! 🎉",
  "Boom! Perfect rounding! 🎯",
  "You nailed that one! 🔥",
  "Excellent logic! Keep it rolling! 🚀"
];

const CONSOLATIONS = [
  "Ah, close! Check your rounding rules. 💡",
  "Not quite! Watch the digit to the right. 🧐",
  "Tricky one! Review the place value. 📏",
  "Almost! Keep an eye on those trailing zeros. 💪"
];

const formatWithSpaces = (strOrNum) => {
  if (strOrNum === null || strOrNum === undefined) return '';
  const str = String(strOrNum);
  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
};

const safeRoundSF = (num, sf) => {
  if (!num || num === 0) return "0";
  const magnitude = Math.floor(Math.log10(Math.abs(num))) + 1;
  const decimalPlaces = sf - magnitude;
  
  if (decimalPlaces > 0) {
    const factor = Math.pow(10, decimalPlaces);
    return formatWithSpaces((Math.round(num * factor) / factor).toFixed(decimalPlaces));
  } else {
    const factor = Math.pow(10, -decimalPlaces);
    return formatWithSpaces((Math.round(num / factor) * factor).toString());
  }
};

export default function RoundingQuiz() {
  const [question, setQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  
  const [history, setHistory] = useState([]);
  const [showReview, setShowReview] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);

  const timerRef = useRef(null);

  const generateQuestion = () => {
    try {
      const rand = Math.random();
      let promptText = '';
      let correctAnswer = '';
      let distractors = [];

      if (rand < 0.30) {
        const mag = [10, 100, 1000, 10000][Math.floor(Math.random() * 4)];
        const num = Math.floor(Math.random() * 899999) + 1000;
        
        correctAnswer = formatWithSpaces((Math.round(num / mag) * mag).toString());
        promptText = `Round **${formatWithSpaces(num)}** to the **nearest ${mag}**.`;

        distractors = [
          formatWithSpaces((Math.floor(num / mag) * mag).toString()),
          formatWithSpaces((Math.ceil(num / mag) * mag).toString()),
          formatWithSpaces((Math.round(num / (mag * 10)) * (mag * 10)).toString())
        ];

      } else if (rand < 0.60) {
        const dp = Math.floor(Math.random() * 3) + 1;
        const num = (Math.random() * 899) + 10;
        
        correctAnswer = formatWithSpaces(num.toFixed(dp));
        promptText = `Round **${formatWithSpaces(num.toFixed(dp + 2))}** to **${dp} decimal place${dp > 1 ? 's' : ''}**.`;

        distractors = [
          formatWithSpaces(num.toFixed(dp + 1)),
          formatWithSpaces(num.toFixed(Math.max(0, dp - 1))),
          formatWithSpaces((Math.floor(num * Math.pow(10, dp)) / Math.pow(10, dp)).toFixed(dp))
        ];

      } else {
        const sf = Math.floor(Math.random() * 3) + 1;
        const num = Math.random() < 0.5 
          ? Math.floor(Math.random() * 8999) + 100
          : Math.round((Math.random() * 0.89 + 0.10) * 10000) / 10000;

        correctAnswer = safeRoundSF(num, sf);
        promptText = `Round **${safeRoundSF(num, sf + 2)}** to **${sf} significant figure${sf > 1 ? 's' : ''}**.`;

        distractors = [
          safeRoundSF(num, sf + 1),
          safeRoundSF(num, Math.max(1, sf - 1)),
          formatWithSpaces(num.toFixed(sf))
        ];
      }

      const optionsSet = new Set([correctAnswer]);
      for (let d of distractors) {
        if (d && d !== correctAnswer) optionsSet.add(d);
      }

      let fallbackCounter = 1;
      while (optionsSet.size < 4 && fallbackCounter <= 10) {
        optionsSet.add(formatWithSpaces((parseFloat(correctAnswer.replace(/\s/g, '')) + fallbackCounter).toString()));
        fallbackCounter++;
      }

      const finalOptions = Array.from(optionsSet).slice(0, 4).sort(() => Math.random() - 0.5);

      setQuestion({
        id: Date.now(),
        promptText,
        correctAnswer,
        options: finalOptions
      });

      setSelectedOption(null);
      setIsSubmitted(false);
      setFeedbackMessage('');
    } catch (e) {
      console.error("Error building question:", e);
    }
  };

  useEffect(() => {
    generateQuestion();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
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

  if (!question) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        Loading Rounding Quiz...
      </div>
    );
  }

  const reviewItems = history.filter((item) => !item.isCorrect);
  const currentReview = reviewItems[reviewIndex];

  const handlePrevReview = () => {
    setReviewIndex((prev) => (prev > 0 ? prev - 1 : reviewItems.length - 1));
  };

  const handleNextReview = () => {
    setReviewIndex((prev) => (prev < reviewItems.length - 1 ? prev + 1 : 0));
  };

  const renderPrompt = (text) => {
    if (!text) return null;
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => (i % 2 === 1 ? <strong key={i} style={{ color: '#0369a1' }}>{part}</strong> : part));
  };

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '30px', width: '100%', maxWidth: '700px', margin: '0 auto', background: '#fff', fontFamily: 'sans-serif', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', boxSizing: 'border-box' }}>
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

      {/* Review Box UI */}
      {showReview && (
        <div style={{ marginBottom: '25px', padding: '16px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1rem' }}>
              Incorrect Answers Review
            </h4>
            {reviewItems.length > 0 && (
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>
                {reviewIndex + 1} of {reviewItems.length}
              </span>
            )}
          </div>

          {reviewItems.length === 0 ? (
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>No incorrect answers to review yet!</p>
          ) : (
            <div>
              <div style={{ padding: '16px', borderRadius: '8px', background: '#fff', border: '1px solid #fee2e2' }}>
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '8px' }}>Attempted at {currentReview.timestamp}</div>
                <div style={{ marginBottom: '12px', fontSize: '1.05rem' }}>
                  {renderPrompt(currentReview.promptText)}
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <strong>Your Choice:</strong> <span style={{ color: '#b91c1c', fontSize: '1.1rem', fontWeight: 'bold' }}>{currentReview.selectedOption}</span>
                </div>
                <div>
                  <strong>Correct Answer:</strong> <span style={{ color: '#15803d', fontSize: '1.1rem', fontWeight: 'bold' }}>{currentReview.correctAnswer}</span>
                </div>
              </div>

              {reviewItems.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                  <button
                    onClick={handlePrevReview}
                    style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', color: '#334155' }}
                  >
                    ◄ Prev
                  </button>
                  <button
                    onClick={handleNextReview}
                    style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', color: '#334155' }}
                  >
                    Next ►
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Question Prompt */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '30px 0', minHeight: '60px' }}>
        <h3 style={{ fontSize: '1.4rem', color: '#0f172a', textAlign: 'center', lineHeight: '1.4', margin: 0 }}>
          {renderPrompt(question.promptText)}
        </h3>
      </div>

      {/* Options Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {question.options.map((opt, i) => {
          let cardStyle = {
            padding: '20px 10px',
            borderRadius: '12px',
            border: '2px solid #cbd5e1',
            cursor: isSubmitted ? 'default' : 'pointer',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80px',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#1e293b'
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
              onClick={() => handleSelect(opt)}
              style={cardStyle}
            >
              {opt}
            </div>
          );
        })}
      </div>

      <div style={{ minHeight: '24px', marginTop: '20px', textAlign: 'center', fontSize: '15px', fontWeight: 'bold', color: selectedOption === question.correctAnswer ? '#15803d' : '#b91c1c' }}>
        {feedbackMessage}
      </div>
    </div>
  );
}