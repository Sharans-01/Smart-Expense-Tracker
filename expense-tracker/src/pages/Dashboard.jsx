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
  { label: "Food",          icon: "🍔", color: "#f97316" },
  { label: "Travel",        icon: "✈️",  color: "#6366f1" },
  { label: "Shopping",      icon: "🛍️", color: "#ec4899" },
  { label: "Health",        icon: "💊", color: "#22c55e" },
  { label: "Bills",         icon: "📄", color: "#eab308" },
  { label: "Entertainment", icon: "🎬", color: "#8b5cf6" },
  { label: "Salary",        icon: "💼", color: "#14b8a6" },
  { label: "Other",         icon: "📦", color: "#94a3b8" },
];

const getCat = (label) => CATEGORIES.find(c => c.label === label) || CATEGORIES[7];

/* ─── Toast ───────────────────────────────────────────────────────────────── */
function Toast({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type} ${t.leaving ? "toast-out" : "toast-in"}`}>
          <span className="toast-icon">
            {t.type === "error" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="rgba(239,68,68,0.2)" stroke="#f87171" strokeWidth="1.5"/>
                <path d="M12 8v4M12 16h.01" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="rgba(34,197,94,0.2)" stroke="#4ade80" strokeWidth="1.5"/>
                <path d="M8 12l3 3 5-5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </span>
          <span className="toast-msg">{t.message}</span>
          <button className="toast-close" onClick={() => removeToast(t.id)}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <div className="toast-bar" style={{
            background: t.type === "error" ? "#f87171" : "#4ade80",
            animation: `toastProgress ${t.duration}ms linear forwards`,
          }}/>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = "error", duration = 3500) => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type, duration, leaving: false }]);
    setTimeout(() => {
      setToasts(p => p.map(t => t.id === id ? { ...t, leaving: true } : t));
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 300);
    }, duration);
  };
  const removeToast = (id) => {
    setToasts(p => p.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 300);
  };
  return { toasts, addToast, removeToast };
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = n => new Intl.NumberFormat("en-IN").format(Math.abs(n));

function SkeletonRow() {
  return (
    <div className="skeleton-row">
      <div className="skel skel-icon"/>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
        <div className="skel" style={{height:11,width:"45%",borderRadius:6}}/>
        <div className="skel" style={{height:9,width:"28%",borderRadius:6}}/>
      </div>
      <div className="skel" style={{height:13,width:64,borderRadius:6}}/>
    </div>
  );
}

/* ─── Dashboard ───────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useContext(AuthContext);

  const [amount,     setAmount]     = useState("");
  const [note,       setNote]       = useState("");
  const [category,   setCategory]   = useState("Food");
  const [type,       setType]       = useState("expense");
  const [expenses,   setExpenses]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [adding,     setAdding]     = useState(false);
  const [search,     setSearch]     = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showForm,   setShowForm]   = useState(false);
  const [activeTab,  setActiveTab]  = useState("transactions");
  const [deletingId, setDeletingId] = useState(null);
  const [focused,    setFocused]    = useState(null);
  const { toasts, addToast, removeToast } = useToast();

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "expenses"), where("userId", "==", user.uid));
      const data = await getDocs(q);
      const docs = data.docs.map(d => ({ ...d.data(), id: d.id }));
      docs.sort((a, b) => b.date?.toDate?.() - a.date?.toDate?.());
      setExpenses(docs);
    } catch (e) {
      addToast("Failed to load transactions.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchExpenses(); }, [user]);

  const addExpense = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return addToast("Please enter a valid amount.");
    }
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
      setAmount(""); setNote(""); setShowForm(false);
      addToast(
        `${type === "expense" ? "Expense" : "Income"} of ₹${fmt(Number(amount))} added!`,
        "success"
      );
      fetchExpenses();
    } catch (e) {
      addToast("Failed to add transaction. Try again.");
    } finally {
      setAdding(false);
    }
  };

  const deleteExpense = async (id) => {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "expenses", id));
      setExpenses(prev => prev.filter(e => e.id !== id));
      addToast("Transaction deleted.", "success", 2000);
    } catch (e) {
      addToast("Failed to delete. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // Derived stats
  const total       = expenses.reduce((s, e) => e.type === "expense" ? s - e.amount : s + e.amount, 0);
  const income      = expenses.filter(e => e.type === "income").reduce((a, b) => a + b.amount, 0);
  const expense     = expenses.filter(e => e.type === "expense").reduce((a, b) => a + b.amount, 0);
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
  const avgExpense  = expenses.filter(e => e.type === "expense").length > 0
    ? Math.round(expense / expenses.filter(e => e.type === "expense").length) : 0;

  const catBreakdown = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.label && e.type === "expense")
                   .reduce((a, b) => a + b.amount, 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const filtered = expenses.filter(e => {
    const matchType   = filterType === "all" || e.type === filterType;
    const matchSearch = !search
      || e.category.toLowerCase().includes(search.toLowerCase())
      || e.note?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  // Group transactions by date label
  const groupedFiltered = filtered.reduce((acc, e) => {
    const d = e.date?.toDate ? e.date.toDate() : new Date();
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    const isSameDay = (a, b) => a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
    const label = isSameDay(d, today) ? "Today"
      : isSameDay(d, yesterday) ? "Yesterday"
      : d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    if (!acc[label]) acc[label] = [];
    acc[label].push(e);
    return acc;
  }, {});

  return (
    <>
      <style>{globalCSS}</style>
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="dash-root">
        {/* Background */}
        <div className="dash-bg-grid"/>
        <div className="dash-glow dash-glow-1"/>
        <div className="dash-glow dash-glow-2"/>

        {/* ── Top Nav ── */}
        <header className="dash-nav">
          <div className="nav-inner">
            <div className="nav-brand">
              <img src={logo} alt="logo" className="nav-logo"/>
              <span className="nav-title">Expenzo</span>
            </div>
            <div className="nav-right">
              <div className="nav-user">
                <div className="nav-avatar">
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="nav-user-info">
                  <span className="nav-greeting">Welcome Back</span>
                  <span className="nav-email">{user?.email?.split("@")[0]}</span>
                </div>
              </div>
              <button className="logout-btn" onClick={() => signOut(auth)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── Main ── */}
        <main className="dash-main">

          {/* ── Hero Balance Card ── */}
          <section className="hero-card fade-up" style={{"--delay":"0.05s"}}>
            <div className="hero-glow-orb"/>
            <div className="hero-glow-orb hero-glow-orb-2"/>
            <div className="hero-top">
              <div>
                <p className="hero-label">Net Balance</p>
                <div className="hero-balance">
                  <span className="hero-currency">₹</span>
                  <span className={`hero-amount ${total < 0 ? "negative" : ""}`}>{fmt(total)}</span>
                  {total < 0 && <span className="hero-deficit-tag">deficit</span>}
                </div>
              </div>
              <div className="hero-month-badge">
                {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </div>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-icon income-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
                  </svg>
                </div>
                <div>
                  <p className="hero-stat-label">Income</p>
                  <p className="hero-stat-val income-val">₹{fmt(income)}</p>
                </div>
              </div>
              <div className="hero-stat-divider"/>
              <div className="hero-stat">
                <div className="hero-stat-icon expense-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
                  </svg>
                </div>
                <div>
                  <p className="hero-stat-label">Expenses</p>
                  <p className="hero-stat-val expense-val">₹{fmt(expense)}</p>
                </div>
              </div>
              <div className="hero-stat-divider"/>
              <div className="hero-stat">
                <div className="hero-stat-icon savings-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>
                  </svg>
                </div>
                <div>
                  <p className="hero-stat-label">Saved</p>
                  <p className={`hero-stat-val ${savingsRate >= 0 ? "income-val" : "expense-val"}`}>{savingsRate}%</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Add Transaction Button ── */}
          <button
            className={`add-btn fade-up ${showForm ? "add-btn-cancel" : ""}`}
            style={{"--delay":"0.1s"}}
            onClick={() => setShowForm(v => !v)}
          >
            <span className="add-btn-icon-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                style={{ transform: showForm ? "rotate(45deg)" : "rotate(0)", transition: "transform 0.25s ease" }}>
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </span>
            {showForm ? "Cancel" : "Add Transaction"}
          </button>

          {/* ── Add Form ── */}
          {showForm && (
            <div className="form-card slide-in">
              <div className="form-card-header">
                <h3 className="form-card-title">New Transaction</h3>
                <div className="type-toggle">
                  {["expense", "income"].map(t => (
                    <button
                      key={t}
                      className={`type-btn type-btn-${t} ${type === t ? "active" : ""}`}
                      onClick={() => setType(t)}
                    >
                      {t === "expense" ? (
                        <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg> Expense</>
                      ) : (
                        <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg> Income</>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className="form-row-duo">
                <div className="field">
                  <label className="field-label">Amount</label>
                  <div className={`input-wrap ${focused === "amount" ? "focused" : ""}`}>
                    <span className="input-prefix">₹</span>
                    <input
                      className="text-input amount-input"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      onFocus={() => setFocused("amount")}
                      onBlur={() => setFocused(null)}
                    />
                  </div>
                </div>
                <div className="field">
                  <label className="field-label">Note <span className="optional">(optional)</span></label>
                  <div className={`input-wrap ${focused === "note" ? "focused" : ""}`}>
                    <input
                      className="text-input"
                      type="text"
                      placeholder="What's this for?"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      onFocus={() => setFocused("note")}
                      onBlur={() => setFocused(null)}
                      onKeyDown={e => { if (e.key === "Enter") addExpense(); }}
                    />
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="field" style={{marginTop: 4}}>
                <label className="field-label">Category</label>
                <div className="cat-grid">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.label}
                      className={`cat-btn ${category === cat.label ? "cat-btn-active" : ""}`}
                      style={{ "--cat-color": cat.color }}
                      onClick={() => setCategory(cat.label)}
                    >
                      <span className="cat-emoji">{cat.icon}</span>
                      <span className="cat-label">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                className={`submit-btn submit-btn-${type} ${adding ? "loading" : ""}`}
                onClick={addExpense}
                disabled={adding}
              >
                {adding ? (
                  <span className="spinner"/>
                ) : (
                  <>
                    {type === "expense" ? "Add Expense" : "Add Income"}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{marginLeft:8}}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── Tabs ── */}
          <div className="tabs fade-up" style={{"--delay":"0.15s"}}>
            {[
              { id: "transactions", label: "Transactions",
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              },
              { id: "analytics", label: "Analytics",
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              },
            ].map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? "tab-active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}{tab.label}
                {tab.id === "transactions" && expenses.length > 0 && (
                  <span className="tab-count">{expenses.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Transactions Tab ── */}
          {activeTab === "transactions" && (
            <div className="fade-up" style={{"--delay":"0.2s"}}>
              {/* Search + filter bar */}
              <div className="filter-bar">
                <div className={`input-wrap search-wrap ${focused === "search" ? "focused" : ""}`}>
                  <span className="input-icon">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </span>
                  <input
                    className="text-input"
                    placeholder="Search by category or note…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onFocus={() => setFocused("search")}
                    onBlur={() => setFocused(null)}
                  />
                  {search && (
                    <button className="clear-search" onClick={() => setSearch("")}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  )}
                </div>
                <div className="filter-pills">
                  {["all", "expense", "income"].map(f => (
                    <button
                      key={f}
                      className={`filter-pill ${filterType === f ? `pill-active pill-${f}` : ""}`}
                      onClick={() => setFilterType(f)}
                    >
                      {f === "all" ? "All" : f === "expense" ? "↓ Expenses" : "↑ Income"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction list */}
              <div className="tx-list">
                {loading ? (
                  [1,2,3,4].map(i => <SkeletonRow key={i}/>)
                ) : filtered.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <p className="empty-title">No transactions found</p>
                    <p className="empty-sub">
                      {search ? "Try a different search term" : "Add your first transaction above"}
                    </p>
                  </div>
                ) : (
                  Object.entries(groupedFiltered).map(([dateLabel, items]) => (
                    <div key={dateLabel} className="tx-group">
                      <div className="tx-group-header">
                        <span className="tx-group-label">{dateLabel}</span>
                        <span className="tx-group-total">
                          {items.reduce((s,e) => e.type === "expense" ? s - e.amount : s + e.amount, 0) >= 0
                            ? <span style={{color:"#4ade80"}}>+₹{fmt(Math.abs(items.reduce((s,e)=>e.type==="expense"?s-e.amount:s+e.amount,0)))}</span>
                            : <span style={{color:"#f87171"}}>-₹{fmt(Math.abs(items.reduce((s,e)=>e.type==="expense"?s-e.amount:s+e.amount,0)))}</span>
                          }
                        </span>
                      </div>
                      {items.map((e, i) => {
                        const cat = getCat(e.category);
                        const timeStr = e.date?.toDate
                          ? e.date.toDate().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                          : "";
                        return (
                          <div
                            key={e.id}
                            className="tx-item"
                            style={{
                              animationDelay: `${i * 0.04}s`,
                              opacity: deletingId === e.id ? 0.35 : 1,
                              transition: "opacity 0.2s",
                            }}
                          >
                            <div className="tx-cat-icon" style={{ "--cat-color": cat.color }}>
                              {cat.icon}
                            </div>
                            <div className="tx-info">
                              <div className="tx-top-row">
                                <span className="tx-category">{e.category}</span>
                                <span className={`tx-badge tx-badge-${e.type}`}>{e.type}</span>
                              </div>
                              <div className="tx-bottom-row">
                                {e.note && <span className="tx-note">{e.note}</span>}
                                {timeStr && <span className="tx-time">{timeStr}</span>}
                              </div>
                            </div>
                            <div className="tx-right">
                              <span className={`tx-amount ${e.type === "expense" ? "tx-expense" : "tx-income"}`}>
                                {e.type === "expense" ? "−" : "+"}₹{fmt(e.amount)}
                              </span>
                              <button
                                className="delete-btn"
                                onClick={() => deleteExpense(e.id)}
                                disabled={deletingId === e.id}
                              >
                                {deletingId === e.id ? (
                                  <span className="spinner" style={{width:11,height:11,borderWidth:1.5}}/>
                                ) : (
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6l-1 14H6L5 6"/>
                                    <path d="M10 11v6M14 11v6"/>
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Analytics Tab ── */}
          {activeTab === "analytics" && (
            <div className="analytics-grid fade-up" style={{"--delay":"0.15s"}}>

              {/* Summary cards */}
              <div className="summary-cards">
                {[
                  { label: "Transactions", val: expenses.length, icon: "📊", color: "#6366f1", sub: `${expenses.filter(e=>e.type==="expense").length} expenses, ${expenses.filter(e=>e.type==="income").length} income` },
                  { label: "Avg Expense",  val: `₹${fmt(avgExpense)}`, icon: "📉", color: "#f87171", sub: "per transaction" },
                  { label: "Savings Rate", val: `${savingsRate}%`, icon: "💰", color: savingsRate >= 0 ? "#4ade80" : "#f87171", sub: savingsRate >= 20 ? "Great job!" : savingsRate >= 0 ? "Keep going" : "Over budget" },
                  { label: "Top Category", val: catBreakdown[0]?.label || "—", icon: catBreakdown[0]?.icon || "📦", color: catBreakdown[0]?.color || "#94a3b8", sub: catBreakdown[0] ? `₹${fmt(catBreakdown[0].total)}` : "No data" },
                ].map(stat => (
                  <div key={stat.label} className="summary-card">
                    <div className="summary-card-top">
                      <span className="summary-emoji">{stat.icon}</span>
                      <span className="summary-label">{stat.label}</span>
                    </div>
                    <p className="summary-val" style={{ color: stat.color }}>{stat.val}</p>
                    <p className="summary-sub">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Category breakdown */}
              <div className="breakdown-card">
                <div className="breakdown-header">
                  <h3 className="breakdown-title">Spending Breakdown</h3>
                  <span className="breakdown-total">₹{fmt(expense)} total</span>
                </div>
                {catBreakdown.length === 0 ? (
                  <div className="empty-state" style={{padding:"28px 0"}}>
                    <div className="empty-icon" style={{fontSize:28}}>📊</div>
                    <p className="empty-title" style={{fontSize:13}}>No expense data yet</p>
                  </div>
                ) : (
                  <div className="breakdown-list">
                    {catBreakdown.map((cat, i) => {
                      const pct = expense > 0 ? Math.round((cat.total / expense) * 100) : 0;
                      return (
                        <div key={cat.label} className="breakdown-row" style={{ animationDelay: `${i * 0.06}s` }}>
                          <div className="breakdown-row-top">
                            <div className="breakdown-cat">
                              <span className="breakdown-emoji">{cat.icon}</span>
                              <span className="breakdown-cat-name">{cat.label}</span>
                            </div>
                            <div className="breakdown-amounts">
                              <span className="breakdown-pct">{pct}%</span>
                              <span className="breakdown-amt" style={{ color: cat.color }}>₹{fmt(cat.total)}</span>
                            </div>
                          </div>
                          <div className="breakdown-bar-bg">
                            <div
                              className="breakdown-bar-fill"
                              style={{
                                width: `${pct}%`,
                                background: `linear-gradient(90deg, ${cat.color}88, ${cat.color})`,
                                animationDelay: `${i * 0.08}s`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Income vs Expense visual */}
              {(income > 0 || expense > 0) && (
                <div className="ratio-card">
                  <h3 className="breakdown-title" style={{marginBottom:16}}>Income vs Expenses</h3>
                  <div className="ratio-bar-wrap">
                    <div className="ratio-bar">
                      {income > 0 && (
                        <div className="ratio-income" style={{ width: `${income/(income+expense)*100}%` }}>
                          <span className="ratio-label-inner">Income</span>
                        </div>
                      )}
                      {expense > 0 && (
                        <div className="ratio-expense" style={{ width: `${expense/(income+expense)*100}%` }}>
                          <span className="ratio-label-inner">Expenses</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ratio-legend">
                    <div className="ratio-leg-item">
                      <span className="ratio-dot" style={{background:"#4ade80"}}/>
                      <span>Income</span>
                      <strong>₹{fmt(income)}</strong>
                    </div>
                    <div className="ratio-leg-item">
                      <span className="ratio-dot" style={{background:"#f87171"}}/>
                      <span>Expenses</span>
                      <strong>₹{fmt(expense)}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ── Footer ── */}
        <footer className="dash-footer">
          <span>© 2026 Expenzo</span>
          <span className="footer-dot">·</span>
          <span>All rights reserved</span>
        </footer>
      </div>
    </>
  );
}

/* ─── Global CSS ──────────────────────────────────────────────────────────── */
const globalCSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Syne:wght@600;700;800&display=swap');

@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@500;700&family=Roboto+Slab:wght@100..900&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@500;700&family=Roboto+Slab:wght@100..900&display=swap");


*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'DM Sans', sans-serif; }

:root {
  --indigo: #6366f1; --purple: #8b5cf6;
  --bg: #05080f; --surface: rgba(12,18,32,0.85);
  --border: rgba(99,102,241,0.15); --border-subtle: #0f172a;
  --text: #e2e8f0; --muted: #64748b; --subtle: #1e293b;
}

::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
input::placeholder, textarea::placeholder { color: #334155; }
select option { background: #0f172a; color: #e2e8f0; }

/* ── Animations ── */
@keyframes fadeUp       { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes slideIn      { from{opacity:0;transform:translateY(14px)scale(.98)} to{opacity:1;transform:translateY(0)scale(1)} }
@keyframes spin         { to{transform:rotate(360deg)} }
@keyframes pulse        { 0%,100%{opacity:1} 50%{opacity:.4} }
@keyframes glow1f       { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(30px,-20px)scale(1.08)} }
@keyframes glow2f       { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(-20px,30px)scale(1.1)} }
@keyframes barFill      { from{width:0} to{width:var(--w)} }
@keyframes toastIn      { from{opacity:0;transform:translateX(20px)scale(.96)} to{opacity:1;transform:translateX(0)scale(1)} }
@keyframes toastOut     { from{opacity:1;transform:translateX(0)scale(1)} to{opacity:0;transform:translateX(20px)scale(.96)} }
@keyframes toastProgress{ from{transform:scaleX(1)} to{transform:scaleX(0)} }

.fade-up { animation: fadeUp .5s ease var(--delay, 0s) both; }
.slide-in { animation: slideIn .3s ease both; }

/* ── Toast ── */
.toast-container { position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;max-width:360px;width:calc(100vw - 40px); }
.toast { position:relative;display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;backdrop-filter:blur(16px);overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4);font-family:'DM Sans',sans-serif; }
.toast-error   { background:rgba(20,10,10,.92);border:1px solid rgba(248,113,113,.3); }
.toast-success { background:rgba(10,20,12,.92);border:1px solid rgba(74,222,128,.3); }
.toast-in  { animation: toastIn .35s cubic-bezier(.34,1.56,.64,1) both; }
.toast-out { animation: toastOut .3s ease forwards; }
.toast-icon  { flex-shrink:0;display:flex;align-items:center; }
.toast-msg   { flex:1;font-size:13px;color:#e2e8f0;line-height:1.45;font-weight:450; }
.toast-close { flex-shrink:0;background:none;border:none;color:#64748b;cursor:pointer;display:flex;align-items:center;padding:2px;border-radius:4px; }
.toast-bar   { position:absolute;bottom:0;left:0;height:2px;width:100%;transform-origin:left; }

/* ── Root ── */
.dash-root {
  min-height: 100vh; background: var(--bg);
  font-family: 'DM Sans', sans-serif; color: var(--text);
  position: relative; overflow-x: hidden;
}
.dash-bg-grid {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background-image: linear-gradient(rgba(99,102,241,.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(99,102,241,.03) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%);
}
.dash-glow { position:fixed;border-radius:50%;pointer-events:none;z-index:0; }
.dash-glow-1 { width:700px;height:700px;top:-200px;left:-150px;background:radial-gradient(circle,rgba(99,102,241,.1) 0%,transparent 70%);animation:glow1f 11s ease-in-out infinite; }
.dash-glow-2 { width:500px;height:500px;bottom:-100px;right:-100px;background:radial-gradient(circle,rgba(168,85,247,.08) 0%,transparent 70%);animation:glow2f 13s ease-in-out infinite; }

/* ── Nav ── */
.dash-nav {
  position: sticky; top: 0; z-index: 100;
  background: rgba(5,8,15,.85); backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-subtle);
}
.nav-inner {
  max-width: 860px; margin: 0 auto;
  padding: 0 20px; height: 60px;
  display: flex; align-items: center; justify-content: space-between;
}
.nav-brand { display:flex;align-items:center;gap:10px; }
.nav-logo   { width:34px;height:34px;border-radius:10px;object-fit:cover;box-shadow:0 3px 12px rgba(99,102,241,.3); }
.nav-title  { font-family:'Roboto Slab',sans-serif;font-size:18px;font-weight:800;color:#f1f5f9;letter-spacing:-.5px; }

.nav-right  { display:flex;align-items:center;gap:12px; }
.nav-user   { display:none;align-items:center;gap:10px; }
@media(min-width:520px){ .nav-user{display:flex;} }
.nav-avatar {
  width:34px;height:34px;border-radius:10px;
  background:linear-gradient(135deg,var(--indigo),var(--purple));
  display:flex;align-items:center;justify-content:center;
  font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:#fff;
  box-shadow:0 3px 12px rgba(99,102,241,.35);
}
.nav-user-info { display:flex;flex-direction:column; }
.nav-greeting  { font-size:10.5px;color:var(--muted);font-weight:500; }
.nav-email     { font-size:13px;color:#cbd5e1;font-weight:600; }

.logout-btn {
  display:flex;align-items:center;gap:6px;
  padding:8px 14px;border-radius:9px;cursor:pointer;
  background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.18);
  color:#f87171;font-size:12.5px;font-weight:600;
  font-family:'DM Sans',sans-serif;
  transition:background .15s,border-color .15s;
}
.logout-btn:hover { background:rgba(239,68,68,.16);border-color:rgba(239,68,68,.3); }
.logout-btn span { display:none; }
@media(min-width:420px){ .logout-btn span{display:inline;} }

/* ── Main ── */
.dash-main {
  position: relative; z-index: 1;
  max-width: 860px; margin: 0 auto;
  padding: 24px 16px 80px;
  display: flex; flex-direction: column; gap: 14px;
}

/* ── Hero Card ── */
.hero-card {
  background: linear-gradient(140deg, #14103a 0%, #1e1550 45%, #130e35 100%);
  border: 1px solid rgba(99,102,241,.3);
  border-radius: 22px; padding: 26px 24px 22px;
  position: relative; overflow: hidden;
}
.hero-glow-orb {
  position:absolute;top:-40px;right:-40px;
  width:180px;height:180px;border-radius:50%;
  background:radial-gradient(circle,rgba(139,92,246,.3) 0%,transparent 70%);
  pointer-events:none;
}
.hero-glow-orb-2 {
  position:absolute;bottom:-30px;left:20px;
  width:120px;height:120px;border-radius:50%;
  background:radial-gradient(circle,rgba(99,102,241,.2) 0%,transparent 70%);
  pointer-events:none;
}
.hero-top { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;flex-wrap:wrap;gap:12px; }
.hero-label { font-size:11px;color:#a5b4fc;font-weight:600;letter-spacing:.8px;text-transform:uppercase;margin-bottom:7px; }
.hero-balance { display:flex;align-items:baseline;gap:5px; }
.hero-currency { font-size:18px;color:#c4b5fd;font-weight:600; }
.hero-amount { font-family:'poppins',sans-serif;font-size:clamp(32px,7vw,44px);font-weight:800;color:#e0e7ff;letter-spacing:-1.5px;line-height:1; }
.hero-amount.negative { color:#fca5a5; }
.hero-deficit-tag { font-size:11px;color:#fca5a5;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.25);padding:2px 8px;border-radius:20px;font-weight:600; }
.hero-month-badge { font-size:12px;color:#6366f1;background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.25);padding:5px 12px;border-radius:20px;font-weight:600;white-space:nowrap;height:fit-content; }

.hero-stats { display:flex;align-items:center;gap:0;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);border-radius:14px;overflow:hidden; }
.hero-stat  { flex:1;display:flex;align-items:center;gap:10px;padding:12px 16px; }
.hero-stat-divider { width:1px;height:36px;background:rgba(255,255,255,.08);flex-shrink:0; }
.hero-stat-icon {
  width:30px;height:30px;border-radius:8px;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
}
.income-icon  { background:rgba(74,222,128,.12); color:#4ade80; }
.expense-icon { background:rgba(248,113,113,.12); color:#f87171; }
.savings-icon { background:rgba(99,102,241,.12);  color:#818cf8; }
.hero-stat-label { font-size:10.5px;color:#94a3b8;font-weight:500;margin-bottom:1px; }
.hero-stat-val   { font-family:'poppins',sans-serif;font-size:15px;font-weight:700; }
.income-val  { color:#4ade80; }
.expense-val { color:#f87171; }

@media(max-width:480px){
  .hero-stat { padding:10px 10px;gap:7px; }
  .hero-stat-icon { display:none; }
  .hero-stat-val { font-size:13px; }
}

/* ── Add Button ── */
.add-btn {
  width:100%;padding:13px;border-radius:13px;
  background:linear-gradient(135deg,var(--indigo),var(--purple));
  border:none;color:#fff;font-size:14.5px;font-weight:600;
  font-family:'DM Sans',sans-serif;cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:10px;
  box-shadow:0 4px 20px rgba(99,102,241,.35);
  transition:transform .15s,box-shadow .15s;
  position:relative;overflow:hidden;
}
.add-btn::before { content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.1) 0%,transparent 60%);opacity:0;transition:opacity .2s; }
.add-btn:hover { transform:translateY(-1px);box-shadow:0 8px 28px rgba(99,102,241,.5); }
.add-btn:hover::before { opacity:1; }
.add-btn:active { transform:translateY(0); }
.add-btn-cancel { background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);color:#f87171;box-shadow:none; }
.add-btn-cancel:hover { background:rgba(239,68,68,.14);box-shadow:none;transform:none; }
.add-btn-icon-wrap { display:flex;align-items:center; }

/* ── Form Card ── */
.form-card {
  background: rgba(10,16,30,.9); backdrop-filter:blur(24px);
  border:1px solid var(--border); border-radius:18px;
  padding:22px 20px;
  box-shadow:0 20px 60px rgba(0,0,0,.5);
}
.form-card-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px; }
.form-card-title  { font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:#c4b5fd; }

.type-toggle { display:flex;background:rgba(15,23,42,.8);border-radius:9px;padding:3px;border:1px solid #0f172a; }
.type-btn {
  display:flex;align-items:center;gap:5px;
  padding:7px 14px;border-radius:7px;border:none;cursor:pointer;
  font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:600;
  transition:all .2s;background:transparent;color:#64748b;
}
.type-btn-expense.active { background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;box-shadow:0 2px 8px rgba(239,68,68,.35); }
.type-btn-income.active  { background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;box-shadow:0 2px 8px rgba(34,197,94,.35); }

.form-row-duo { display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px; }
@media(max-width:480px){ .form-row-duo{grid-template-columns:1fr;} }

.field       { display:flex;flex-direction:column;gap:6px; }
.field-label { font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.7px; }
.optional    { font-size:10px;color:#475569;text-transform:none;font-weight:400;letter-spacing:0; }

.input-wrap {
  position:relative;display:flex;align-items:center;
  border:1px solid var(--subtle);border-radius:10px;
  background:rgba(20,28,46,.6);
  transition:border-color .2s,box-shadow .2s,background .2s;
}
.input-wrap.focused { border-color:var(--indigo);box-shadow:0 0 0 3px rgba(99,102,241,.13);background:rgba(25,34,58,.7); }
.input-prefix {
  padding-left:13px;font-weight:700;font-size:16px;color:var(--indigo);
  flex-shrink:0;pointer-events:none;
}
.input-icon  { position:absolute;left:12px;color:#475569;display:flex;align-items:center;pointer-events:none;transition:color .2s; }
.input-wrap.focused .input-icon { color:#818cf8; }
.text-input {
  flex:1;padding:11px 13px;background:transparent;border:none;outline:none;
  color:var(--text);font-size:13.5px;font-family:'DM Sans',sans-serif;font-weight:450;
  caret-color:var(--indigo);
}
.search-wrap .text-input { padding-left:36px; }
.amount-input { font-size:18px;font-weight:700;color:#f1f5f9; }
.clear-search { position:absolute;right:10px;background:none;border:none;cursor:pointer;color:#475569;display:flex;align-items:center;padding:3px;border-radius:5px;transition:color .15s; }
.clear-search:hover { color:#94a3b8; }

/* category grid */
.cat-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:7px; }
@media(max-width:380px){ .cat-grid{grid-template-columns:repeat(4,1fr);} }
.cat-btn {
  padding:9px 4px;border-radius:10px;
  border:1px solid var(--subtle);
  background:rgba(20,28,46,.6);
  cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;
  transition:all .15s;font-family:'DM Sans',sans-serif;
}
.cat-btn:hover { border-color:rgba(255,255,255,.15);background:rgba(30,40,65,.7); }
.cat-btn-active { border-color:var(--cat-color)!important;background:color-mix(in srgb,var(--cat-color) 12%,transparent)!important; }
.cat-emoji { font-size:17px; }
.cat-label { font-size:9.5px;color:#64748b;font-weight:600;text-align:center; }
.cat-btn-active .cat-label { color:var(--cat-color); }

/* submit */
.submit-btn {
  width:100%;margin-top:16px;padding:13px;border-radius:11px;border:none;
  color:#fff;font-size:14px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  transition:transform .15s,box-shadow .15s,opacity .15s;
  position:relative;overflow:hidden;
}
.submit-btn-expense { background:linear-gradient(135deg,#ef4444,#dc2626);box-shadow:0 4px 16px rgba(239,68,68,.35); }
.submit-btn-income  { background:linear-gradient(135deg,#22c55e,#16a34a);box-shadow:0 4px 16px rgba(34,197,94,.35); }
.submit-btn:hover:not(.loading)  { transform:translateY(-1px); }
.submit-btn-expense:hover:not(.loading) { box-shadow:0 8px 24px rgba(239,68,68,.5); }
.submit-btn-income:hover:not(.loading)  { box-shadow:0 8px 24px rgba(34,197,94,.5); }
.submit-btn.loading { opacity:.7;cursor:not-allowed; }
.spinner {
  width:17px;height:17px;border:2px solid rgba(255,255,255,.3);
  border-top-color:#fff;border-radius:50%;
  display:inline-block;animation:spin .7s linear infinite;
}

/* ── Tabs ── */
.tabs { display:flex;gap:6px; }
.tab-btn {
  flex:1;display:flex;align-items:center;justify-content:center;gap:6px;
  padding:11px 8px;border-radius:11px;cursor:pointer;
  font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;
  border:1px solid var(--border-subtle);
  background:rgba(10,16,28,.6);color:#475569;
  transition:all .2s;
}
.tab-btn:hover { border-color:#1e293b;color:#94a3b8; }
.tab-active    { background:rgba(99,102,241,.1)!important;border-color:rgba(99,102,241,.35)!important;color:#a5b4fc!important; }
.tab-count     { font-size:10.5px;background:rgba(99,102,241,.2);color:#818cf8;padding:1px 7px;border-radius:20px;font-weight:700;margin-left:2px; }

/* ── Filter bar ── */
.filter-bar { display:flex;flex-direction:column;gap:8px;margin-bottom:12px; }
.search-wrap { width:100%; }
.filter-pills { display:flex;gap:6px;flex-wrap:wrap; }
.filter-pill {
  padding:6px 13px;border-radius:20px;border:1px solid var(--border-subtle);
  background:rgba(10,16,28,.6);color:#475569;
  font-size:12px;font-weight:600;font-family:'DM Sans',sans-serif;
  cursor:pointer;transition:all .15s;
}
.filter-pill:hover { border-color:#1e293b;color:#94a3b8; }
.pill-active   { border-color:rgba(99,102,241,.4)!important;color:#a5b4fc!important;background:rgba(99,102,241,.1)!important; }
.pill-expense  { border-color:rgba(248,113,113,.35)!important;color:#f87171!important;background:rgba(248,113,113,.08)!important; }
.pill-income   { border-color:rgba(74,222,128,.35)!important;color:#4ade80!important;background:rgba(74,222,128,.08)!important; }

/* ── Transaction list ── */
.tx-list { display:flex;flex-direction:column;gap:4px; }
.tx-group { margin-bottom:6px; }
.tx-group-header {
  display:flex;justify-content:space-between;align-items:center;
  padding:8px 4px 6px;margin-bottom:4px;
  border-bottom:1px solid var(--border-subtle);
}
.tx-group-label { font-size:11.5px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:.5px; }
.tx-group-total { font-size:12px;font-weight:700; }

.tx-item {
  display:flex;align-items:center;gap:12px;
  padding:12px 14px;border-radius:12px;
  background:rgba(10,16,28,.7);border:1px solid var(--border-subtle);
  transition:border-color .15s,background .15s;
  animation:fadeUp .35s ease both;
  cursor:default;
}
.tx-item:hover { border-color:#1e293b;background:rgba(15,22,42,.9); }

.tx-cat-icon {
  width:40px;height:40px;border-radius:10px;flex-shrink:0;
  background:color-mix(in srgb,var(--cat-color) 12%,transparent);
  border:1px solid color-mix(in srgb,var(--cat-color) 28%,transparent);
  display:flex;align-items:center;justify-content:center;font-size:17px;
}

.tx-info { flex:1;min-width:0; }
.tx-top-row    { display:flex;align-items:center;gap:6px;margin-bottom:3px; }
.tx-bottom-row { display:flex;align-items:center;gap:6px; }
.tx-category   { font-size:13.5px;font-weight:600;color:#e2e8f0; }
.tx-badge {
  font-size:9.5px;padding:1.5px 7px;border-radius:20px;font-weight:700;letter-spacing:.2px;
}
.tx-badge-expense { background:rgba(239,68,68,.1);color:#f87171;border:1px solid rgba(239,68,68,.2); }
.tx-badge-income  { background:rgba(34,197,94,.1);color:#4ade80;border:1px solid rgba(34,197,94,.2); }
.tx-note { font-size:11.5px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px; }
.tx-time { font-size:10.5px;color:#334155;flex-shrink:0; }

.tx-right   { display:flex;align-items:center;gap:10px;flex-shrink:0; }
.tx-amount  { font-family:'poppins',sans-serif;font-size:14px;font-weight:700;letter-spacing:-.2px; }
.tx-expense { color:#f87171; }
.tx-income  { color:#4ade80; }

.delete-btn {
  width:28px;height:28px;border-radius:7px;cursor:pointer;
  background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.14);
  color:#f87171;display:flex;align-items:center;justify-content:center;
  transition:all .15s;
}
.delete-btn:hover { background:rgba(239,68,68,.18);border-color:rgba(239,68,68,.3); }

/* ── Empty state ── */
.empty-state { text-align:center;padding:44px 20px; }
.empty-icon  { font-size:36px;margin-bottom:10px; }
.empty-title { font-size:14px;font-weight:600;color:#475569;margin-bottom:4px; }
.empty-sub   { font-size:12px;color:#334155; }

/* ── Skeleton ── */
.skeleton-row { display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;background:rgba(10,16,28,.7);border:1px solid var(--border-subtle);animation:pulse 1.5s ease-in-out infinite; }
.skel         { background:#1e293b;border-radius:6px; }
.skel-icon    { width:40px;height:40px;border-radius:10px;flex-shrink:0; }

/* ── Analytics ── */
.analytics-grid { display:flex;flex-direction:column;gap:14px; }

.summary-cards { display:grid;grid-template-columns:repeat(2,1fr);gap:10px; }
@media(min-width:640px){ .summary-cards{grid-template-columns:repeat(4,1fr);} }

.summary-card {
  background:rgba(10,16,28,.8);border:1px solid var(--border-subtle);
  border-radius:14px;padding:16px;
  display:flex;flex-direction:column;gap:5px;
  transition:border-color .15s;
}
.summary-card:hover { border-color:#1e293b; }
.summary-card-top { display:flex;align-items:center;gap:7px;margin-bottom:2px; }
.summary-emoji    { font-size:16px; }
.summary-label    { font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.5px; }
.summary-val      { font-family:'poppins',sans-serif;font-size:19px;font-weight:800;letter-spacing:-.3px; }
.summary-sub      { font-size:11px;color:#475569; }

.breakdown-card {
  background:rgba(10,16,28,.8);border:1px solid var(--border-subtle);
  border-radius:18px;padding:20px;
}
.breakdown-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:18px; }
.breakdown-title  { font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#e2e8f0; }
.breakdown-total  { font-size:12px;color:#64748b;font-weight:600; }
.breakdown-list   { display:flex;flex-direction:column;gap:13px; }

.breakdown-row       { animation:fadeUp .4s ease both; }
.breakdown-row-top   { display:flex;justify-content:space-between;align-items:center;margin-bottom:7px; }
.breakdown-cat       { display:flex;align-items:center;gap:8px; }
.breakdown-emoji     { font-size:16px; }
.breakdown-cat-name  { font-size:13px;color:#cbd5e1;font-weight:500; }
.breakdown-amounts   { display:flex;align-items:center;gap:10px; }
.breakdown-pct       { font-size:11.5px;color:#475569;font-weight:600; }
.breakdown-amt       { font-size:13px;font-weight:700; }
.breakdown-bar-bg    { height:5px;border-radius:10px;background:rgba(15,23,42,.8);overflow:hidden; }
.breakdown-bar-fill  { height:100%;border-radius:10px;transition:width .6s ease;min-width:2px; }

.ratio-card { background:rgba(10,16,28,.8);border:1px solid var(--border-subtle);border-radius:18px;padding:20px; }
.ratio-bar-wrap { margin-bottom:14px; }
.ratio-bar { display:flex;height:20px;border-radius:10px;overflow:hidden;gap:3px; }
.ratio-income  { background:linear-gradient(90deg,#16a34a,#22c55e);border-radius:10px;display:flex;align-items:center;justify-content:center;transition:width .6s ease;min-width:30px;overflow:hidden; }
.ratio-expense { background:linear-gradient(90deg,#dc2626,#ef4444);border-radius:10px;display:flex;align-items:center;justify-content:center;transition:width .6s ease;min-width:30px;overflow:hidden; }
.ratio-label-inner { font-size:10px;color:rgba(255,255,255,.75);font-weight:700;white-space:nowrap; }
.ratio-legend { display:flex;gap:20px; }
.ratio-leg-item { display:flex;align-items:center;gap:7px;font-size:12.5px;color:#94a3b8; }
.ratio-dot  { width:8px;height:8px;border-radius:50%;flex-shrink:0; }
.ratio-leg-item strong { color:#e2e8f0;font-weight:700;margin-left:2px; }

/* ── Footer ── */
.dash-footer {
  position:relative;z-index:1;
  display:flex;align-items:center;justify-content:center;gap:8px;
  padding:18px;border-top:1px solid var(--border-subtle);
  font-size:12px;color:#334155;
}
.footer-dot { color:#1e293b; }

@media(max-width:380px){
  .dash-main { padding:16px 12px 60px; }
  .cat-grid  { grid-template-columns:repeat(4,1fr); }
}
`;