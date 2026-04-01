import{j as e}from"./jsx-runtime.u17CrQMm.js";import{r as a}from"./index.B02hbnpo.js";import{M as j,r as I,a as N,b as T}from"./index.lkQP_T5K.js";function z({topic:s,difficulty:n="IGCSE Extended"}){const[l,h]=a.useState(""),[u,x]=a.useState(""),[i,g]=a.useState(!1),[E,b]=a.useState(0),[y,c]=a.useState(null),[C,f]=a.useState(!1),[L,v]=a.useState(!1),w=["Connecting to Math Engine...","Analyzing IGCSE Syllabus...","Drafting diagram SVGs...","Hardening the difficulty...","Formatting LaTeX expressions...","Almost there..."];a.useEffect(()=>{let r;return i?r=setInterval(()=>{b(t=>(t+1)%w.length)},1500):b(0),()=>clearInterval(r)},[i]);const P=(r,t)=>{try{const o=JSON.parse(localStorage.getItem("igcse_ai_history")||"[]"),d={id:crypto.randomUUID(),date:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}),topic:s,difficulty:n,question:r,feedback:t,bookmarked:!1};localStorage.setItem("igcse_ai_history",JSON.stringify([d,...o])),f(!0)}catch(o){console.error("Failed to save to history:",o)}},R=()=>`Act as an expert IGCSE Math teacher. Generate one unique ${n} level practice problem about ${s}. 
Use standard LaTeX enclosed in single $ for inline math and double $$ for block math. 
If the question involves geometry, trigonometry, or statistics, generate a clean, responsive, inline <svg> diagram to illustrate the problem. 

CRITICAL SVG SEQUENCE & RULES: 
1. Output the opening <svg viewBox="..."> tag with generous padding.
2. Draw all geometric shapes, lines, and paths.
3. Write ALL <text> labels for the math variables.
4. ONLY AFTER all text is written, output the closing </svg> tag. NEVER place a <text> tag after </svg>.
5. Do not have any empty lines in between <svg viewBox> and </svg>, make sure each line in between has 2 spaces in the front. 

CRITICAL FORMATTING RULE:
You MUST wrap your ENTIRE response inside a single markdown code block (using \`\`\`markdown and closing with \`\`\`). Do not write any conversational text outside of this code block. 

Inside the code block, format your response EXACTLY like this:
TOPIC: ${s}
DIFFICULTY: ${n}

PROBLEM: 
[Write the question here, including any SVG diagrams]

SOLUTION: 
**Step 1:** [Explain the first logical step]
**Step 2:** [Explain the next step]
[...continue with as many steps as needed...]
**Final Answer:** [State the final mathematical answer clearly]`,O=()=>{navigator.clipboard.writeText(R()),v(!0),setTimeout(()=>v(!1),2e3)},S=async(r=0)=>{r===0?(g(!0),h(""),x(""),c(null),f(!1)):c("Network hiccup! Retrying automatically... 🔄");try{const t=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic:s,difficulty:n})}),o=await t.json();if(!t.ok)throw new Error(o.error);const d=o.text.match(/PROBLEM:([\s\S]*?)SOLUTION:/i),k=o.text.match(/SOLUTION:([\s\S]*)/i);let m=d?d[1].trim():'Error: Could not find "PROBLEM:" section.',p=k?k[1].trim():"Solution unavailable.";m=m.replace(/^```markdown/i,"").replace(/```$/,"").trim(),p=p.replace(/^```markdown/i,"").replace(/```$/,"").trim(),h(m),x(p),c(null),P(m,p),g(!1)}catch{r<1?(console.warn(`Attempt ${r+1} failed. Retrying...`),await S(r+1)):(c('Connection timed out. Please try clicking "Practice Now" again.'),g(!1))}};return e.jsxs("div",{className:"ai-container-card",children:[e.jsx("style",{children:`
        .ai-container-card {
          margin: 3rem 0;
          border: 1px solid var(--sl-color-gray-5);
          border-radius: 12px;
          background-color: var(--sl-color-bg-nav);
          overflow: hidden;
          box-shadow: var(--sl-shadow-md);
        }

        .ai-card-header {
          padding: 0.8rem 1.25rem;
          background: var(--sl-color-gray-6);
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--sl-color-gray-5);
        }

        .ai-badge {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
          color: var(--sl-color-accent-high);
          border: 1px solid var(--sl-color-accent-low);
        }

        .ai-card-body { padding: 1.5rem; }

        .ai-btn-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .ai-button-group {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .ai-refresh-btn {
          background: var(--sl-color-accent);
          color: var(--sl-color-black);
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          min-width: 140px;
          transition: transform 0.1s, opacity 0.2s;
        }
        
        .ai-refresh-btn:active { transform: scale(0.98); }
        .ai-refresh-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .ai-export-btn {
          background: transparent;
          color: var(--sl-color-gray-2);
          border: 1px solid var(--sl-color-gray-4);
          padding: 0.6rem 1rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        
        .ai-export-btn:hover {
          background: var(--sl-color-gray-6);
          border-color: var(--sl-color-gray-3);
          color: var(--sl-color-white);
        }
        
        .ai-export-btn:active { transform: scale(0.98); }

        .ai-loader-container {
          flex-grow: 1;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: 0.85rem;
          color: var(--sl-color-gray-3);
        }

        .ai-pulse-dot {
          width: 8px; height: 8px;
          background-color: var(--sl-color-accent);
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.4; }
          100% { transform: scale(0.9); opacity: 1; }
        }

        .ai-content-inner {
          background: var(--sl-color-gray-6);
          border-radius: 8px;
          padding: 1.5rem;
          border-left: 4px solid var(--sl-color-accent);
          animation: slideIn 0.4s ease-out;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .math-renderer :global(p) { margin-bottom: 0.8rem; }
        
        .math-renderer :global(svg) {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 1.5rem auto;
          background-color: white; 
          border-radius: 8px;
          padding: 1rem;
          box-shadow: inset 0 0 0 1px var(--sl-color-gray-4);
          overflow: visible;
        }

        .math-renderer :global(.katex-display) {
          overflow-x: auto;
          overflow-y: hidden;
          max-width: 100%;
          padding: 0.5rem 0;
          font-size: 1.05em;
        }
        .math-renderer :global(.katex-display::-webkit-scrollbar) { height: 6px; }
        .math-renderer :global(.katex-display::-webkit-scrollbar-thumb) {
          background: var(--sl-color-gray-5); border-radius: 4px;
        }
      `}),e.jsxs("div",{className:"ai-card-header",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.6rem"},children:[e.jsx("span",{children:"🤖"}),e.jsx("span",{style:{fontWeight:600,fontSize:"0.9rem"},children:s})]}),e.jsx("span",{className:"ai-badge",children:n})]}),e.jsxs("div",{className:"ai-card-body",children:[e.jsxs("div",{className:"ai-btn-row",children:[e.jsx("div",{className:"not-content",children:e.jsxs("div",{className:"ai-button-group",children:[e.jsx("button",{className:"ai-refresh-btn",onClick:()=>S(0),disabled:i,children:l?"Try Another":"Practice Now"}),e.jsx("button",{className:"ai-export-btn",onClick:O,title:"Copy exact prompt to paste in Gemini",children:L?"✓ Copied!":"📋 Copy Prompt"}),C&&e.jsx("span",{style:{fontSize:"0.8rem",color:"var(--sl-color-success-high)",fontWeight:"600",animation:"slideIn 0.3s ease-out",marginLeft:"0.5rem"},children:"✓ Auto-saved"})]})}),i&&e.jsxs("div",{className:"ai-loader-container",children:[e.jsx("div",{className:"ai-pulse-dot"}),e.jsx("span",{children:w[E]})]}),!i&&!l&&e.jsx("span",{style:{fontSize:"0.8rem",color:"var(--sl-color-gray-4)"},children:"Generate a unique exam-style question with diagrams"})]}),y&&e.jsxs("div",{style:{background:"var(--sl-color-red-low)",color:"var(--sl-color-red-high)",padding:"0.8rem",borderRadius:"6px",fontSize:"0.85rem",fontWeight:"bold",marginBottom:"1rem",border:"1px solid var(--sl-color-red-high)"},children:[y,e.jsx("div",{style:{fontSize:"0.75rem",fontWeight:"normal",marginTop:"0.3rem",color:"var(--sl-color-gray-2)"},children:'Hint: You can click "Copy Prompt" and paste it directly into Gemini or ChatGPT!'})]}),l&&e.jsxs("div",{className:"ai-content-inner",children:[e.jsx("div",{className:"math-renderer",children:e.jsx(j,{remarkPlugins:[T],rehypePlugins:[I,N],children:l})}),u&&e.jsxs("details",{style:{marginTop:"1.5rem",borderTop:"1px dashed var(--sl-color-gray-5)",paddingTop:"1rem"},children:[e.jsxs("summary",{style:{cursor:"pointer",fontSize:"0.85rem",fontWeight:"700",color:"var(--sl-color-accent-high)",listStyle:"none",display:"flex",alignItems:"center",gap:"0.5rem"},children:[e.jsx("span",{children:"▶"})," Reveal Detailed Solution"]}),e.jsx("div",{className:"math-renderer",style:{marginTop:"1rem",background:"var(--sl-color-bg-nav)",padding:"1.25rem",borderRadius:"8px",borderLeft:"3px solid var(--sl-color-accent-high)"},children:e.jsx(j,{remarkPlugins:[T],rehypePlugins:[I,N],children:u})})]})]})]})]})}export{z as default};
