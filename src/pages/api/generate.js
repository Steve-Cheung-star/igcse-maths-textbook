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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Act as an expert IGCSE Math teacher. Generate one unique ${difficulty} level practice problem about ${topic}. 
    Use standard LaTeX enclosed in single $ for inline math and double $$ for block math. 
    Do not use introductory text. Format your response EXACTLY like this:
    PROBLEM: [Write the question here]
    SOLUTION: [Write the step-by-step solution here]`;

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