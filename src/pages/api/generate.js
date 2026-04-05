export const prerender = false;

import { GoogleGenerativeAI } from '@google/generative-ai';

export const POST = async ({ request }) => {
  try {
    if (!request.body) {
      return new Response(JSON.stringify({ error: "No data received" }), { status: 400 });
    }

    const data = await request.json();
    const { topic, difficulty } = data;

    const genAI = new GoogleGenerativeAI(import.meta.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

    const prompt = `Act as an expert IGCSE Math teacher. Generate one unique ${difficulty} level practice problem about ${topic}. 
Use standard LaTeX enclosed ONLY in single $ for ALL math equations. DO NOT use double $$ under any circumstances. 

CRITICAL MATH RULE: 
NEVER put plain text, English words, or units inside the $ delimiters. Only use $ for pure mathematical variables, numbers, and operators. 
- Correct: $r = 5$ cm
- Incorrect: $r = 5 \\text{ cm}$ or $r = 5 cm$

CRITICAL LINE BREAK RULE:
Markdown will render consecutive math equations on the same single line unless you force a break. If you have multiple equations stacking vertically under a single numbered step, you MUST place a <br> tag at the very end of the line.
- Correct:
   $x + 5 = 10$<br>
   $x = 5$
- Incorrect (Do NOT do this):
   $x + 5 = 10$
   $x = 5$

CRITICAL TABLE RULE:
If the problem requires a data table (e.g., for statistics, frequencies, or coordinates), you MUST format it as a standard Markdown table. Keep the math inside single $. 
Example format:
| Time ($t$ mins) | Frequency |
| :--- | :--- |
| $0 < t \\le 10$ | 8 |
| $10 < t \\le 20$ | 22 |

CRITICAL SVG SEQUENCE & RULES: 
1. Output the opening <svg viewBox="..."> tag with generous padding.
2. Draw all geometric shapes, lines, and paths.
3. Write ALL <text> labels for the math variables. DO NOT use LaTeX inside the SVG. Use plain text and unicode symbols (e.g., x², θ, π).
4. ONLY AFTER all text is written, output the closing </svg> tag. NEVER place a <text> tag after </svg>.
5. Do not have any empty lines in between <svg viewBox> and </svg>, make sure each line in between has 2 spaces in the front. 

CRITICAL FORMATTING RULE:
You MUST wrap your ENTIRE response inside a single markdown code block (using \`\`\`markdown and closing with \`\`\`). Do not write any conversational text outside of this code block. 

Inside the code block, format your response EXACTLY like this (Notice the 3-space indentation to ensure they align properly):
TOPIC: ${topic}
DIFFICULTY: ${difficulty}

PROBLEM: 
[Write the question here, including any SVG diagrams or Markdown tables]

SOLUTION: 
1. **[Brief description of the first step]:**<br>
   $[Primary equation for this step]$<br>
   $[Secondary equation for this step]$
   
2. **[Brief description of the next step]:**<br>
   $[Next equation]$
   
[...continue numbering and stacking equations as needed...]

**Final Answer:** [State the final mathematical answer clearly, keeping units outside the $]`;

    const result = await model.generateContent(prompt);
    let responseText = await result.response.text();

    // --- POST-PROCESSING FAILSAFE ---
    // Finds any <svg>...</svg> blocks and removes all line breaks/newlines inside them, 
    // ensuring ReactMarkdown doesn't break from empty lines.
    responseText = responseText.replace(/<svg[\s\S]*?<\/svg>/g, (svgBlock) => {
      return svgBlock.replace(/\s*\n\s*/g, ' ');
    });

    return new Response(JSON.stringify({ text: responseText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("API Route Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};