// src/utils/sidebarHelpers.ts

const greetings = [
  /* --- The Classics --- */
  "Not another maths page...", 
  "Calculations & Egg Tarts", 
  "The Variable Graveyard",
  "𝜋: Tasty, but Infinite", 
  "Solve for Why?", 
  "Keep Calm and Carry One",
  "𝑥 is missing. Call the Police.", 
  "Square Roots & Salty Tears", 
  "Please mind the gap.", 
  "Humidity: 99%. Brain: 1%.",

  /* --- Short Math Horror & Teacher-Speak --- */
  "Cyclic dread.", 
  "nth term of pain.", 
  "Reject the Null.", 
  "p < 0.05. Cry.", 
  "Show working!", 
  "Units please.", 
  "Read the Question.", 
  "GDC ≠ Crystal Ball.",
  "Paper 4 vibes.",
  "Milk Tea logic."
];

export const getRandomGreeting = () => {
  return greetings[Math.floor(Math.random() * greetings.length)];
};

export const filterSidebar = (currentSidebar: any[], url: URL, isTeacherMode: boolean) => {
  // Identify the specific course from the URL
  const isIBAASL = url.pathname.includes('/ib-aasl');
  const isIBAISL = url.pathname.includes('/ib-aisl'); // Renamed from isIB for clarity
  const isYear9 = url.pathname.includes('/year-9');
  const isYear8 = url.pathname.includes('/year-8'); 
  const isYear7 = url.pathname.includes('/year-7'); 
  
  return currentSidebar.filter(item => {
    if (isTeacherMode) return true;
    
    const folderName = item.label || '';
    
    // Priority routing
    if (isYear9) return folderName.includes('Year 9');
    if (isYear8) return folderName.includes('Year 8'); 
    if (isYear7) return folderName.includes('Year 7'); 
    
    // Check for specific IB Syllabus
    if (isIBAASL) return folderName.includes('IB Mathematics AA SL');
    if (isIBAISL) return folderName.includes('IB Mathematics AI SL');
    
    // Default fallback
    return folderName.includes('IGCSE Mathematics');
  });
};