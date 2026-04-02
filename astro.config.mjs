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
        './src/components/SmartAIGenerator.astro',
        {
          '@astrojs/starlight/components': ['Steps', 'Aside', 'Tabs', 'TabItem'],
        },
      ],
    }),
    mermaid(),
    react(),
    starlight({
      title: 'Math Hub', 
      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
        replacesTitle: true,
      },
      customCss: [
        './src/assets/custom.css',
      ],
      components: {
        SocialIcons: './src/components/Tracker.astro',
        SiteTitle: './src/components/SiteTitle.astro',
        Sidebar: './src/components/Sidebar.astro',
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
        // --- IGCSE SECTION ---
        {
          label: 'IGCSE Mathematics (0607)',
          collapsed: true, 
          items: [
            { label: '1. Number', autogenerate: { directory: 'igcse/01-number' } },
            { label: '2. Algebra', autogenerate: { directory: 'igcse/02-algebra' } },
            { label: '3. Functions', autogenerate: { directory: 'igcse/03-functions' } },
            { label: '4. Coordinate Geometry', autogenerate: { directory: 'igcse/04-coordinate-geometry' } },
            { label: '5. Geometry', autogenerate: { directory: 'igcse/05-geometry' } },
            { label: '6. Mensuration', autogenerate: { directory: 'igcse/06-mensuration' } },
            { label: '7. Trigonometry', autogenerate: { directory: 'igcse/07-trigonometry' } },
            { label: '8. Transformations & Vectors', autogenerate: { directory: 'igcse/08-transformations-vectors' } },
            { label: '9. Probability', autogenerate: { directory: 'igcse/09-probability' } },
            { label: '10. Statistics', autogenerate: { directory: 'igcse/10-statistics' } },
            { label: '⭐ IGCSE History', link: '/igcse/my-revision/' },
          ],
        },

        // --- IB SECTION ---
        {
          label: 'IB Mathematics AI SL', // Updated label
          collapsed: true,
          items: [
            { label: '1. Number & Algebra', autogenerate: { directory: 'ib-aisl/01-number-and-algebra' } }, // Updated path
            { label: '2. Functions', autogenerate: { directory: 'ib-aisl/02-functions' } }, // Updated path
            // Add more IB directories as you create them
            { label: '⭐ AI SL History', link: '/ib-aisl/my-revision/' }, // Updated label & path
          ],
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