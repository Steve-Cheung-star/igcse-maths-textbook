import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import mermaid from 'astro-mermaid';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import vercel from '@astrojs/vercel';
import AutoImport from 'astro-auto-import';
import { visit } from 'unist-util-visit'; // Used to manipulate the HTML during build

// --- THE SLEDGEHAMMER PLUGIN ---
// This runs during the build to hide math code and SVG shapes from Pagefind
function cleanSearchIndex() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (!node.properties) return;

      // 1. NUKE ALL MATH FROM SEARCH
      if (node.properties.className) {
        // Handle Astro's class arrays safely
        const classes = Array.isArray(node.properties.className) 
          ? node.properties.className 
          : String(node.properties.className).split(' ');
        
        // If the element has any class containing 'katex' or 'math', blind the search engine to it
        if (classes.some(c => String(c).includes('katex') || String(c).includes('math'))) {
          node.properties['data-pagefind-ignore'] = 'true';
        }
      }

      // 2. CLEAN UP SVGs
      // Ignore the drawing instructions but leave <text> and <tspan> alone
      const svgJunk = ['path', 'rect', 'circle', 'line', 'polygon', 'polyline', 'defs', 'style'];
      if (svgJunk.includes(node.tagName)) {
        node.properties['data-pagefind-ignore'] = 'true';
      }
    });
  };
}
// -------------------------------

export default defineConfig({
  // MUST be static for Starlight's Pagefind to crawl the files!
  output: 'static', 
  adapter: vercel(),

  integrations: [
    AutoImport({
      imports: [
        // Your custom components
        './src/components/AIGenerator.jsx',
        './src/components/SteveTip.astro',
        './src/components/MathPlot.jsx',
        // Starlight built-ins
        {
          '@astrojs/starlight/components': ['Steps', 'Aside', 'Tabs', 'TabItem'],
        },
      ],
    }), 
    mermaid(), 
    react(), 
    starlight({
      title: 'Intl. Maths 0607',
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
    mdx()
    // Notice: astro-pagefind is removed because Starlight does it automatically!
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    // Add our custom cleaner right AFTER KaTeX processes the math
    rehypePlugins: [rehypeKatex, cleanSearchIndex],
  },
});