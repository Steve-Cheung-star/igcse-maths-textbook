import fs from 'fs';

// 1. Load your current flashcards
const data = JSON.parse(fs.readFileSync('igcse.json', 'utf8'));

// 2. Loop through every card and map it to Syllabus Express based on its URL
data.forEach(card => {
  const url = card.lesson_url;
  
  if (url.includes('/17-surds/')) card.topic = "Surds";
  else if (url.includes('/02-sets-and-venn-diagrams/')) card.topic = "Sets";
  else if (url.includes('/07-indices-i/') || url.includes('/04-indices-ii/') || url.includes('/06-inequalities/')) card.topic = "Algebra II";
  else if (url.includes('/01-number/')) card.topic = "Prior Learning"; 
  else if (url.includes('/02-algebra/01-') || url.includes('/02-algebra/02-') || url.includes('/02-algebra/03-') || url.includes('/02-algebra/05-')) card.topic = "Algebra I";
  else if (url.includes('/02-algebra/07-sequences/')) card.topic = "Sequences";
  else if (url.includes('/02-algebra/08-proportion/')) card.topic = "Variation";
  else if (url.includes('/04-coordinate-geometry/')) card.topic = "Coordinate Geometry";
  else if (url.includes('/05-geometry/06-') || url.includes('/05-geometry/07-')) card.topic = "Circle Geometry";
  else if (url.includes('/05-geometry/')) card.topic = "Lines, Angles & Polygons"; 
  else if (url.includes('/06-mensuration/')) card.topic = "Measures";
  else if (url.includes('/07-trigonometry/01-pythagoras-theorem/')) card.topic = "Pythagoras' Theorem";
  else if (url.includes('/07-trigonometry/03-') || url.includes('/07-trigonometry/04-')) card.topic = "Trigonometry II";
  else if (url.includes('/07-trigonometry/')) card.topic = "Trigonometry I"; 
  else if (url.includes('/03-functions/06-transforming-graphs')) card.topic = "Transforming Functions";
  else if (url.includes('/03-functions/07-logarithmic')) card.topic = "Logarithms";
  else if (url.includes('/03-functions/')) card.topic = "Introduction to Functions"; 
  else if (url.includes('/08-transformations-vectors/01-')) card.topic = "Transforming Shapes";
  else if (url.includes('/08-transformations-vectors/')) card.topic = "Vectors"; 
  else if (url.includes('/09-probability/')) card.topic = "Probability";
  else if (url.includes('/10-statistics/07-scatter')) card.topic = "Statistics I (Correlation)";
  else if (url.includes('/10-statistics/')) card.topic = "Statistics II (Discrete & Continuous)";
  else card.topic = "Unmapped"; // Fallback just in case
});

// 3. Save the newly mapped data
fs.writeFileSync('igcse-mapped.json', JSON.stringify(data, null, 2));
console.log('✅ Remapping complete! Saved as igcse-mapped.json');