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
  
  return currentSidebar.filter(item => {
    if (isTeacherMode) return true;
    const folderName = item.label || '';
    if (isIB) return folderName.includes('IB Mathematics AI SL');
    return folderName.includes('IGCSE Mathematics');
  });
};