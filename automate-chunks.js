import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: 'gemini-3.1-flash-lite-preview' 
});

const INPUT_DIR = './src/content/docs/igcse';
const OUTPUT_DIR = './src/content/docs/igcse-processed';

const SYSTEM_PROMPT = `
You are a specialized MDX post-processor. You must transform the file structure without losing any data.

### CRITICAL: FRONTMATTER PROTECTION
The file starts with a YAML header (e.g., --- title: ... ---). 
You MUST NOT delete, modify, or move these lines. They must remain at the very top of the output exactly as they are.

### TASK 1: THE LESSON CHUNKING
Wrap every conceptual block (Header + content) in <section className="lesson-chunk"> tags. 
DO NOT leave any content outside of a lesson-chunk section except for the frontmatter and import statements.

### TASK 2: TARGETING THE EXAMPLES (THE PRIORITY)
You are missing the examples in the main body. Look for these patterns:
1. Bold markers: **Example:** or **Example 1**
2. Headers: #### Example or ### Example
3. Content following these markers: This is the "Solution" or "Method".

YOUR JOB:
- Leave the "Example" heading and the "Question" text visible.
- Wrap the entire "Solution" or "Method" (including any <Steps> components or calculation blocks) inside a <details> tag.
- Create a highly descriptive <summary> tag based on the math being solved.

### STRICT RULES:
- DO NOT summarize or shorten the text. Every single word of the original must be present.
- DO NOT touch SVGs or Math syntax ($/$$).
- DO NOT wrap the entire file in a markdown code block.
- DO NOT ignore examples in the main content to focus on practice problems.

Example Target:
#### Example 1: Finding Gradient
Find the gradient of...
<details>
  <summary>Detailed Solution: Using the coordinate geometry formula to calculate the slope</summary>
  [Original text here]
</details>
`;

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function processFiles() {
  try {
    const files = await fs.readdir(INPUT_DIR, { recursive: true });
    const mdxFiles = files.filter(f => f.endsWith('.mdx'));

    console.log(`Processing ${mdxFiles.length} files...`);

    for (const file of mdxFiles) {
      const inputPath = path.join(INPUT_DIR, file);
      const outputPath = path.join(OUTPUT_DIR, file);
      
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      if (await fileExists(outputPath)) {
        console.log(`⏭️  Skipped: ${file}`);
        continue; 
      }

      console.log(`⏳ Processing: ${file}...`);
      const content = await fs.readFile(inputPath, 'utf-8');

      try {
        // We remind the AI specifically about the content of THIS file
        const prompt = `${SYSTEM_PROMPT}\n\nINPUT MDX CONTENT:\n${content}`;
        const result = await model.generateContent(prompt);
        let newContent = result.response.text().trim();
        
        // Clean up accidental markdown wrapping
        newContent = newContent.replace(/^```[a-z]*\n/i, '').replace(/```$/i, '');

        // FINAL CHECK: If the AI forgot the frontmatter, we force-reattach it 
        // (A secondary safety net)
        if (!newContent.startsWith('---') && content.startsWith('---')) {
            const originalFrontmatter = content.match(/^---[\s\S]*?---/);
            if (originalFrontmatter) {
                newContent = originalFrontmatter[0] + "\n" + newContent;
            }
        }

        await fs.writeFile(outputPath, newContent, 'utf-8');
        console.log(`✅ Saved: ${file}`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (aiError) {
        console.error(`❌ Error on ${file}:`, aiError.message);
      }
    }
  } catch (err) {
    console.error("Critical Error:", err);
  }
}

processFiles();