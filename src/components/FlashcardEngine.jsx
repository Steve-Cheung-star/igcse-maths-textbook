// src/components/FlashcardEngine.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// 1. PULL ALL CSS TO THE TOP SO IT NEVER GETS DELETED
const STYLES = `
  /* BASE STYLES & RESPONSIVE CENTERING */
  .flashcard-container { 
    width: 100%; 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    justify-content: center;
    box-sizing: border-box;
    overflow-x: hidden; 
    padding: 1rem 0; 
  }
  
  /* Bulletproof constraint: Safe margin on mobile, max 640px on desktop */
  .fc-header, 
  .progress-track, 
  .card-scene, 
  .button-row {
    width: min(calc(100% - 1rem), 640px);
    box-sizing: border-box;
  }
  
  .fc-header { 
    display: flex; 
    justify-content: space-between; 
    margin-bottom: 0.5rem; 
    align-items: center; 
  }
  
  .topic-select { background: transparent; border: 1px solid var(--sl-color-hairline); color: var(--sl-color-text); padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; max-width: 70%; }
  .counter { font-size: 0.8rem; font-weight: bold; opacity: 0.5; }
  
  .progress-track { 
    height: 4px; 
    background: rgba(128,128,128,0.2); 
    border-radius: 10px; 
    margin-bottom: 1rem; 
    overflow: hidden; 
  }
  .progress-bar { height: 100%; background: #f97316; transition: width 0.4s ease; }
  
  /* CARD SIZING */
  .card-scene { 
    height: 420px; 
    perspective: 1200px; 
    cursor: pointer; 
    margin: 0 auto; 
    touch-action: pan-y; 
  }
  
  .card-inner { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; }
  .is-flipped { transform: rotateY(180deg); }
  .face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 2rem; border-radius: 1.5rem; border: 2.5px solid transparent; overflow: hidden; box-sizing: border-box; }
  .face-front { transform: rotateY(0deg) translateZ(1px); z-index: 2; }
  .face-back { transform: rotateY(180deg) translateZ(1px); }
  
  /* Themes */
  .light-theme .face { background: #ffffff; color: #000000; }
  .dark-theme .face { background: #23262f; color: #ffffff; }
  .sepia-mode .face { background: #fdf6e3; color: #5b4636; }
  
  /* Dyslexic Font Toggle for Cards */
  .dyslexic-mode .content,
  .dyslexic-mode .face {
    font-family: 'OpenDyslexic', 'Lexend', sans-serif !important;
  }
  .dyslexic-mode .content {
    letter-spacing: 0.05em;
    word-spacing: 0.1em;
  }
  
  .content { 
    font-size: 1.25rem; 
    text-align: center; 
    line-height: 1.5; 
    color: inherit; 
    z-index: 10; 
    word-wrap: break-word; 
    overflow-wrap: break-word; 
    width: 100%; 
  }
  .content b { font-weight: 800; }
  .type-badge { position: absolute; top: 1.5rem; font-size: 0.7rem; font-weight: 900; text-transform: uppercase; color: #f97316; letter-spacing: 0.1em; }
  .lesson-link { margin-top: 1.5rem; font-size: 0.8rem; color: #f97316; text-decoration: none; font-weight: 800; padding: 6px 14px; border: 1.5px solid #f97316; border-radius: 20px; z-index: 10; transition: all 0.2s; }
  .lesson-link:hover { background: #f97316; color: white; }
  .footer-hint { position: absolute; bottom: 1.5rem; font-size: 0.75rem; opacity: 0.5; }
  
  .button-row { 
    display: grid; 
    grid-template-columns: repeat(3, 1fr); 
    gap: 0.75rem; 
    margin-top: 1.5rem; 
  }
  .btn { padding: 0.9rem; border-radius: 1rem; border: none; color: white; font-weight: 800; cursor: pointer; transition: transform 0.1s; text-transform: uppercase; font-size: 0.8rem; }
  .btn:active { transform: scale(0.95); }
  .btn-red { background: #ef4444; } .btn-yellow { background: #f59e0b; } .btn-green { background: #10b981; }

  /* ==========================================
     LATEX FIXES
     ========================================== */
  .katex { font-size: 1.15em !important; }
  .katex-display { margin: 1em 0; overflow-x: auto; overflow-y: hidden; padding: 5px 0; }

  /* ==========================================
     HOLO-FOIL TRADING CARD CSS
     ========================================== */
  .results-scene { height: auto; min-height: 480px; cursor: default; }
  .tc-card { padding: 0 !important; transform: none !important; position: relative; overflow: hidden; display: flex; flex-direction: column; }
  
  @keyframes holoShimmer {
    0% { background-position: 0% 0%; }
    50% { background-position: 100% 100%; }
    100% { background-position: 0% 0%; }
  }
  .tc-holo-overlay {
    position: absolute; inset: 0; z-index: 1; pointer-events: none; opacity: 0.35;
    background: linear-gradient(125deg, rgba(255,0,0,0.4) 0%, rgba(255,154,0,0.4) 10%, rgba(208,222,33,0.4) 20%, rgba(79,220,74,0.4) 30%, rgba(63,218,216,0.4) 40%, rgba(47,201,226,0.4) 50%, rgba(28,127,238,0.4) 60%, rgba(95,21,242,0.4) 70%, rgba(186,12,248,0.4) 80%, rgba(251,7,217,0.4) 90%, rgba(255,0,0,0.4) 100%);
    background-size: 300% 300%;
    animation: holoShimmer 6s linear infinite;
    mix-blend-mode: hard-light;
  }

  .tc-inner-border {
    flex: 1; width: calc(100% - 24px); margin: 12px; padding: 12px;
    border: 4px solid var(--rank-color); border-radius: 12px;
    background: var(--sl-color-bg); 
    z-index: 2; display: flex; flex-direction: column;
    box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
  }

  .tc-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 2px solid var(--rank-color); margin-bottom: 12px; }
  .tc-name { font-size: 1.1rem; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 0.05em; color: var(--sl-color-text); }
  .tc-hp { font-size: 1rem; font-weight: 900; color: #ef4444; }

  .tc-art-window {
    background: radial-gradient(circle at center, rgba(128,128,128,0.1) 0%, rgba(128,128,128,0.3) 100%);
    height: 160px; border-radius: 8px; margin-bottom: 12px;
    border: 2px solid rgba(128,128,128,0.4);
    display: flex; justify-content: center; align-items: center;
    box-shadow: inset 0 4px 15px rgba(0,0,0,0.15);
    position: relative; overflow: hidden;
  }
  .tc-rank-badge {
    font-size: 5rem; font-weight: 900; font-family: Impact, sans-serif; font-style: italic;
    color: var(--rank-color); text-shadow: 3px 3px 0 rgba(0,0,0,0.1);
    animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
  @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }

  .tc-stats-box { flex: 1; display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
  .tc-stat-row { display: flex; align-items: center; padding: 4px 0; border-bottom: 1px solid rgba(128,128,128,0.2); }
  .tc-stat-cost { width: 24px; font-size: 1.1rem; opacity: 0.7; }
  .tc-stat-name { flex: 1; font-weight: 700; font-size: 0.9rem; text-transform: uppercase; color: var(--sl-color-text); }
  .tc-stat-dmg { font-weight: 900; font-size: 1.2rem; }
  .tc-flavor-text { font-style: italic; font-size: 0.7rem; opacity: 0.6; text-align: center; margin-top: auto; padding-top: 8px; }

  .tc-actions { display: flex; gap: 8px; width: 100%; }
  .tc-btn { flex: 1; padding: 10px; border-radius: 8px; font-weight: 800; font-size: 0.85rem; text-align: center; text-transform: uppercase; text-decoration: none; cursor: pointer; transition: all 0.2s ease; box-sizing: border-box; }
  .tc-btn-primary { background: var(--rank-color); color: white; border: none; }
  .tc-btn-primary:hover { filter: brightness(1.1); transform: translateY(-2px); }
  .tc-btn-ghost { background: transparent; color: inherit; border: 2px solid rgba(128,128,128,0.3); }
  .tc-btn-ghost:hover { background: rgba(128,128,128,0.1); transform: translateY(-2px); }
`;

