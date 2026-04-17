import React, { useState } from 'react';

const GeometryDemo = () => {
  // --- Vertical Angles State ---
  const [intersectAngle, setIntersectAngle] = useState(45);
  
  // --- Triangle State ---
  const [angleA, setAngleA] = useState(60);
  const [angleB, setAngleB] = useState(60);
  const angleC = 180 - angleA - angleB;

  // Calculate Triangle Points
  // Point 1 (A): (50, 150)
  // Point 2 (B): (250, 150) -> Base length is 200
  // Point 3 (C): Calculated using Sine Rule
  const base = 200;
  const radA = (angleA * Math.PI) / 180;
  const radB = (angleB * Math.PI) / 180;
  
  // Using sine rule to find side lengths and then coordinates
  const sideB = (base * Math.sin(radB)) / Math.sin((angleC * Math.PI) / 180);
  const xC = 50 + sideB * Math.cos(radA);
  const yC = 150 - sideB * Math.sin(radA);

  return (
    <div className="flex flex-col gap-8 p-6 bg-white rounded-xl border border-gray-200 my-8 shadow-sm font-sans">
      
      {/* SECTION 1: VERTICAL ANGLES */}
      <section>
        <h3 className="text-xl font-bold mb-2 text-indigo-700">1. Vertically Opposite Angles</h3>
        <div className="flex flex-col md:flex-row items-center gap-6 bg-gray-50 p-6 rounded-lg">
          <svg width="200" height="200" viewBox="0 0 200 200" className="overflow-visible flex-shrink-0">
            <line x1="0" y1="100" x2="200" y2="100" stroke="#94a3b8" strokeWidth="3" />
            <line 
              x1="0" y1="100" x2="200" y2="100" 
              stroke="#4338ca" strokeWidth="3" 
              style={{ 
                transform: `rotate(${intersectAngle}deg)`, 
                transformOrigin: '100px 100px',
                transition: 'transform 0.1s ease-out'
              }} 
            />
            <circle cx="100" cy="100" r="4" fill="#1e1b4b" />
            <text x="100" y="75" textAnchor="middle" className="fill-indigo-600 font-bold text-sm">{intersectAngle}°</text>
            <text x="100" y="140" textAnchor="middle" className="fill-indigo-600 font-bold text-sm">{intersectAngle}°</text>
          </svg>

          <div className="w-full">
            <p className="text-sm text-gray-600 mb-4 font-medium">Adjacent angles on a line sum to 180°. Therefore, the opposite angles must be equal.</p>
            <input 
              type="range" min="20" max="160" value={intersectAngle} 
              onChange={(e) => setIntersectAngle(parseInt(e.target.value))}
              className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* SECTION 2: TRIANGLE SUM */}
      <section>
        <h3 className="text-xl font-bold mb-2 text-emerald-700">2. Interior Angles of a Triangle</h3>
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex flex-col items-center mb-6">
            <svg width="300" height="180" viewBox="0 0 300 180" className="overflow-visible drop-shadow-sm">
              {/* The Triangle */}
              <polygon 
                points={`50,150 250,150 ${xC},${yC}`} 
                fill="#ecfdf5" 
                stroke="#059669" 
                strokeWidth="3" 
                strokeLinejoin="round"
              />
              {/* Angle Labels */}
              <text x="40" y="165" className="fill-emerald-700 font-bold text-xs">A: {angleA}°</text>
              <text x="240" y="165" className="fill-emerald-700 font-bold text-xs">B: {angleB}°</text>
              <text x={xC} y={yC - 10} textAnchor="middle" className="fill-emerald-900 font-bold text-xs">C: {angleC}°</text>
            </svg>
            
            <div className="mt-4 px-6 py-2 bg-white rounded-full border border-emerald-100 shadow-sm text-sm">
              <span className="text-emerald-600 font-bold">{angleA}°</span> + 
              <span className="text-emerald-600 font-bold mx-1">{angleB}°</span> + 
              <span className="text-emerald-600 font-bold mx-1">{angleC}°</span> = 
              <span className="ml-2 font-black text-gray-800">180°</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-1"><label className="text-xs font-bold text-gray-500 uppercase">Angle A</label></div>
              <input 
                type="range" min="10" max={180 - angleB - 10} value={angleA} 
                onChange={(e) => setAngleA(parseInt(e.target.value))}
                className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1"><label className="text-xs font-bold text-gray-500 uppercase">Angle B</label></div>
              <input 
                type="range" min="10" max={180 - angleA - 10} value={angleB} 
                onChange={(e) => setAngleB(parseInt(e.target.value))}
                className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          
          <button 
            onClick={() => {setAngleA(60); setAngleB(60);}}
            className="mt-8 w-full py-2 text-xs font-bold tracking-widest text-emerald-700 uppercase border border-emerald-200 rounded hover:bg-emerald-50 transition-all"
          >
            Reset Equilateral
          </button>
        </div>
      </section>
    </div>
  );
};

export default GeometryDemo;