import{j as e}from"./jsx-runtime.u17CrQMm.js";import{r as t}from"./index.B02hbnpo.js";import{M as P,r as B,a as E,b as D}from"./index.lkQP_T5K.js";function X(){const[s,l]=t.useState([]),[M,H]=t.useState(!1),[n,W]=t.useState(!1),[y,u]=t.useState(null),[p,A]=t.useState(""),[f,g]=t.useState(10),[h,v]=t.useState(!1),[k,S]=t.useState(""),[j,U]=t.useState("IGCSE Extended"),[a,I]=t.useState(""),[w,C]=t.useState("");t.useEffect(()=>{const r=JSON.parse(localStorage.getItem("igcse_ai_history")||"[]");l(r),H(!0)},[]);const _=r=>{const o=s.map(i=>i.id===r?{...i,bookmarked:!i.bookmarked}:i);l(o),localStorage.setItem("igcse_ai_history",JSON.stringify(o))},q=r=>{if(window.confirm("Delete this specific entry?")){const o=s.filter(i=>i.id!==r);l(o),localStorage.setItem("igcse_ai_history",JSON.stringify(o))}},F=()=>{window.confirm("Delete all saved questions?")&&(localStorage.removeItem("igcse_ai_history"),l([]))},G=r=>{const o=`TOPIC: ${r.topic}
DIFFICULTY: ${r.difficulty}

PROBLEM:
${r.question}

SOLUTION:
${r.feedback}`;navigator.clipboard.writeText(o).then(()=>{u(r.id),setTimeout(()=>u(null),2e3)})},$=()=>{if(C(""),!a.trim()){C("Please paste the AI response.");return}const r=a.match(/TOPIC:\s*(.+)/i),o=a.match(/DIFFICULTY:\s*(.+)/i),i=r?r[1].trim():k.trim()||"Imported Problem",b=o?o[1].trim():j,m=a.match(/PROBLEM:([\s\S]*?)SOLUTION:/i),R=a.match(/SOLUTION:([\s\S]*)/i);let c='Error: Could not find "PROBLEM:" section.',d='Solution unavailable (Did not find "SOLUTION:" marker).';if(m&&R)c=m[1].trim(),d=R[1].trim();else{const x=a.split(/SOLUTION:/i);c=x[0].replace(/PROBLEM:/i,"").trim(),x[1]&&(d=x[1].trim())}c=c.replace(/^```markdown/i,"").replace(/```$/,"").trim(),d=d.replace(/^```markdown/i,"").replace(/```$/,"").trim();const L=[{id:crypto.randomUUID(),date:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}),topic:i,difficulty:b,question:c,feedback:d,bookmarked:!0},...s];l(L),localStorage.setItem("igcse_ai_history",JSON.stringify(L)),S(""),I(""),v(!1)},T=r=>{W(r),g(10)},J=r=>{A(r.target.value),g(10)},z=r=>r?r.replace(/^[ \t]+/gm,""):"",O=s.filter(r=>{if(n&&!r.bookmarked)return!1;if(p.trim()!==""){const o=p.toLowerCase(),i=r.topic?.toLowerCase().includes(o),b=r.difficulty?.toLowerCase().includes(o),m=r.question?.toLowerCase().includes(o);if(!i&&!b&&!m)return!1}return!0}),N=O.slice(0,f);return M?e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"1.5rem"},children:[e.jsx("link",{rel:"stylesheet",href:"https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"}),e.jsx("style",{children:`
        .math-renderer pre { white-space: pre-wrap !important; word-break: break-word !important; background: var(--sl-color-gray-6) !important; }
        
        .icon-btn {
          display: inline-flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer;
          width: 32px; height: 32px; padding: 0; line-height: 1;
          border-radius: 6px; transition: all 0.2s;
        }
        
        .bookmark-btn { font-size: 1.25rem; }
        .bookmark-btn:hover { transform: scale(1.15); }
        
        .copy-btn { font-size: 1.1rem; color: var(--sl-color-gray-3); transition: color 0.2s; }
        .copy-btn:hover { color: var(--sl-color-white); transform: scale(1.15); }

        .delete-btn { font-size: 1.1rem; color: var(--sl-color-gray-4); opacity: 0.6; }
        .delete-btn:hover { opacity: 1; color: var(--sl-color-red-high); background: var(--sl-color-red-low); }

        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        .icon-animate {
          display: inline-block;
          animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .math-renderer svg {
          max-width: 100%; height: auto; display: block; margin: 1.5rem auto;
          background-color: white; border-radius: 8px; padding: 1rem;
          box-shadow: inset 0 0 0 1px var(--sl-color-gray-5); overflow: visible;
        }

        .import-input {
          width: 100%; 
          height: 42px !important; 
          padding: 0 0.8rem; 
          border-radius: 6px;
          border: 1px solid var(--sl-color-gray-5);
          background: var(--sl-color-bg-nav);
          color: var(--sl-color-white);
          font-family: inherit; 
          margin: 0 !important; 
          box-sizing: border-box !important;
          line-height: normal !important;
        }
        
        textarea.import-input {
          height: auto !important;
          padding: 0.8rem;
          margin-bottom: 1rem !important;
        }
      `}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"1rem"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"1rem"},children:[e.jsxs("div",{style:{margin:0,display:"flex",alignItems:"center",gap:"0.25rem",background:"var(--sl-color-gray-6)",padding:"0.25rem",borderRadius:"8px",height:"42px",boxSizing:"border-box"},children:[e.jsx("button",{onClick:()=>T(!1),style:{margin:0,boxSizing:"border-box",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 1rem",borderRadius:"6px",border:"none",background:n?"transparent":"var(--sl-color-accent-high)",color:n?"var(--sl-color-white)":"var(--sl-color-black)",cursor:"pointer",fontWeight:"bold",lineHeight:1,height:"100%"},children:"All"}),e.jsxs("button",{onClick:()=>T(!0),style:{margin:0,boxSizing:"border-box",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem",padding:"0 1rem",borderRadius:"6px",border:"none",background:n?"var(--sl-color-accent-high)":"transparent",color:n?"var(--sl-color-black)":"var(--sl-color-white)",cursor:"pointer",fontWeight:"bold",lineHeight:1,height:"100%"},children:[e.jsx("span",{style:{display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",height:"100%"},children:"⭐"})," Bookmarks"]})]}),e.jsx("div",{style:{display:"flex",gap:"1rem",alignItems:"center",margin:0,height:"42px",boxSizing:"border-box"},children:e.jsx("button",{onClick:()=>v(!h),style:{margin:0,boxSizing:"border-box",height:"100%",background:"var(--sl-color-gray-6)",color:"var(--sl-color-white)",border:"1px solid var(--sl-color-gray-5)",padding:"0 1rem",borderRadius:"6px",cursor:"pointer",fontSize:"0.9rem",fontWeight:"600",display:"flex",alignItems:"center",gap:"0.4rem"},children:h?"Cancel Import":"📥 Import External AI"})})]}),e.jsx("input",{type:"text",className:"import-input",placeholder:"🔍 Search topics, difficulty, or questions...",value:p,onChange:J,style:{marginBottom:"0.5rem"}})]}),h&&e.jsxs("div",{style:{padding:"1.5rem",background:"var(--sl-color-gray-6)",borderRadius:"12px",border:"1px solid var(--sl-color-accent-low)",animation:"slideIn 0.3s ease-out"},children:[e.jsx("h3",{style:{marginTop:0,marginBottom:"1rem",fontSize:"1.1rem",color:"var(--sl-color-white)"},children:"Import Practice Problem"}),e.jsxs("div",{style:{display:"flex",gap:"1rem",flexWrap:"wrap",marginBottom:"1rem",alignItems:"flex-end"},children:[e.jsxs("div",{style:{flex:"1 1 200px"},children:[e.jsx("label",{style:{display:"block",fontSize:"0.85rem",marginBottom:"0.4rem",color:"var(--sl-color-gray-3)"},children:"Topic Name (Optional Fallback)"}),e.jsx("input",{type:"text",className:"import-input",placeholder:"e.g. Algebra, Geometry...",value:k,onChange:r=>S(r.target.value)})]}),e.jsxs("div",{style:{flex:"1 1 200px"},children:[e.jsx("label",{style:{display:"block",fontSize:"0.85rem",marginBottom:"0.4rem",color:"var(--sl-color-gray-3)"},children:"Difficulty (Fallback)"}),e.jsxs("select",{className:"import-input",value:j,onChange:r=>U(r.target.value),children:[e.jsx("option",{children:"IGCSE Core"}),e.jsx("option",{children:"IGCSE Extended"}),e.jsx("option",{children:"Custom/Advanced"})]})]})]}),e.jsx("label",{style:{display:"block",fontSize:"0.85rem",marginBottom:"0.4rem",color:"var(--sl-color-gray-3)"},children:"Paste entire AI response here (including TOPIC:, PROBLEM: and SOLUTION:)"}),e.jsx("textarea",{className:"import-input",rows:"6",placeholder:"Paste the text from ChatGPT or Gemini here...",value:a,onChange:r=>I(r.target.value),style:{resize:"vertical"}}),w&&e.jsx("p",{style:{color:"var(--sl-color-red-high)",fontSize:"0.85rem",marginTop:0,marginBottom:"1rem"},children:w}),e.jsx("button",{onClick:$,style:{background:"var(--sl-color-accent)",color:"var(--sl-color-black)",border:"none",padding:"0.6rem 1.2rem",borderRadius:"6px",fontWeight:"bold",cursor:"pointer"},children:"Save to My Revision"})]}),N.length===0?e.jsx("div",{style:{textAlign:"center",padding:"3rem",border:"1px dashed var(--sl-color-gray-5)",borderRadius:"12px"},children:e.jsx("p",{style:{color:"var(--sl-color-gray-3)"},children:p?"No questions match your search.":n?"No bookmarks yet. Star a question to see it here!":"No history found. Go practice some math!"})}):N.map(r=>e.jsxs("div",{style:{border:"1px solid var(--sl-color-gray-5)",borderRadius:"12px",overflow:"hidden",backgroundColor:"var(--sl-color-bg-nav)",boxShadow:"var(--sl-shadow-sm)"},children:[e.jsxs("div",{style:{background:"var(--sl-color-gray-6)",padding:"0.6rem 1.25rem",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid var(--sl-color-gray-5)",minHeight:"50px"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",flexWrap:"wrap",gap:"0.6rem"},children:[e.jsx("span",{style:{fontSize:"0.75rem",color:"var(--sl-color-accent-high)",fontWeight:"bold",textTransform:"uppercase",letterSpacing:"0.05em",lineHeight:1},children:r.topic}),e.jsx("span",{style:{color:"var(--sl-color-gray-4)",fontSize:"0.8rem",lineHeight:1},children:"•"}),e.jsx("span",{style:{fontSize:"0.75rem",color:"var(--sl-color-gray-3)",lineHeight:1},children:r.difficulty})]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.4rem",height:"32px",margin:0,boxSizing:"border-box"},children:[e.jsx("button",{onClick:()=>_(r.id),className:"icon-btn bookmark-btn",style:{height:"100%",margin:0,boxSizing:"border-box"},title:r.bookmarked?"Remove bookmark":"Add bookmark",children:r.bookmarked?"⭐":"☆"}),e.jsx("button",{onClick:()=>G(r),className:"icon-btn copy-btn",style:{height:"100%",margin:0,boxSizing:"border-box"},title:"Copy Markdown",children:e.jsx("span",{className:"icon-animate",children:y===r.id?"✅":"📋"},y===r.id?"check":"clipboard")}),e.jsx("button",{onClick:()=>q(r.id),className:"icon-btn delete-btn",title:"Delete entry",style:{height:"100%",margin:0,boxSizing:"border-box"},children:"🗑️"})]})]}),e.jsxs("div",{style:{padding:"1.25rem"},children:[e.jsx("div",{className:"math-renderer",style:{marginBottom:"1.5rem"},children:e.jsx(P,{remarkPlugins:[D],rehypePlugins:[B,E],children:z(r.question)})}),e.jsxs("details",{style:{borderTop:"1px solid var(--sl-color-gray-5)",paddingTop:"1rem"},children:[e.jsxs("summary",{style:{cursor:"pointer",color:"#10b981",fontWeight:"bold",listStyle:"none",display:"flex",alignItems:"center",gap:"0.5rem"},children:[e.jsx("span",{children:"▼"})," View Saved Solution"]}),e.jsx("div",{className:"math-renderer",style:{marginTop:"1rem",background:"#064e3b",padding:"1.25rem",borderRadius:"8px",borderLeft:"4px solid #10b981",color:"#ecfdf5",boxShadow:"inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)"},children:e.jsx(P,{remarkPlugins:[D],rehypePlugins:[B,E],children:z(r.feedback)})})]})]})]},r.id)),f<O.length&&e.jsx("div",{style:{display:"flex",justifyContent:"center",marginTop:"1rem"},children:e.jsx("button",{onClick:()=>g(r=>r+10),style:{background:"var(--sl-color-accent-high)",color:"var(--sl-color-black)",border:"none",padding:"0.6rem 1.5rem",borderRadius:"6px",fontWeight:"bold",cursor:"pointer"},children:"Load More Questions..."})}),s.length>0&&e.jsx("div",{style:{display:"flex",justifyContent:"center",marginTop:"1rem",borderTop:"1px solid var(--sl-color-gray-5)",paddingTop:"1.5rem"},children:e.jsx("button",{onClick:F,style:{color:"var(--sl-color-red-high)",background:"var(--sl-color-gray-6)",border:"1px solid var(--sl-color-gray-5)",borderRadius:"6px",cursor:"pointer",fontSize:"0.9rem",fontWeight:"600",padding:"0.6rem 1.5rem"},children:"🗑️ Clear All History"})})]}):e.jsx("div",{style:{padding:"2rem",textAlign:"center"},children:"Loading..."})}export{X as default};
