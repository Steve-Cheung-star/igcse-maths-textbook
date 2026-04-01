import { GoogleGenerativeAI } from '@google/generative-ai';

const prerender = false;
const POST = async ({ request }) => {
  try {
    if (!request.body) {
      return new Response(JSON.stringify({ error: "No data received" }), { status: 400 });
    }
    const data = await request.json();
    const { topic, difficulty } = data;
    const genAI = new GoogleGenerativeAI("AIzaSyDRanV0VLuWII20SUsW4m4iv9t8X5bSOB4");
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const prompt = `Act as an expert IGCSE Math teacher. Generate one unique ${difficulty} level practice problem about ${topic}. 
    Use standard LaTeX enclosed in single $ for inline math and double $$ for block math. 
    If the question involves geometry, trigonometry, or statistics, generate a clean, responsive, inline <svg> diagram to illustrate the problem. 
    
    CRITICAL SVG RULES: 
    1. The <text> tags for math labels MUST be placed INSIDE the opening <svg> and closing </svg> tags. Never place text or shapes outside the SVG block.
    2. Always use a generous 'viewBox' with plenty of padding (e.g., viewBox="0 0 400 300" for a 100x100 shape).
    3. Ensure ALL coordinates fit strictly inside this viewBox.
    4. Output the raw SVG code directly inside the Markdown text.
    5. Do not have any empty lines in between <svg viewBox> and </svg>, make sure each line in between has 2 spaces in the front. 
    
    Do not use introductory text. Format your response EXACTLY like this:
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
    responseText = responseText.replace(/<svg[\s\S]*?<\/svg>/g, (svgBlock) => {
      return svgBlock.replace(/\s*\n\s*/g, " ");
    });
    return new Response(JSON.stringify({ text: responseText }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("API Route Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
