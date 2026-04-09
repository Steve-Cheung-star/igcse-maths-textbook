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
        './src/components/FormulaBox.astro',
        './src/components/StudentName.astro',
        './src/components/TeacherNotes.astro',
        {
          '@astrojs/starlight/components': ['Steps', 'Aside', 'Tabs', 'TabItem'],
        },
      ],
    }),
    mermaid(),
    react(),
    starlight({
      title: '∴ 6<7',
      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
        replacesTitle: true,
      },
      customCss: [
        './src/assets/custom.css',
        './src/assets/bento-mode.css', // Added Bento Styles
      ],
      components: {
        SocialIcons: './src/components/Tracker.astro',
        SiteTitle: './src/components/SiteTitle.astro',
        Sidebar: './src/components/Sidebar.astro',
        PageTitle: './src/components/PageHeader.astro',
        PageFrame: './src/components/CustomPageFrame.astro',
        ContentPanel: './src/components/SearchTagInjector.astro',
      },
      head: [
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
          },
        },
        // --- POWERPOINT MODE TOGGLE SCRIPT ---
        {
          tag: 'script',
          content: `
            (function() {
              const toggleBento = () => {
                const isBento = document.documentElement.getAttribute('data-mode') === 'bento';
                const newState = isBento ? 'normal' : 'bento';
                document.documentElement.setAttribute('data-mode', newState);
                localStorage.setItem('whiteboard-layout', newState);
              };

              // Persistent state on page change
              if (localStorage.getItem('whiteboard-layout') === 'bento') {
                document.documentElement.setAttribute('data-mode', 'bento');
              }

              window.addEventListener('keydown', (e) => {
                // Mac Shortcut: Control + Option + P
                if (e.ctrlKey && e.altKey && e.code === 'KeyP') {
                  e.preventDefault();
                  toggleBento();
                }
              });
            })();
          `,
        },
      ],
      sidebar: [
        {
          label: 'IGCSE Mathematics (0607)',
          collapsed: true,
          items: [
            { label: '⭐ My Revision', link: '/igcse/my-revision/' },
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
          ],
        },
        {
          label: 'IB Mathematics AI SL',
          collapsed: true,
          items: [
            { label: '⭐ My Revision', link: '/ib-aisl/my-revision/' },            
            { label: '1. Number & Algebra', autogenerate: { directory: 'ib-aisl/01-number-and-algebra' } },
            { label: '2. Functions', autogenerate: { directory: 'ib-aisl/02-functions' } },
            { label: '3. 3D Geometry & Trigonometry', autogenerate: { directory: 'ib-aisl/03-geometry-and-trigonometry' } },
            { label: '4. Statistics & Probability', autogenerate: { directory: 'ib-aisl/04-statistics-and-probability' } },
            { label: '5. Calculus', autogenerate: { directory: 'ib-aisl/05-calculus' } },
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