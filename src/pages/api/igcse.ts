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

  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}