export default function FlashcardEngine({ cards, course }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeCards, setActiveCards] = useState([]);
  const [filter, setFilter] = useState('All');
  const [ratings, setRatings] = useState({});
  const [isReady, setIsReady] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [isSepia, setIsSepia] = useState(false);
  const [isDyslexic, setIsDyslexic] = useState(false);
  const cardRef = useRef(null);

  const topics = useMemo(() => {
    const rawTopics = ['All', ...new Set(cards.map(c => c.topic))];
    
    // The master list of the exact Syllabus Express order
    const syllabusOrder = [
      "All",
      "Prior Learning",
      "Surds",
      "Algebra I",
      "Algebra II",
      "Lines, Angles & Polygons",
      "Coordinate Geometry",
      "Pythagoras' Theorem",
      "Circle Geometry",
      "Sequences",
      "Statistics I (Correlation)",
      "Statistics II (Discrete & Continuous)",
      "Measures",
      "Trigonometry I",
      "Sets",
      "Introduction to Functions",
      "Trigonometry II",
      "Logarithms",
      "Transforming Shapes",
      "Transforming Functions",
      "Variation",
      "Vectors",
      "Probability"
    ];

    // Sort the topics based on the master list
    return rawTopics.sort((a, b) => {
      const indexA = syllabusOrder.indexOf(a);
      const indexB = syllabusOrder.indexOf(b);
      
      // If a topic isn't found in the array (fallback), put it at the bottom
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });
  }, [cards]);

  useEffect(() => {
    const saved = localStorage.getItem(`progress_${course}`);
    if (saved) setRatings(JSON.parse(saved));

    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('theme-dark') || localStorage.getItem('starlight-theme') === 'dark';
      const sepiaActive = document.documentElement.classList.contains('sepia-mode') || localStorage.getItem('sepia-mode') === 'true';
      const dyslexicActive = document.documentElement.classList.contains('dyslexic-mode') || localStorage.getItem('dyslexic-mode') === 'true';

      setTheme(isDark ? 'dark' : 'light');
      setIsSepia(sepiaActive);
      setIsDyslexic(dyslexicActive);
    };

    updateTheme();
    
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    let filtered = filter === 'All' ? [...cards] : cards.filter(c => c.topic === filter);
    for (let i = filtered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }

    setActiveCards(filtered);
    setCurrentIndex(0);
    setIsFlipped(false);

    if (cardRef.current) void cardRef.current.offsetHeight;
    
    setIsReady(false);
    const timer = setTimeout(() => setIsReady(true), 150);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [course, filter, cards]);

  const currentCard = activeCards[currentIndex];
  const isFinished = activeCards.length > 0 && currentIndex >= activeCards.length;
  
  let themeClass = `${theme}-theme`;
  if (isSepia) themeClass = 'sepia-mode';
  if (isDyslexic) themeClass += ' dyslexic-mode';

  const renderContent = (text) => {
    if (!text) return "";
    return text
      .replace(/\$([^$]+)\$/g, (match, formula) => {
        try {
          return katex.renderToString(formula, { throwOnError: false });
        } catch (e) { return formula; }
      })
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  };

  const handleRate = (e, status) => {
    e.stopPropagation();
    const nextRatings = { ...ratings, [currentCard.id]: status };
    setRatings(nextRatings);
    localStorage.setItem(`progress_${course}`, JSON.stringify(nextRatings));
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 250);
  };

  if (isFinished) {
    const syllabusPath = course ? `/${course}/course-outline` : '/';
    const total = activeCards.length;
    const easyCount = activeCards.filter(c => ratings[c.id] === 'green').length;
    const hardCount = activeCards.filter(c => ratings[c.id] === 'yellow').length;
    const againCount = activeCards.filter(c => ratings[c.id] === 'red').length;
    
    const rawScore = total > 0 ? Math.round(((easyCount * 1) + (hardCount * 0.5)) / total * 100) : 0;

    let rank = 'C'; let rankColor = '#ef4444'; let isHolo = false;
    if (rawScore >= 95) { rank = 'S'; rankColor = '#a855f7'; isHolo = true; } 
    else if (rawScore >= 80) { rank = 'A'; rankColor = '#10b981'; isHolo = true; } 
    else if (rawScore >= 60) { rank = 'B'; rankColor = '#f59e0b'; }

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: STYLES }} />
        <div className={`flashcard-container ${themeClass}`}>
          <div className="card-scene results-scene">
            <div className="face results-card tc-card" style={{ '--rank-color': rankColor }}>
              {isHolo && <div className="tc-holo-overlay"></div>}
              <div className="tc-inner-border">
                <div className="tc-header">
                  <h1 className="tc-name">{filter}</h1>
                  <div className="tc-hp">HP {rawScore}</div>
                </div>
                <div className="tc-art-window">
                  <div className="tc-rank-badge">{rank}</div>
                </div>
                <div className="tc-stats-box">
                  <div className="tc-stat-row">
                    <span className="tc-stat-cost">⚡</span>
                    <span className="tc-stat-name">Perfect Recall</span>
                    <span className="tc-stat-dmg">{easyCount}</span>
                  </div>
                  <div className="tc-stat-row">
                    <span className="tc-stat-cost">❂</span>
                    <span className="tc-stat-name">Good Grasp</span>
                    <span className="tc-stat-dmg">{hardCount}</span>
                  </div>
                  <div className="tc-stat-row">
                    <span className="tc-stat-cost">✖</span>
                    <span className="tc-stat-name">Missed Marks</span>
                    <span className="tc-stat-dmg">{againCount}</span>
                  </div>
                  <p className="tc-flavor-text">
                    "Mastery is not a destination, but a continuous journey of refinement."
                  </p>
                </div>
                <div className="tc-actions">
                  <button onClick={() => setCurrentIndex(0)} className="tc-btn tc-btn-ghost">Replay Deck</button>
                  <a href={syllabusPath} className="tc-btn tc-btn-primary">Return to Outline</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!currentCard || !isReady) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: STYLES }} />
        <div className={`flashcard-container ${themeClass}`}>
           <div className="card-scene">
             <div className="face face-front">
               <p className="footer-hint">Initializing Deck...</p>
             </div>
           </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className={`flashcard-container ${themeClass}`}>
        <div className="fc-header">
          <select className="topic-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            {topics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <span className="counter">{currentIndex + 1} / {activeCards.length}</span>
        </div>

        <div className="progress-track">
          <div className="progress-bar" style={{ width: `${((currentIndex + 1) / activeCards.length) * 100}%` }} />
        </div>

        <div className="card-scene" onClick={() => setIsFlipped(!isFlipped)}>
          <div
            ref={cardRef}
            className={`card-inner ${isFlipped ? 'is-flipped' : ''}`}
            style={{ transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            <div className="face face-front">
              <span className="type-badge">{currentCard.type}</span>
              <div className="content" dangerouslySetInnerHTML={{ __html: renderContent(currentCard.front) }} />
              <p className="footer-hint">Tap to flip</p>
            </div>

            <div className="face face-back">
              <div className="content" dangerouslySetInnerHTML={{ __html: renderContent(currentCard.back) }} />
              {currentCard.formula && (
                <div className="math-block" dangerouslySetInnerHTML={{ __html: katex.renderToString(currentCard.formula, { displayMode: true }) }} />
              )}
              {currentCard.lesson_url && (
                <a href={currentCard.lesson_url} className="lesson-link" onClick={(e) => e.stopPropagation()}>
                  Review Lesson →
                </a>
              )}
              <p className="footer-hint">Rate to continue</p>
            </div>
          </div>
        </div>

        <div className="button-row">
          <button onClick={(e) => handleRate(e, 'red')} className="btn btn-red">Again</button>
          <button onClick={(e) => handleRate(e, 'yellow')} className="btn btn-yellow">Hard</button>
          <button onClick={(e) => handleRate(e, 'green')} className="btn btn-green">Easy</button>
        </div>
      </div>
    </>
  );
}