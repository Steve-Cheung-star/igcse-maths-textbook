// src/utils/sidebarHelpers.ts

const greetings = [
  "Not another maths page...", "Calculations & Egg Tarts", "The Variable Graveyard",
  "𝜋: Tasty, but Infinite", "Solve for Why?", "Keep Calm and Carry One",
  "Warning: High Logic Zone", "𝑥 is missing. Call the police.",
  "Square Roots & Salty Tears", "Fancy a bit of Algebra?",
  "Please mind the gap.", "Humidity: 99%. Brain: 1%."
];

export const getRandomGreeting = () => {
  return greetings[Math.floor(Math.random() * greetings.length)];
};

export const filterSidebar = (currentSidebar: any[], url: URL, isTeacherMode: boolean) => {
  const isIB = url.pathname.includes('/ib-aisl');
  const isYear9 = url.pathname.includes('/year-9'); // <-- Added Year 9 check
  const isYear8 = url.pathname.includes('/year-8'); 
  const isYear7 = url.pathname.includes('/year-7'); 
  
  return currentSidebar.filter(item => {
    if (isTeacherMode) return true;
    
    const folderName = item.label || '';
    
    // Check which section we are in and return the matching sidebar
    if (isYear9) return folderName.includes('Year 9'); // <-- Route to Year 9
    if (isYear8) return folderName.includes('Year 8'); 
    if (isYear7) return folderName.includes('Year 7'); 
    if (isIB) return folderName.includes('IB Mathematics AI SL');
    
    // Default fallback
    return folderName.includes('IGCSE Mathematics');
  });
};