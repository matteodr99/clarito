"use client";

import { useState, useEffect } from "react";

type Task = {
  id: number;
  title: string;
  description?: string;
  priority: "high" | "medium" | "low";
  category: string;
  estimated_time?: string;
  status: "todo" | "in progress" | "done";
  created_at: string;
};

const priorityConfig = {
  high: { label: "High", colorLight: "#dc2626", bgLight: "#fee2e2", colorDark: "#f87171", bgDark: "rgba(220,38,38,0.15)" },
  medium: { label: "Medium", colorLight: "#d97706", bgLight: "#fef3c7", colorDark: "#fbbf24", bgDark: "rgba(217,119,6,0.15)" },
  low: { label: "Low", colorLight: "#16a34a", bgLight: "#dcfce7", colorDark: "#4ade80", bgDark: "rgba(22,163,74,0.15)" },
};

const statusConfig = {
  todo: { label: "To Do", next: "in progress", colorLight: "#6366f1", bgLight: "#eef2ff", colorDark: "#a5b4fc", bgDark: "rgba(99,102,241,0.2)" },
  "in progress": { label: "In Progress", next: "done", colorLight: "#d97706", bgLight: "#fef3c7", colorDark: "#fbbf24", bgDark: "rgba(217,119,6,0.2)" },
  done: { label: "Done", next: "todo", colorLight: "#16a34a", bgLight: "#dcfce7", colorDark: "#4ade80", bgDark: "rgba(22,163,74,0.2)" },
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "todo" | "in progress" | "done">("all");
  const [dark, setDark] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL || "";

  useEffect(() => { fetchTasks(); }, []);

  const t = {
    bg: dark ? "#0a0a0f" : "#f5f5f7",
    surface: dark ? "#12121a" : "#ffffff",
    border: dark ? "#1e1e2e" : "#e5e5ea",
    borderHover: dark ? "#2e2e4e" : "#c7c7cc",
    text: dark ? "#f0f0ff" : "#111111",
    textSub: dark ? "#aaaacc" : "#555555",
    textMuted: dark ? "#666688" : "#999999",
    inputBg: dark ? "#0d0d14" : "#fafafa",
    filterActive: dark ? "#eef2ff11" : "#eef2ff",
    headerBg: dark ? "rgba(10,10,15,0.9)" : "rgba(245,245,247,0.9)",
    accent: "#6366f1",
  };

  async function fetchTasks() {
    const res = await fetch(`${API}/tasks`);
    console.log('--------------------', `${API}/tasks`)
    const data = await res.json();
    setTasks(data);
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch(`${API}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const newTask = await res.json();
      setTasks([newTask, ...tasks]);
      setTitle("");
      setDescription("");
      setShowForm(false);
    } finally {
      setAiLoading(false);
    }
  }

  async function updateStatus(task: Task) {
    const nextStatus = statusConfig[task.status].next;
    const res = await fetch(`${API}/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const updated = await res.json();
    setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)));
  }

  async function deleteTask(id: number) {
    await fetch(`${API}/tasks/${id}`, { method: "DELETE" });
    setTasks(tasks.filter((t) => t.id !== id));
  }

  const filtered = filter === "all" ? tasks : tasks.filter((task) => task.status === filter);

  return (
    <main style={{ minHeight: "100vh", background: t.bg, fontFamily: "'DM Mono', 'Courier New', monospace", color: t.text, transition: "background 0.3s, color 0.3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        .task-card { animation: slideIn 0.3s ease; }
        .toggle-btn {
          cursor: pointer;
          background: transparent;
          border: none;
          font-size: 20px;
          transition: transform 0.3s ease;
          padding: 4px;
        }
        .toggle-btn:hover { transform: rotate(20deg) scale(1.1); }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${t.border}`,
        padding: "20px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        background: t.headerBg,
        backdropFilter: "blur(12px)",
        zIndex: 10,
        transition: "background 0.3s, border-color 0.3s",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "26px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>Clarito</h1>
          <span style={{ color: t.textMuted, fontSize: "12px" }}>/ task manager</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ background: dark ? "rgba(99,102,241,0.2)" : "#eef2ff", color: "#6366f1", borderRadius: "6px", fontSize: "11px", padding: "4px 10px", fontWeight: 600 }}>AI ✦</span>

          {/* Dark/Light toggle */}
          <button className="toggle-btn" onClick={() => setDark(!dark)} title={dark ? "Light mode" : "Dark mode"}>
            {dark ? "☀️" : "🌙"}
          </button>

          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              cursor: "pointer",
              border: "none",
              borderRadius: "8px",
              background: "#6366f1",
              color: "#fff",
              padding: "10px 20px",
              fontFamily: "'DM Mono', monospace",
              fontSize: "12px",
              fontWeight: 500,
              letterSpacing: "0.05em",
              transition: "opacity 0.15s",
            }}
          >
            {showForm ? "✕ close" : "+ new task"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 24px" }}>

        {/* Form */}
        {showForm && (
          <form onSubmit={createTask} style={{
            background: t.surface,
            border: `1px solid ${dark ? "rgba(99,102,241,0.3)" : "#c7d2fe"}`,
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "32px",
            animation: "slideIn 0.2s ease",
            boxShadow: dark ? "0 4px 20px rgba(99,102,241,0.1)" : "0 4px 20px rgba(99,102,241,0.08)",
            transition: "background 0.3s, border-color 0.3s",
          }}>
            <p style={{ color: "#6366f1", fontSize: "11px", letterSpacing: "0.08em", marginBottom: "16px", fontWeight: 600 }}>
              ✦ AI will analyze your task and suggest priority and category
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                style={{
                  width: "100%",
                  background: t.inputBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: "8px",
                  color: t.text,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "14px",
                  padding: "12px 16px",
                  outline: "none",
                  transition: "border-color 0.2s, background 0.3s",
                }}
                placeholder="Task title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <textarea
                style={{
                  width: "100%",
                  background: t.inputBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: "8px",
                  color: t.text,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "14px",
                  padding: "12px 16px",
                  outline: "none",
                  resize: "none",
                  transition: "border-color 0.2s, background 0.3s",
                }}
                placeholder="Description (optional)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  cursor: "pointer", background: "transparent", border: `1px solid ${t.border}`,
                  borderRadius: "8px", color: t.textSub, padding: "8px 14px",
                  fontFamily: "'DM Mono', monospace", fontSize: "12px", transition: "all 0.15s",
                }}>cancel</button>
                <button type="submit" disabled={aiLoading} style={{
                  cursor: "pointer", border: "none", borderRadius: "8px", background: "#6366f1",
                  color: "#fff", padding: "10px 20px", fontFamily: "'DM Mono', monospace",
                  fontSize: "12px", fontWeight: 500, display: "flex", alignItems: "center",
                  gap: "8px", minWidth: "140px", justifyContent: "center", transition: "opacity 0.15s",
                }}>
                  {aiLoading ? <><span className="spinner"></span> AI analyzing...</> : "✦ create task"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ color: t.textMuted, fontSize: "11px", marginRight: "4px" }}>filter:</span>
          {(["all", "todo", "in progress", "done"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              cursor: "pointer",
              background: filter === f ? (dark ? "rgba(99,102,241,0.2)" : "#eef2ff") : "transparent",
              border: `1px solid ${filter === f ? "#6366f1" : t.border}`,
              borderRadius: "6px",
              color: filter === f ? "#6366f1" : t.textMuted,
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              padding: "6px 12px",
              fontWeight: filter === f ? 600 : 400,
              transition: "all 0.15s",
              letterSpacing: "0.05em",
            }}>
              {f}
            </button>
          ))}
          <span style={{ marginLeft: "auto", color: t.textMuted, fontSize: "11px" }}>{filtered.length} tasks</span>
        </div>

        {/* Tasks */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", color: t.textMuted }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>◎</div>
              <p style={{ fontSize: "13px" }}>no tasks found</p>
            </div>
          )}
          {filtered.map((task) => {
            const p = priorityConfig[task.priority] || priorityConfig.medium;
            const s = statusConfig[task.status];
            return (
              <div key={task.id} className="task-card" style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: "14px",
                padding: "20px",
                transition: "all 0.2s ease",
                opacity: task.status === "done" ? 0.5 : 1,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <span style={{
                        background: dark ? p.bgDark : p.bgLight,
                        color: dark ? p.colorDark : p.colorLight,
                        borderRadius: "5px", fontSize: "10px", padding: "3px 8px",
                        letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600,
                      }}>{p.label}</span>
                      <span style={{
                        background: dark ? "rgba(255,255,255,0.06)" : "#f5f5f7",
                        color: t.textSub,
                        borderRadius: "5px", fontSize: "10px", padding: "3px 8px",
                        letterSpacing: "0.05em", fontWeight: 500,
                      }}>{task.category}</span>
                      {task.estimated_time && (
                        <span style={{ color: t.textMuted, fontSize: "11px" }}>⏱ {task.estimated_time}</span>
                      )}
                    </div>
                    <p style={{
                      fontSize: "15px", fontWeight: 500, marginBottom: "4px", color: t.text,
                      textDecoration: task.status === "done" ? "line-through" : "none",
                    }}>{task.title}</p>
                    {task.description && (
                      <p style={{ fontSize: "12px", color: t.textSub, lineHeight: 1.6 }}>{task.description}</p>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    <button onClick={() => updateStatus(task)} style={{
                      cursor: "pointer",
                      borderRadius: "6px",
                      fontSize: "11px",
                      padding: "4px 10px",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      border: "none",
                      fontFamily: "'DM Mono', monospace",
                      fontWeight: 600,
                      transition: "all 0.15s",
                      background: dark ? s.bgDark : s.bgLight,
                      color: dark ? s.colorDark : s.colorLight,
                    }}>{s.label}</button>
                    <button onClick={() => deleteTask(task.id)} style={{
                      cursor: "pointer", background: "transparent", border: "none",
                      color: t.textMuted, fontSize: "20px", padding: "4px",
                      transition: "color 0.15s", lineHeight: 1,
                    }}>×</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}