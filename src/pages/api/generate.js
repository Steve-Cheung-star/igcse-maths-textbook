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
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `Act as an expert IGCSE Math teacher. Generate one unique ${difficulty} level practice problem about ${topic}. 
Use standard LaTeX enclosed in single $ for inline math and double $$ for block math. 
If the question involves geometry, trigonometry, or statistics, generate a clean, responsive, inline <svg> diagram to illustrate the problem. 

CRITICAL SVG SEQUENCE & RULES: 
1. Output the opening <svg viewBox="..."> tag with generous padding.
2. Draw all geometric shapes, lines, and paths.
3. Write ALL <text> labels for the math variables. DO NOT use LaTeX inside the SVG. Use plain text and unicode symbols (e.g., x², θ, π).
4. ONLY AFTER all text is written, output the closing </svg> tag. NEVER place a <text> tag after </svg>.
5. Do not have any empty lines in between <svg viewBox> and </svg>, make sure each line in between has 2 spaces in the front. 

CRITICAL FORMATTING RULE:
You MUST wrap your ENTIRE response inside a single markdown code block (using \`\`\`markdown and closing with \`\`\`). Do not write any conversational text outside of this code block. 

Inside the code block, format your response EXACTLY like this:
TOPIC: ${topic}
DIFFICULTY: ${difficulty}

PROBLEM: 
[Write the question here, including any SVG diagrams]

SOLUTION: 
**Step 1:** [Explain the first logical step]
**Step 2:** [Explain the next step]
[...continue with as many steps as needed...]
**Final Answer:** [State the final mathematical answer clearly]`;

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