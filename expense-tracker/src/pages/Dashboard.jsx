import { useState, useEffect, useContext } from "react";
import { db, auth } from "../firebase/firebase";
import {
  collection, addDoc, getDocs,
  deleteDoc, doc, query, where, orderBy
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { AuthContext } from "../context/AuthContext";
import logo from "../assets/exp.png";
const CATEGORIES = [
  { label: "Food", icon: "🍔", color: "#f97316" },
  { label: "Travel", icon: "✈️", color: "#6366f1" },
  { label: "Shopping", icon: "🛍️", color: "#ec4899" },
  { label: "Health", icon: "💊", color: "#22c55e" },
  { label: "Bills", icon: "📄", color: "#eab308" },
  { label: "Entertainment", icon: "🎬", color: "#8b5cf6" },
  { label: "Salary", icon: "💼", color: "#14b8a6" },
  { label: "Other", icon: "📦", color: "#94a3b8" },
];

const getCat = (label) => CATEGORIES.find(c => c.label === label) || CATEGORIES[7];

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("Food");
  const [type, setType] = useState("expense");
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("transactions");
  const [deletingId, setDeletingId] = useState(null);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "expenses"),
        where("userId", "==", user.uid)
      );
      const data = await getDocs(q);
      const docs = data.docs.map(d => ({ ...d.data(), id: d.id }));
      docs.sort((a, b) => b.date?.toDate?.() - a.date?.toDate?.());
      setExpenses(docs);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchExpenses(); }, [user]);

  const addExpense = async () => {
    if (!amount || isNaN(amount)) return;
    setAdding(true);
    try {
      await addDoc(collection(db, "expenses"), {
        userId: user.uid,
        amount: Number(amount),
        category,
        type,
        note: note || "",
        date: new Date(),
      });
      setAmount(""); setNote("");
      setShowForm(false);
      fetchExpenses();
    } catch (e) { console.error(e); }
    finally { setAdding(false); }
  };

  const deleteExpense = async (id) => {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "expenses", id));
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (e) { console.error(e); }
    finally { setDeletingId(null); }
  };

  const total = expenses.reduce((s, e) => e.type === "expense" ? s - e.amount : s + e.amount, 0);
  const income = expenses.filter(e => e.type === "income").reduce((a, b) => a + b.amount, 0);
  const expense = expenses.filter(e => e.type === "expense").reduce((a, b) => a + b.amount, 0);
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

  // Category breakdown
  const catBreakdown = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.label && e.type === "expense").reduce((a, b) => a + b.amount, 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const filtered = expenses.filter(e => {
    const matchType = filterType === "all" || e.type === filterType;
    const matchSearch = !search || e.category.toLowerCase().includes(search.toLowerCase()) || e.note?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const fmt = (n) => new Intl.NumberFormat("en-IN").format(Math.abs(n));

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#1e293b;border-radius:4px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes slideIn{from{opacity:0;transform:translateY(20px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes float{0%,100%{transform:translate(0,0)}50%{transform:translate(10px,-15px)}}
        input::placeholder{color:#475569}
        select option{background:#0f172a;color:#e2e8f0}
        @media(max-width:640px){
          .dash-grid{grid-template-columns:1fr!important}
          .stat-grid{grid-template-columns:1fr 1fr!important}
          .form-row{flex-direction:column!important}
        }
      `}</style>

      {/* BG blobs */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:0}}>
        <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)",top:-100,left:-100,animation:"float 10s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(168,85,247,0.1) 0%,transparent 70%)",bottom:-80,right:-80,animation:"float 14s ease-in-out infinite reverse"}}/>
      </div>

      <div style={{position:"relative",zIndex:1,maxWidth:800,margin:"0 auto",padding:"20px 16px 80px"}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28,animation:"fadeUp 0.4s ease both"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:3}}>
              <img
  src={logo}
  alt="logo"
  style={{
    width: 40,
    height: 40,
    borderRadius: 20,
    objectFit: "cover",
    boxShadow: "0 4px 14px rgba(99,102,241,0.3)"
  }}
/>
              <span style={{fontSize:18,fontWeight:700,color:"#f1f5f9",letterSpacing:"-0.4px"}}>SpendSmart</span>
            </div>
            <p style={{fontSize:12,color:"#475569"}}>Hi, {user?.email?.split("@")[0]}</p>
          </div>
          <button onClick={() => signOut(auth)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,color:"#f87171",fontSize:12.5,fontWeight:600,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,0.18)"}}
            onMouseLeave={e=>{e.currentTarget.style.background="rgba(239,68,68,0.1)"}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>

        {/* Balance Hero */}
        <div style={{background:"linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e1b4b 100%)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:22,padding:"28px 28px 24px",marginBottom:16,position:"relative",overflow:"hidden",animation:"fadeUp 0.5s ease 0.05s both"}}>
          <div style={{position:"absolute",top:-30,right:-30,width:160,height:160,borderRadius:"50%",background:"radial-gradient(circle,rgba(139,92,246,0.25) 0%,transparent 70%)"}}/>
          <div style={{position:"absolute",bottom:-20,left:20,width:100,height:100,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,0.2) 0%,transparent 70%)"}}/>
          <p style={{fontSize:12,color:"#a5b4fc",fontWeight:600,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:8}}>Total Balance</p>
          <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:18}}>
            <span style={{fontSize:13,color:"#c4b5fd",fontWeight:500}}>₹</span>
            <span style={{fontSize:38,fontWeight:700,color:total >= 0 ? "#e0e7ff" : "#fca5a5",letterSpacing:"-1px",lineHeight:1}}>{fmt(total)}</span>
            {total < 0 && <span style={{fontSize:13,color:"#fca5a5",fontWeight:500}}>deficit</span>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}} className="stat-grid">
            {[
              {label:"Income",val:income,color:"#4ade80",icon:"↑"},
              {label:"Expenses",val:expense,color:"#f87171",icon:"↓"},
              {label:"Saved",val:`${savingsRate}%`,color:"#a5b4fc",icon:"◈"},
            ].map(item => (
              <div key={item.label} style={{background:"rgba(255,255,255,0.06)",borderRadius:12,padding:"10px 12px",border:"1px solid rgba(255,255,255,0.08)"}}>
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                  <span style={{color:item.color,fontSize:12,fontWeight:700}}>{item.icon}</span>
                  <span style={{fontSize:10.5,color:"#94a3b8",letterSpacing:"0.4px"}}>{item.label}</span>
                </div>
                <div style={{fontSize:15,fontWeight:700,color:item.color}}>
                  {item.label === "Saved" ? item.val : `₹${fmt(item.val)}`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Add FAB */}
        <button
          onClick={() => setShowForm(v => !v)}
          style={{width:"100%",padding:"13px",background:showForm?"rgba(239,68,68,0.1)":"linear-gradient(135deg,#6366f1,#8b5cf6)",border:showForm?"1px solid rgba(239,68,68,0.25)":"none",borderRadius:14,color:showForm?"#f87171":"#fff",fontSize:14,fontWeight:600,fontFamily:"'Sora',sans-serif",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:16,boxShadow:showForm?"none":"0 4px 20px rgba(99,102,241,0.35)",transition:"all 0.25s",animation:"fadeUp 0.5s ease 0.1s both"}}
          onMouseEnter={e=>{if(!showForm)e.currentTarget.style.transform="translateY(-1px)"}}
          onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{transform:showForm?"rotate(45deg)":"rotate(0)",transition:"transform 0.25s"}}>
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {showForm ? "Cancel" : "Add Transaction"}
        </button>

        {/* Add Form */}
        {showForm && (
          <div style={{background:"rgba(15,23,42,0.9)",backdropFilter:"blur(20px)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:18,padding:"22px 20px",marginBottom:16,animation:"slideIn 0.3s ease both",boxShadow:"0 16px 48px rgba(0,0,0,0.4)"}}>
            <h3 style={{fontSize:14,fontWeight:600,color:"#c4b5fd",marginBottom:18,display:"flex",alignItems:"center",gap:8}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              New Transaction
            </h3>

            {/* Type toggle */}
            <div style={{display:"flex",background:"rgba(30,41,59,0.8)",borderRadius:10,padding:3,marginBottom:14,border:"1px solid #1e293b"}}>
              {["expense","income"].map(t => (
                <button key={t} onClick={() => setType(t)}
                  style={{flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"'Sora',sans-serif",fontSize:13,fontWeight:600,transition:"all 0.2s",
                    background:type===t?(t==="expense"?"linear-gradient(135deg,#ef4444,#dc2626)":"linear-gradient(135deg,#22c55e,#16a34a)"):"transparent",
                    color:type===t?"#fff":"#64748b",boxShadow:type===t?"0 2px 8px rgba(0,0,0,0.3)":"none"}}>
                  {t === "expense" ? "↓ Expense" : "↑ Income"}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div style={{position:"relative",marginBottom:10}}>
              <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"#6366f1",fontWeight:700,fontSize:16}}>₹</span>
              <input
                style={{...s.input,paddingLeft:32,fontSize:18,fontWeight:600,color:"#f1f5f9"}}
                placeholder="0"
                value={amount}
                type="number"
                onChange={e => setAmount(e.target.value)}
                onFocus={e=>Object.assign(e.target.style,{borderColor:"#6366f1",boxShadow:"0 0 0 3px rgba(99,102,241,0.14)"})}
                onBlur={e=>Object.assign(e.target.style,{borderColor:"#1e293b",boxShadow:"none"})}
              />
            </div>

            {/* Note */}
            <input
              style={{...s.input,marginBottom:10}}
              placeholder="Add a note (optional)"
              value={note}
              onChange={e => setNote(e.target.value)}
              onFocus={e=>Object.assign(e.target.style,{borderColor:"#6366f1",boxShadow:"0 0 0 3px rgba(99,102,241,0.14)"})}
              onBlur={e=>Object.assign(e.target.style,{borderColor:"#1e293b",boxShadow:"none"})}
            />

            {/* Category picker */}
            <div style={{marginBottom:14}}>
              <p style={{fontSize:11,color:"#64748b",fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:8}}>Category</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
                {CATEGORIES.map(cat => (
                  <button key={cat.label} onClick={() => setCategory(cat.label)}
                    style={{padding:"8px 4px",borderRadius:10,border:`1px solid ${category===cat.label ? cat.color : "#1e293b"}`,background:category===cat.label ? `${cat.color}22` : "rgba(30,41,59,0.6)",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all 0.15s",fontFamily:"'Sora',sans-serif"}}>
                    <span style={{fontSize:16}}>{cat.icon}</span>
                    <span style={{fontSize:9.5,color:category===cat.label ? cat.color : "#64748b",fontWeight:600}}>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={addExpense} disabled={adding}
              style={{width:"100%",padding:"12px",background:type==="expense"?"linear-gradient(135deg,#ef4444,#dc2626)":"linear-gradient(135deg,#22c55e,#16a34a)",border:"none",borderRadius:11,color:"#fff",fontSize:14,fontWeight:600,fontFamily:"'Sora',sans-serif",cursor:adding?"not-allowed":"pointer",opacity:adding?0.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.15s"}}
              onMouseEnter={e=>{if(!adding)e.currentTarget.style.transform="translateY(-1px)"}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)"}}>
              {adding
                ? <span style={{width:16,height:16,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>
                : <>{type==="expense" ? "Add Expense" : "Add Income"} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></>
              }
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{display:"flex",gap:6,marginBottom:16,animation:"fadeUp 0.5s ease 0.15s both"}}>
          {[{id:"transactions",label:"Transactions",icon:"↕"},
            {id:"analytics",label:"Analytics",icon:"◈"}].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{flex:1,padding:"10px",borderRadius:11,border:`1px solid ${activeTab===tab.id ? "rgba(99,102,241,0.4)" : "#1e293b"}`,background:activeTab===tab.id ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.6)",color:activeTab===tab.id ? "#a5b4fc" : "#475569",fontSize:13,fontWeight:600,fontFamily:"'Sora',sans-serif",cursor:"pointer",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {activeTab === "transactions" && (
          <>
            {/* Search + filter */}
            <div style={{display:"flex",gap:8,marginBottom:14,animation:"fadeUp 0.5s ease 0.2s both"}} className="form-row">
              <div style={{position:"relative",flex:1}}>
                <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <input
                  style={{...s.input,paddingLeft:34,marginBottom:0}}
                  placeholder="Search transactions..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={e=>Object.assign(e.target.style,{borderColor:"#6366f1",boxShadow:"0 0 0 3px rgba(99,102,241,0.14)"})}
                  onBlur={e=>Object.assign(e.target.style,{borderColor:"#1e293b",boxShadow:"none"})}
                />
              </div>
              <select
                style={{...s.input,width:"auto",paddingLeft:10,marginBottom:0,cursor:"pointer"}}
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                onFocus={e=>Object.assign(e.target.style,{borderColor:"#6366f1"})}
                onBlur={e=>Object.assign(e.target.style,{borderColor:"#1e293b"})}>
                <option value="all">All</option>
                <option value="expense">Expenses</option>
                <option value="income">Income</option>
              </select>
            </div>

            {/* Transaction list */}
            <div style={{display:"flex",flexDirection:"column",gap:8,animation:"fadeUp 0.5s ease 0.25s both"}}>
              {loading ? (
                [1,2,3].map(i => (
                  <div key={i} style={{background:"rgba(15,23,42,0.7)",borderRadius:14,padding:"14px 16px",display:"flex",gap:12,alignItems:"center",animation:"pulse 1.5s ease-in-out infinite"}}>
                    <div style={{width:42,height:42,borderRadius:12,background:"#1e293b"}}/>
                    <div style={{flex:1}}><div style={{height:12,width:"50%",background:"#1e293b",borderRadius:6,marginBottom:6}}/><div style={{height:10,width:"30%",background:"#1e293b",borderRadius:6}}/></div>
                    <div style={{height:14,width:60,background:"#1e293b",borderRadius:6}}/>
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div style={{textAlign:"center",padding:"40px 20px",color:"#475569"}}>
                  <div style={{fontSize:36,marginBottom:10}}>📭</div>
                  <p style={{fontSize:14,fontWeight:500}}>No transactions found</p>
                  <p style={{fontSize:12,marginTop:4}}>Add your first transaction above</p>
                </div>
              ) : filtered.map((e, i) => {
                const cat = getCat(e.category);
                const dateStr = e.date?.toDate ? e.date.toDate().toLocaleDateString("en-IN", {day:"numeric",month:"short"}) : "";
                return (
                  <div key={e.id} style={{background:"rgba(15,23,42,0.8)",backdropFilter:"blur(12px)",border:"1px solid #0f172a",borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,transition:"all 0.2s",animation:`fadeUp 0.4s ease ${i*0.04}s both`,opacity:deletingId===e.id?0.4:1}}
                    onMouseEnter={ev=>{ev.currentTarget.style.border="1px solid #1e293b";ev.currentTarget.style.background="rgba(15,23,42,0.95)"}}
                    onMouseLeave={ev=>{ev.currentTarget.style.border="1px solid #0f172a";ev.currentTarget.style.background="rgba(15,23,42,0.8)"}}>
                    <div style={{width:42,height:42,borderRadius:12,background:`${cat.color}18`,border:`1px solid ${cat.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                      {cat.icon}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                        <span style={{fontSize:13.5,fontWeight:600,color:"#e2e8f0"}}>{e.category}</span>
                        <span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:e.type==="expense"?"rgba(239,68,68,0.12)":"rgba(34,197,94,0.12)",color:e.type==="expense"?"#f87171":"#4ade80",fontWeight:600,border:`1px solid ${e.type==="expense"?"rgba(239,68,68,0.2)":"rgba(34,197,94,0.2)"}`}}>
                          {e.type}
                        </span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        {e.note && <span style={{fontSize:11.5,color:"#64748b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:140}}>{e.note}</span>}
                        {dateStr && <span style={{fontSize:10.5,color:"#334155",flexShrink:0}}>{dateStr}</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                      <span style={{fontSize:15,fontWeight:700,color:e.type==="expense"?"#f87171":"#4ade80"}}>
                        {e.type==="expense"?"-":"+"}₹{fmt(e.amount)}
                      </span>
                      <button onClick={() => deleteExpense(e.id)}
                        style={{width:28,height:28,borderRadius:8,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s",color:"#f87171"}}
                        onMouseEnter={ev=>{ev.currentTarget.style.background="rgba(239,68,68,0.2)"}}
                        onMouseLeave={ev=>{ev.currentTarget.style.background="rgba(239,68,68,0.08)"}}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === "analytics" && (
          <div style={{animation:"fadeUp 0.4s ease both",display:"flex",flexDirection:"column",gap:14}}>
            {/* Spend by category */}
            <div style={{background:"rgba(15,23,42,0.8)",border:"1px solid #0f172a",borderRadius:18,padding:"20px"}}>
              <h3 style={{fontSize:13,fontWeight:600,color:"#94a3b8",letterSpacing:"0.4px",textTransform:"uppercase",marginBottom:16}}>Spending by Category</h3>
              {catBreakdown.length === 0 ? (
                <p style={{fontSize:13,color:"#475569",textAlign:"center",padding:"20px 0"}}>No expense data yet</p>
              ) : catBreakdown.map(cat => {
                const pct = expense > 0 ? Math.round((cat.total / expense) * 100) : 0;
                return (
                  <div key={cat.label} style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                      <div style={{display:"flex",alignItems:"center",gap:7}}>
                        <span style={{fontSize:15}}>{cat.icon}</span>
                        <span style={{fontSize:13,color:"#cbd5e1",fontWeight:500}}>{cat.label}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:12,color:"#64748b"}}>{pct}%</span>
                        <span style={{fontSize:13,fontWeight:600,color:cat.color}}>₹{fmt(cat.total)}</span>
                      </div>
                    </div>
                    <div style={{height:5,borderRadius:10,background:"#0f172a",overflow:"hidden"}}>
                      <div style={{height:"100%",borderRadius:10,background:`linear-gradient(90deg,${cat.color}99,${cat.color})`,width:`${pct}%`,transition:"width 0.5s ease"}}/>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary stats */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}} className="stat-grid">
              {[
                {label:"Total Transactions",val:expenses.length,icon:"📊",color:"#6366f1"},
                {label:"Avg. Expense",val:`₹${fmt(expenses.filter(e=>e.type==="expense").length > 0 ? Math.round(expense/expenses.filter(e=>e.type==="expense").length) : 0)}`,icon:"📉",color:"#f87171"},
                {label:"Savings Rate",val:`${savingsRate}%`,icon:"💰",color:"#4ade80"},
                {label:"Top Category",val:catBreakdown[0]?.label || "—",icon:catBreakdown[0]?.icon || "📦",color:"#f97316"},
              ].map(stat => (
                <div key={stat.label} style={{background:"rgba(15,23,42,0.8)",border:"1px solid #0f172a",borderRadius:14,padding:"16px",display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:18}}>{stat.icon}</span>
                    <span style={{fontSize:10.5,color:"#64748b",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.4px"}}>{stat.label}</span>
                  </div>
                  <span style={{fontSize:18,fontWeight:700,color:stat.color}}>{stat.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* FOOTER */}
      <div style={{
        textAlign: "center",
        padding: "18px 10px",
        borderTop: "1px solid #0f172a",
        marginTop: 20,
        color: "#475569",
        fontSize: 12
      }}>
        © 2026 SpendSmart • All rights reserved
      </div>
    </div>
  );
}

const s = {
  root: {
    minHeight: "100vh",
    background: "#060b18",
    fontFamily: "'Sora', sans-serif",
    color: "#e2e8f0",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    background: "rgba(30,41,59,0.8)",
    border: "1px solid #1e293b",
    borderRadius: 11,
    color: "#e2e8f0",
    fontSize: 13.5,
    fontFamily: "'Sora', sans-serif",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    marginBottom: 10,
  },
};