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

// --- THE NUCLEAR AST SLEDGEHAMMER ---
function cleanSearchIndex() {
  return (tree) => {
    const nodesToRemove = [];

    visit(tree, (node, index, parent) => {
      // We only care about HTML elements or MDX JSX elements
      if (['element', 'mdxJsxFlowElement', 'mdxJsxTextElement'].includes(node.type)) {
        const tagName = node.tagName || node.name;

        // 1. PHYSICAL AMPUTATION
        // The <annotation> tag holds the raw "\text{ m }" string. We delete it entirely.
        if (tagName === 'annotation') {
          nodesToRemove.push({ parent, index });
          return; // Stop processing this node
        }

        // 2. MATH NUKE (The "all" override)
        if (node.type === 'element' && node.properties) {
          const classStr = Array.isArray(node.properties.className)
            ? node.properties.className.join(' ')
            : String(node.properties.className || '');

          if (classStr.match(/(katex|math|mord|base|strut|mrel|mspace|mbin|mopen|mclose|mpunct)/)) {
            // "all" forces Pagefind to completely erase this from memory
            node.properties['data-pagefind-ignore'] = 'all';
          }
        }

        // 3. SVG NUKE
        const svgJunk = ['path', 'rect', 'circle', 'line', 'polygon', 'polyline', 'defs', 'style', 'pattern'];
        if (svgJunk.includes(tagName)) {
          if (node.type === 'element') {
            node.properties = node.properties || {};
            node.properties['data-pagefind-ignore'] = 'all';
          } else {
            node.attributes = node.attributes || [];
            node.attributes.push({ type: 'mdxJsxAttribute', name: 'data-pagefind-ignore', value: 'all' });
          }
        }
      }
    });

    // Execute the deletions backwards so array indices don't shift
    for (let i = nodesToRemove.length - 1; i >= 0; i--) {
      const { parent, index } = nodesToRemove[i];
      if (parent && parent.children) {
        parent.children.splice(index, 1);
      }
    }
  };
}
// ------------------------------------

export default defineConfig({
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
    rehypePlugins: [rehypeKatex, cleanSearchIndex],
  },
});