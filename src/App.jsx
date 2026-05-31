import { useState, useEffect, useRef } from "react";

const uid = () => Math.random().toString(36).slice(2, 9);

const CFG = {
  Mathematics:      { color: "#2563eb", light: "#dbeafe" },
  Physics:          { color: "#dc2626", light: "#fee2e2" },
  "Physical Chem":  { color: "#059669", light: "#d1fae5" },
  "Inorganic Chem": { color: "#7c3aed", light: "#ede9fe" },
  "Organic Chem":   { color: "#d97706", light: "#fef3c7" },
};

const DEFAULT_COLS = {
  Mathematics:      ["Lecture","Notes","HW","PYQs","DPPs","Module Q","DIBYs","Done ✓"],
  Physics:          ["Lecture","Notes","HW","PYQs","DPPs","Module Q","KPPs","Done ✓"],
  "Physical Chem":  ["Lecture","Notes","HW","PYQs","DPPs","Module Q","Done ✓"],
  "Inorganic Chem": ["Lecture","Notes","HW","PYQs","DPPs","Module Q","Done ✓"],
  "Organic Chem":   ["Lecture","Notes","HW","PYQs","DPPs","Module Q","Done ✓"],
};

const COL_COLORS = [
  "#2563eb","#059669","#d97706","#7c3aed","#db2777",
  "#0891b2","#dc2626","#16a34a","#9333ea","#0d9488",
];

const SEED_11 = {
  Mathematics: [
    ["Basic Maths","os"],["Sets","os"],["Trigonometric Functions","b"],
    ["Trigonometric Equations","os"],["Quadratic Equations","b"],
    ["Sequence & Series","b"],["Relations & Functions","b"],
    ["Permutation & Combination","b"],["Binomial Theorem","os"],
    ["Limits & Derivatives","b"],["Linear Equations","os"],
    ["Straight Line","os"],["Circles","b"],["Parabola","b"],
    ["Ellipse","os"],["Hyperbola","os"],["Probability","b"],
    ["Intro to 3D Geometry","os"],["Complex Numbers","b"],
    ["Statistics","os"],["Solutions of Triangle","os"],
  ],
  Physics: [
    ["Circular Motion","b"],["Work Power & Energy","b"],["Center of Mass","b"],
    ["Thermal Properties of Solids","os"],["Rotational Motion","b"],
    ["KTG","os"],["Thermodynamics","b"],["Oscillations (SHM)","b"],
    ["Waves","b"],["Mechanical Properties of Fluids","os"],["Gravitation","os"],
  ],
  "Physical Chem":  [["State of Matter","os"],["Thermodynamics","b"],["Redox Reaction","os"],["Chemical Equilibrium","b"],["Ionic Equilibrium","b"]],
  "Inorganic Chem": [["Periodic Table","os"],["Chemical Bonding","b"],["p-Block","b"],["s-Block","os"],["Hydrogen","os"]],
  "Organic Chem":   [["IUPAC Naming","os"],["Isomerism","b"],["GOC","b"],["Hydrocarbons","b"],["Qualitative & Quantitative Analysis","os"],["Environmental Chemistry","os"]],
};

function makeCols(subj) {
  return DEFAULT_COLS[subj].map(n => ({ id: uid(), name: n }));
}

function makeChapter(name, t, order) {
  return { id: uid(), name, oneShot: t === "os", lec: t === "os" ? 1 : 10, order, checks: {} };
}

function buildInit() {
  const out = { "11": {}, "12": {} };
  Object.keys(CFG).forEach(subj => {
    out["11"][subj] = {
      cols: makeCols(subj),
      chapters: (SEED_11[subj] || []).map(([n, t], i) => makeChapter(n, t, i + 1)),
    };
    out["12"][subj] = {
      cols: makeCols(subj),
      chapters: [],
    };
  });
  return out;
}

function mergeInto(base, saved) {
  const out = JSON.parse(JSON.stringify(base));
  ["11","12"].forEach(cls => {
    if (!saved[cls]) return;
    Object.keys(CFG).forEach(subj => {
      if (saved[cls][subj]) out[cls][subj] = saved[cls][subj];
    });
  });
  return out;
}

