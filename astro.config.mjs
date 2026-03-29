import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import vercel from '@astrojs/vercel'; // <--- MUST HAVE THIS

export default defineConfig({
  output: 'static', 
  adapter: vercel({
    entrypointResolution: 'auto'
  }),
  integrations: [
    starlight({
      title: 'IGCSE Maths Textbook',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/your-username/your-repo' },
      ],
      sidebar: [
        {
          label: '1. Number',
          items: [
            { label: '1.1 Types of Numbers', slug: '01-number/01-types' },
            { label: '1.2 Sets and Venn Diagrams', slug: '01-number/02-sets' },
          ],
        },
      ],
    }),
  ],
});