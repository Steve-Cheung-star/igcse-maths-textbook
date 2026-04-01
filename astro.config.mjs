import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import mermaid from 'astro-mermaid';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import vercel from '@astrojs/vercel';
import AutoImport from 'astro-auto-import';

export default defineConfig({
  output: 'server', 
  adapter: vercel(),

  integrations: [
    AutoImport({
      imports: [
        './src/components/AIGenerator.jsx',
        './src/components/SteveTip.astro',
        './src/components/MathPlot.jsx',
        {
          '@astrojs/starlight/components': ['Steps', 'Aside', 'Tabs', 'TabItem'],
        },
      ],
    }),
    mermaid(),
    react(),
    starlight({
      title: 'Intl. Maths 0607',
      // INSERT CUSTOM CSS HERE:
      customCss: [
        './src/assets/custom.css',
      ],
      components: {
        SocialIcons: './src/components/Tracker.astro',
      },
      head: [
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
          },
        },
      ],
      sidebar: [
        { label: '1. Number', autogenerate: { directory: '01-number' } },
        { label: '2. Algebra', autogenerate: { directory: '02-algebra' } },
        { label: '3. Functions', autogenerate: { directory: '03-functions' } },
        { label: '4. Coordinate Geometry', autogenerate: { directory: '04-coordinate-geometry' } },
        { label: '5. Geometry', autogenerate: { directory: '05-geometry' } },
        { label: '6. Mensuration', autogenerate: { directory: '06-mensuration' } },
        { label: '7. Trigonometry', autogenerate: { directory: '07-trigonometry' } },
        { label: '8. Transformations & Vectors', autogenerate: { directory: '08-transformations-vectors' } },
        { label: '9. Probability', autogenerate: { directory: '09-probability' } },
        { label: '10. Statistics', autogenerate: { directory: '10-statistics' } },
        {
          label: 'My Revision History',
          link: '/my-revision/',
        },
      ],
    }),
    mdx(),
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});