function reorder(arr) {
  return [...arr].sort((a,b) => a.order - b.order).map((c,i) => ({...c, order: i+1}));
}

function RedFlag({ size=22 }) {
  return <svg width={size} height={size} viewBox="0 0 22 22" fill="none" style={{display:"block"}}>
    <rect x="4" y="1" width="2.2" height="20" rx="1" fill="#6b7280"/>
    <polygon points="6.2,1.5 20,7.5 6.2,13.5" fill="#ef4444"/>
  </svg>;
}
function GreenFlag({ size=22 }) {
  return <svg width={size} height={size} viewBox="0 0 22 22" fill="none" style={{display:"block"}}>
    <rect x="4" y="1" width="2.2" height="20" rx="1" fill="#6b7280"/>
    <polygon points="6.2,1.5 20,7.5 6.2,13.5" fill="#22c55e"/>
  </svg>;
}

const STORAGE_KEY = "jee-planner-v7";

export default function App() {
  const [cls, setCls]         = useState("11");
  const [tab, setTab]         = useState("Mathematics");
  const [data, setData]       = useState(buildInit);
  const [ready, setReady]     = useState(false);
  const [hoverId, setHoverId] = useState(null);
  const [editColId, setEditColId] = useState(null);
  const editColRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setData(b => mergeInto(b, JSON.parse(saved)));
      } catch(_) {}
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (editColId && editColRef.current) editColRef.current.focus();
  }, [editColId]);

  const save = (next) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch(_) {}
  };

  const patch = (fn) => setData(p => { const n = fn(p); save(n); return n; });

  /* ── chapters ── */
  const updCh = (id, upd) => patch(p => ({
    ...p, [cls]: { ...p[cls], [tab]: {
      ...p[cls][tab],
      chapters: p[cls][tab].chapters.map(c => c.id===id ? {...c,...upd} : c)
    }}
  }));

  const tickCh = (id, col) => patch(p => ({
    ...p, [cls]: { ...p[cls], [tab]: {
      ...p[cls][tab],
      chapters: p[cls][tab].chapters.map(c =>
        c.id===id ? {...c, checks:{...c.checks,[col]:!c.checks[col]}} : c
      )
    }}
  }));

  const delCh = (id) => patch(p => ({
    ...p, [cls]: { ...p[cls], [tab]: {
      ...p[cls][tab],
      chapters: reorder(p[cls][tab].chapters.filter(c => c.id!==id))
    }}
  }));

  const addCh = () => patch(p => {
    const chs = p[cls][tab].chapters;
    const maxO = chs.reduce((m,c) => Math.max(m,c.order),0);
    return { ...p, [cls]: { ...p[cls], [tab]: {
      ...p[cls][tab],
      chapters: [...chs, makeChapter("New Chapter","b",maxO+1)]
    }}};
  });

  /* ── columns ── */
  const addCol = () => patch(p => {
    const cols = p[cls][tab].cols;
    const doneIdx = cols.findIndex(c => c.name === "Done ✓");
    const newCol = { id: uid(), name: "New Column" };
    const next = [...cols];
    const insertAt = doneIdx >= 0 ? doneIdx : next.length;
    next.splice(insertAt, 0, newCol);
    return { ...p, [cls]: { ...p[cls], [tab]: { ...p[cls][tab], cols: next }}};
  });

  const renameCol = (colId, name) => patch(p => ({
    ...p, [cls]: { ...p[cls], [tab]: {
      ...p[cls][tab],
      cols: p[cls][tab].cols.map(c => c.id===colId ? {...c,name} : c)
    }}
  }));

  const delCol = (colId) => {
    const col = data[cls][tab].cols.find(c => c.id===colId);
    if (!col) return;
    const isDefault = DEFAULT_COLS[tab]?.includes(col.name);
    if (isDefault && !window.confirm(`"${col.name}" is a default column. Delete anyway?`)) return;
    patch(p => ({
      ...p, [cls]: { ...p[cls], [tab]: {
        ...p[cls][tab],
        cols: p[cls][tab].cols.filter(c => c.id!==colId)
      }}
    }));
  };

  /* ── derived ── */
  const subjData  = data[cls][tab];
  const cols      = subjData.cols;
  const sorted    = [...subjData.chapters].sort((a,b) => a.order-b.order);
  const S         = CFG[tab];

  const allChs = Object.values(data[cls]).flatMap(s => s.chapters);
  const total     = allChs.length;
  const lecDone   = allChs.filter(c => c.checks["Lecture"]).length;
  const notesDone = allChs.filter(c => c.checks["Notes"]).length;
  const pct       = total ? Math.round(((lecDone+notesDone)/(total*2))*100) : 0;

  const subjProg = (s) => {
    const chs = data[cls][s]?.chapters || [];
    const doneCol = data[cls][s]?.cols.find(c => c.name==="Done ✓");
    return {
      done: chs.filter(c => doneCol && c.checks[doneCol.name]).length,
      total: chs.length
    };
  };

  const colColor = (name, idx) => {
    const fixed = {
      "Lecture":"#2563eb","Notes":"#059669","HW":"#d97706",
      "PYQs":"#7c3aed","DPPs":"#db2777","Module Q":"#0891b2",
      "KPPs":"#dc2626","DIBYs":"#16a34a","Done ✓": S.color,
    };
    return fixed[name] || COL_COLORS[idx % COL_COLORS.length];
  };

  if (!ready) return <div style={{padding:"3rem",textAlign:"center",color:"#6b7280"}}>Loading…</div>;

  return (
    <div style={{maxWidth:"1150px",margin:"0 auto",padding:"1.25rem 1rem 3rem",fontFamily:"system-ui,sans-serif"}}>

      {/* ══ CLASS SWITCHER ══ */}
      <div style={{display:"flex",justifyContent:"center",marginBottom:"1.5rem"}}>
        <div style={{display:"inline-flex",background:"#f3f4f6",borderRadius:"12px",padding:"4px",gap:"4px"}}>
          {["11","12"].map(c => (
            <button key={c} onClick={() => setCls(c)} style={{
              padding:"9px 32px",
              borderRadius:"9px",
              border:"none",
              cursor:"pointer",
              fontSize:"14px",
              fontWeight:700,
              transition:"all 0.18s",
              background: cls===c ? "#ffffff" : "transparent",
              color: cls===c ? "#111827" : "#6b7280",
              boxShadow: cls===c ? "0 1px 4px #0001,0 0 0 1px #e5e7eb" : "none",
            }}>
              Class {c}th
            </button>
          ))}
        </div>
      </div>

      <div style={{marginBottom:"1.25rem"}}>
        <h1 style={{fontSize:"18px",fontWeight:700,color:"#111827",margin:"0 0 3px"}}>
          JEE Class {cls}th Planner
        </h1>
        <p style={{fontSize:"12.5px",color:"#9ca3af",margin:0}}>
          {cls==="11" ? "6-month 11th backlog strategy · 2 lectures/day" : "Track your 12th syllabus · add chapters as you go"}
        </p>
      </div>

      {/* ══ RACE TRACK ══ */}
      <div style={{marginBottom:"1.5rem",padding:"1rem 1.25rem 0.9rem",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:"12px"}}>
          <span style={{fontSize:"12.5px",fontWeight:500,color:"#374151"}}>Class {cls}th Syllabus Race</span>
          <span style={{fontSize:"22px",fontWeight:700,color:pct===100?"#059669":"#2563eb"}}>
            {pct}<span style={{fontSize:"13px",fontWeight:400,color:"#9ca3af"}}>%</span>
          </span>
        </div>
        <div style={{position:"relative",height:"40px",display:"flex",alignItems:"center"}}>
          <div style={{flexShrink:0}}><RedFlag size={24}/></div>
          <div style={{flex:1,position:"relative",height:"10px",margin:"0 6px"}}>
            <div style={{position:"absolute",inset:0,background:"#e5e7eb",borderRadius:"5px",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pct}%`,background:pct===100?"#16a34a":"linear-gradient(90deg,#2563eb,#7c3aed,#db2777)",borderRadius:"5px",transition:"width 0.5s ease"}}/>
            </div>
            <div style={{position:"absolute",left:`${pct}%`,top:"50%",transform:"translate(-50%,-90%)",fontSize:"20px",lineHeight:1,transition:"left 0.5s ease",userSelect:"none"}}>🏃</div>
          </div>
          <div style={{flexShrink:0}}><GreenFlag size={24}/></div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"8px",fontSize:"11px",color:"#9ca3af"}}>
          <span>Lectures ✓ {lecDone}/{total}</span>
          <span>Notes ✓ {notesDone}/{total}</span>
          <span>combined → {pct}%</span>
        </div>
      </div>

      {/* ══ SUBJECT TABS ══ */}
      <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"1.25rem"}}>
        {Object.keys(CFG).map(subj => {
          const {color,light} = CFG[subj];
          const {done,total:t} = subjProg(subj);
          const isActive = tab===subj;
          const p = t ? Math.round((done/t)*100) : 0;
          return (
            <button key={subj} onClick={() => setTab(subj)} style={{
              background:isActive?light:"#f9fafb",
              border:`${isActive?"2px":"1px"} solid ${isActive?color:"#e5e7eb"}`,
              borderRadius:"10px",padding:"9px 15px",cursor:"pointer",
              minWidth:"112px",textAlign:"left",transition:"all 0.15s",
            }}>
              <div style={{fontSize:"12.5px",fontWeight:600,color:isActive?color:"#111827",marginBottom:"3px"}}>{subj}</div>
              <div style={{fontSize:"10.5px",color:"#9ca3af",marginBottom:"5px"}}>{done}/{t} done</div>
              <div style={{height:"3px",background:`${color}22`,borderRadius:"2px",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${p}%`,background:color,borderRadius:"2px",transition:"width 0.3s"}}/>
              </div>
            </button>
          );
        })}
      </div>

      {/* ══ TABLE ══ */}
      <div style={{overflowX:"auto",borderRadius:"12px",border:`1px solid ${S.color}55`}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:"600px"}}>
          <colgroup>
            <col style={{width:"36px"}}/>
            <col style={{minWidth:"165px"}}/>
            <col style={{width:"68px"}}/>
            {cols.map(c => <col key={c.id} style={{width:"72px"}}/>)}
            <col style={{width:"42px"}}/>
          </colgroup>

          {/* ── HEADER ── */}
          <thead>
            <tr style={{background:S.light,borderBottom:`1.5px solid ${S.color}55`}}>
              <th style={{...TH,color:S.color}}>#</th>
              <th style={{...TH,textAlign:"left",paddingLeft:"36px",color:S.color}}>Chapter</th>
              <th style={{...TH,color:S.color}}>Lec #</th>
              {cols.map((col,ci) => {
                const cc = colColor(col.name, ci);
                const isDoneCol = col.name==="Done ✓";
                return (
                  <th key={col.id} style={{...TH,color:cc,position:"relative",padding:"6px 4px"}}>
                    <div
                      style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"3px",position:"relative"}}
                      onMouseEnter={e => { const btn=e.currentTarget.querySelector(".col-del"); if(btn) btn.style.opacity="1"; }}
                      onMouseLeave={e => { const btn=e.currentTarget.querySelector(".col-del"); if(btn) btn.style.opacity="0"; }}
                    >
                      {editColId===col.id ? (
                        <input
                          ref={editColRef}
                          defaultValue={col.name}
                          onBlur={e => { renameCol(col.id, e.target.value||col.name); setEditColId(null); }}
                          onKeyDown={e => { if(e.key==="Enter"){renameCol(col.id,e.target.value||col.name);setEditColId(null);}}}
                          style={{width:"60px",fontSize:"11px",textAlign:"center",border:`1px solid ${cc}`,borderRadius:"4px",padding:"1px 3px",outline:"none",background:"#fff",color:cc,fontWeight:700}}
                        />
                      ) : (
                        <span
                          onDoubleClick={() => setEditColId(col.id)}
                          title="Double-click to rename"
                          style={{cursor:"default",fontSize:"11.5px",lineHeight:1.3}}
                        >{col.name}</span>
                      )}
                      {!isDoneCol && (
                        <button
                          className="col-del"
                          onClick={() => delCol(col.id)}
                          title="Delete column"
                          style={{
                            opacity:0,position:"absolute",top:"-8px",right:"-6px",
                            width:"14px",height:"14px",borderRadius:"50%",
                            background:"#fee2e2",border:"1px solid #fca5a5",
                            color:"#dc2626",fontSize:"10px",cursor:"pointer",
                            display:"flex",alignItems:"center",justifyContent:"center",
                            padding:0,lineHeight:1,transition:"opacity 0.15s",
                            zIndex:2,
                          }}
                        >×</button>
                      )}
                    </div>
                  </th>
                );
              })}
              {/* add column button */}
              <th style={{...TH,padding:"6px 4px"}}>
                <button
                  onClick={addCol}
                  title="Add new column"
                  style={{
                    width:"28px",height:"28px",borderRadius:"7px",
                    background:S.light,border:`1.5px dashed ${S.color}99`,
                    color:S.color,fontSize:"18px",cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontWeight:300,lineHeight:1,transition:"background 0.15s",
                  }}
                >+</button>
              </th>
            </tr>
          </thead>

          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={4+cols.length} style={{padding:"2rem",textAlign:"center",color:"#9ca3af",fontSize:"13px"}}>
                  No chapters yet — click "+ Add Chapter" below to get started
                </td>
              </tr>
            )}
            {sorted.map((ch, idx) => {
              const doneColName = cols.find(c=>c.name==="Done ✓")?.name || "Done ✓";
              const isDone    = !!ch.checks[doneColName];
              const isHovered = hoverId===ch.id;
              return (
                <tr key={ch.id}
                  onMouseEnter={() => setHoverId(ch.id)}
                  onMouseLeave={() => setHoverId(null)}
                  style={{
                    background: isDone ? S.light : idx%2===1 ? "#f9fafb" : "#ffffff",
                    borderBottom:"1px solid #f3f4f6",transition:"background 0.15s",
                  }}
                >
                  {/* order */}
                  <td style={{padding:"7px 3px",textAlign:"center",verticalAlign:"middle"}}>
                    <input type="number" value={ch.order} min={1}
                      onChange={e => updCh(ch.id,{order:parseInt(e.target.value)||idx+1})}
                      style={{width:"28px",textAlign:"center",fontSize:"11px",background:"transparent",border:"1px solid #e5e7eb",borderRadius:"4px",padding:"2px 0",color:"#9ca3af"}}
                    />
                  </td>

                  {/* name + delete */}
                  <td style={{padding:"7px 12px 7px 8px",verticalAlign:"middle"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                      <button onClick={() => delCh(ch.id)} title="Delete" style={{
                        flexShrink:0,width:"20px",height:"20px",borderRadius:"5px",
                        background:isHovered?"#fee2e2":"transparent",
                        border:isHovered?"1px solid #fca5a5":"1px solid transparent",
                        color:isHovered?"#dc2626":"transparent",
                        fontSize:"14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                        transition:"all 0.15s",padding:0,
                      }}>×</button>
                      <input value={ch.name}
                        onChange={e => updCh(ch.id,{name:e.target.value})}
                        onFocus={e => (e.target.style.borderBottomColor=S.color)}
                        onBlur={e => (e.target.style.borderBottomColor="transparent")}
                        style={{flex:1,fontSize:"13px",background:"transparent",border:"none",borderBottom:"1px solid transparent",
                          color:isDone?"#9ca3af":"#111827",textDecoration:isDone?"line-through":"none",
                          padding:"1px 0",outline:"none",cursor:"text",transition:"border-color 0.15s",minWidth:0}}
                      />
                    </div>
                  </td>

                  {/* lec count */}
                  <td style={{padding:"7px 5px",textAlign:"center",verticalAlign:"middle"}}>
                    {ch.oneShot ? (
                      <div onClick={() => updCh(ch.id,{oneShot:false,lec:10})}
                        style={{display:"inline-flex",flexDirection:"column",alignItems:"center",fontSize:"9.5px",padding:"4px 6px",background:"#ecfdf5",color:"#065f46",borderRadius:"6px",cursor:"pointer",fontWeight:700,border:"1px solid #6ee7b7",lineHeight:1.4}}>
                        One<br/>Shot
                      </div>
                    ) : (
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"3px"}}>
                        <input type="number" min={1} max={30} value={ch.lec}
                          onChange={e => updCh(ch.id,{lec:parseInt(e.target.value)||1})}
                          style={{width:"38px",textAlign:"center",fontSize:"13px",background:"transparent",border:"1px solid #d1d5db",borderRadius:"5px",padding:"3px 2px",color:"#111827"}}
                        />
                        <button onClick={() => updCh(ch.id,{oneShot:true,lec:1})}
                          style={{fontSize:"9px",padding:"1px 5px",background:"#ecfdf5",color:"#065f46",border:"1px solid #6ee7b7",borderRadius:"4px",cursor:"pointer",fontWeight:700,lineHeight:1.5}}>
                          OS
                        </button>
                      </div>
                    )}
                  </td>

                  {/* checkboxes */}
                  {cols.map((col,ci) => {
                    const checked   = !!ch.checks[col.name];
                    const isDoneCol = col.name==="Done ✓";
                    const cc        = colColor(col.name,ci);
                    return (
                      <td key={col.id} style={{padding:"7px 4px",textAlign:"center",verticalAlign:"middle"}}>
                        <div onClick={() => tickCh(ch.id,col.name)} style={{
                          width:"26px",height:"26px",margin:"0 auto",
                          borderRadius:isDoneCol?"50%":"7px",
                          background:checked?cc:"#f9fafb",
                          border:`2px solid ${checked?cc:"#d1d5db"}`,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          cursor:"pointer",transition:"all 0.13s",
                          boxShadow:checked?`0 0 0 3px ${cc}22`:"none",
                        }}>
                          {checked
                            ? <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5l3 3 5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            : <div style={{width:"8px",height:"8px",borderRadius:isDoneCol?"50%":"3px",background:`${cc}30`}}/>
                          }
                        </div>
                      </td>
                    );
                  })}
                  <td/>
                </tr>
              );
            })}

            {/* add chapter row */}
            <tr style={{background:"#f9fafb"}}>
              <td colSpan={4+cols.length+1} style={{padding:"10px 14px"}}>
                <button onClick={addCh}
                  onMouseEnter={e => (e.currentTarget.style.background=S.light)}
                  onMouseLeave={e => (e.currentTarget.style.background="transparent")}
                  style={{width:"100%",padding:"7px",background:"transparent",border:`1.5px dashed ${S.color}88`,borderRadius:"8px",color:S.color,fontSize:"12.5px",fontWeight:600,cursor:"pointer",transition:"background 0.15s"}}>
                  + Add Chapter
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{marginTop:"10px",display:"flex",flexWrap:"wrap",gap:"10px",fontSize:"11px",color:"#9ca3af"}}>
        <span>Hover row → × to delete chapter</span>
        <span>·</span>
        <span>Click chapter name to rename</span>
        <span>·</span>
        <span>Double-click column header to rename it</span>
        <span>·</span>
        <span>Hover column header → × to delete column</span>
        <span>·</span>
        <span>Click + to add new column</span>
      </div>
    </div>
  );
}

const TH = {
  padding:"10px 6px",textAlign:"center",
  fontSize:"11.5px",fontWeight:700,userSelect:"none",
};