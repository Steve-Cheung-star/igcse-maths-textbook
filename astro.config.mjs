import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import mermaid from 'astro-mermaid';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import vercel from '@astrojs/vercel';
import AutoImport from 'astro-auto-import';
import { visit } from 'unist-util-visit';

// --- THE MDX-AWARE SLEDGEHAMMER PLUGIN ---
function cleanSearchIndex() {
  return (tree) => {
    // Visit all nodes to catch both KaTeX (HTML) and your inline SVGs (MDX JSX)
    visit(tree, (node) => {
      
      // We only care about HTML elements or MDX JSX elements
      if (['element', 'mdxJsxFlowElement', 'mdxJsxTextElement'].includes(node.type)) {
        
        // --- 1. THE MATH SLEDGEHAMMER (KaTeX generates standard 'element' nodes) ---
        if (node.type === 'element' && node.properties) {
          let classStr = '';
          if (Array.isArray(node.properties.className)) {
            classStr = node.properties.className.join(' ');
          } else if (node.properties.className) {
            classStr = String(node.properties.className);
          }

          // If the class contains ANY KaTeX keywords, blind the search engine
          if (classStr.match(/(katex|math|mord|base|strut|mrel|mspace|mbin|mopen|mclose|mpunct)/)) {
            node.properties['data-pagefind-ignore'] = 'true';
          }
        }

        // --- 2. THE SVG CLEANER (Your SVGs use MDX JSX nodes) ---
        // standard HTML uses node.tagName, MDX uses node.name
        const tagName = node.tagName || node.name; 
        
        // Target drawing shapes and grids, but deliberately leave out 'text' and 'svg'
        const svgJunk = ['path', 'rect', 'circle', 'line', 'polygon', 'polyline', 'defs', 'style', 'pattern'];
        
        if (svgJunk.includes(tagName)) {
          if (node.type === 'element') {
            // Standard HTML attribute injection
            node.properties = node.properties || {};
            node.properties['data-pagefind-ignore'] = 'true';
          } else {
            // MDX JSX attribute injection
            node.attributes = node.attributes || [];
            node.attributes.push({
              type: 'mdxJsxAttribute',
              name: 'data-pagefind-ignore',
              value: 'true'
            });
          }
        }
      }
    });
  };
}
// -----------------------------------------

export default defineConfig({
  // MUST be static for Starlight's built-in Pagefind to crawl the files
  output: 'static', 
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
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    // Inject the Sledgehammer right after KaTeX processes the math
    rehypePlugins: [rehypeKatex, cleanSearchIndex],
  },
});