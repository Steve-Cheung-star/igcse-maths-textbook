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
        }
        // POWERPOINT MODE TOGGLE SCRIPT successfully deleted from here!
      ],
      sidebar: [
        {
          label: 'Year 7',
          collapsed: true,
          items: [
            { label: '1. Working Mathematically', autogenerate: { directory: 'year-7/01-working-mathematically' } }, // [cite: 1, 2, 3]
            { label: '2. Special Numbers', autogenerate: { directory: 'year-7/02-special-numbers' } }, // [cite: 18, 20, 21]
            { label: '3. Integers', autogenerate: { directory: 'year-7/03-integers' } }, // [cite: 35, 37, 38]
            { label: '4. Number Representations', autogenerate: { directory: 'year-7/04-number-representations' } }, // [cite: 54, 55, 56]
            { label: '5. Proportional Relationships', autogenerate: { directory: 'year-7/05-proportional-relationships' } }, // [cite: 79, 81, 82]
            { label: '6. Introduction to Algebra', autogenerate: { directory: 'year-7/06-introduction-to-algebra' } }, // [cite: 99, 101, 104]
            { label: '7. Lines, Angles & Polygons', autogenerate: { directory: 'year-7/07-lines-angles-and-polygons' } }, // [cite: 120, 122, 123]
          ],
        },
        {
          label: 'Year 8',
          collapsed: true,
          items: [
            { label: '1A. Fractions, Decimals & %ages', autogenerate: { directory: 'year-8/01a-fractions-decimals-percentages' } }, // [cite: 446]
            { label: '1B. Ratio & Proportion', autogenerate: { directory: 'year-8/01b-ratio-proportion' } }, // [cite: 467]
            { label: '2. Intro to Probability', autogenerate: { directory: 'year-8/02-intro-to-probability' } }, // [cite: 488]
            { label: '3. Patterning & Algebra', autogenerate: { directory: 'year-8/03-patterning-algebra' } }, // [cite: 507]
            { label: '4. Coordinate Geometry', autogenerate: { directory: 'year-8/04-coordinate-geometry' } }, // [cite: 526]
            { label: '5. Pythagoras Theorem', autogenerate: { directory: 'year-8/05-pythagoras-theorem' } }, // [cite: 548]
            { label: '6. Mensuration', autogenerate: { directory: 'year-8/06-mensuration' } }, // [cite: 563]
            { label: '7. Constructions & Transformations', autogenerate: { directory: 'year-8/07-constructions-transformations' } }, // [cite: 600]
          ],
        },
        {
          label: 'Year 9',
          collapsed: true,
          items: [
            { label: '1. Exponents and Roots', autogenerate: { directory: 'year-9/01-exponents-and-roots' } }, // 
            { label: '2. Advanced Percentages', autogenerate: { directory: 'year-9/02-advanced-percentages' } }, // 
            { label: '3. Algebraic Manipulation', autogenerate: { directory: 'year-9/03-algebraic-manipulation' } }, // 
            { label: '4. Patterns and Sequences', autogenerate: { directory: 'year-9/04-patterns-and-sequences' } }, // 
            { label: '5. Intro to Linear Functions', autogenerate: { directory: 'year-9/05-intro-to-linear-functions' } }, // 
            { label: '6. Geometry of 2-D and 3-D Shapes', autogenerate: { directory: 'year-9/06-geometry-2d-3d-shapes' } }, // 
            { label: '7. Similarity', autogenerate: { directory: 'year-9/07-similarity' } }, // 
            { label: '8. Statistics & Probability', autogenerate: { directory: 'year-9/08-statistics-and-probability' } }, // 
          ],
        },
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
            { label: 'Course Outline', link: 'igcse/course-outline' },
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