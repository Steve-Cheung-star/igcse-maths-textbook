import { getCollection } from 'astro:content';

export const prerender = true;

export async function GET() {
  const docs = await getCollection('docs', ({ id }) => id.startsWith('igcse/'));
  
  let text = `=== IGCSE KNOWLEDGE BASE ===\n`;
  text += `Total lessons: ${docs.length}\n\n`;

  docs.forEach(doc => {
    text += `\n\n========================================\n`;
    text += `TOPIC: ${doc.data.title}\n`;
    text += `========================================\n\n`;
    text += doc.body; 
    text += `\n\n`;
  });

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>IGCSE Syllabus Context</title>
        <meta charset="UTF-8">
      </head>
      <body>
        <pre style="word-wrap: break-word; white-space: pre-wrap; font-family: monospace;">${text}</pre>
      </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}