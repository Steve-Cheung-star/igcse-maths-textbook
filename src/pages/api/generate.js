export const prerender = false;

import { GoogleGenerativeAI } from '@google/generative-ai';

export const POST = async ({ request }) => {
  try {
    // Safety check: Is there actually a body?
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
    
    CRITICAL SVG RULES: 
    1. The <text> tags for math labels MUST be placed INSIDE the opening <svg> and closing </svg> tags. Never place text or shapes outside the SVG block.
    2. Always use a generous 'viewBox' with plenty of padding (e.g., viewBox="0 0 400 300" for a 100x100 shape).
    3. Ensure ALL coordinates fit strictly inside this viewBox.
    4. Output the raw SVG code directly inside the Markdown text.
    
    Do not use introductory text. Format your response EXACTLY like this:
    PROBLEM: 
    [Write the question here, including any SVG diagrams]
    
    SOLUTION: 
    **Step 1:** [Explain the first logical step]
    
    **Step 2:** [Explain the next step]
    
    [...continue with as many steps as needed...]
    
    **Final Answer:** [State the final mathematical answer clearly]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return new Response(JSON.stringify({ text: response.text() }), { 
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