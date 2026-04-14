"use client";

import { useState, useEffect, useRef } from "react";

type Task = {
  id: number;
  title: string;
  description?: string;
  priority: "high" | "medium" | "low";
  category: string;
  estimated_time?: string;
  status: "todo" | "in progress" | "done";
  order?: number;
  created_at: string;
};

type View = "list" | "calendar";

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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// ─── Calendar ───────────────────────────────────────────────────────────────

function CalendarView({ tasks, dark, onExportGoogle }: { tasks: Task[]; dark: boolean; onExportGoogle: () => void }) {
  const [today] = useState(new Date());
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const t = {
    surface: dark ? "#12121a" : "#ffffff",
    border: dark ? "#1e1e2e" : "#e5e5ea",
    text: dark ? "#f0f0ff" : "#111111",
    textSub: dark ? "#aaaacc" : "#555555",
    textMuted: dark ? "#666688" : "#999999",
    cellBg: dark ? "#0d0d14" : "#fafafa",
    todayBg: dark ? "rgba(99,102,241,0.15)" : "#eef2ff",
  };

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build task map: "YYYY-MM-DD" -> Task[]
  const taskMap: Record<string, Task[]> = {};
  tasks.forEach((task) => {
    const d = new Date(task.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!taskMap[key]) taskMap[key] = [];
    taskMap[key].push(task);
  });

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => setCurrent(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1));

  return (
    <div>
      {/* Calendar header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <button onClick={prevMonth} style={{ cursor: "pointer", background: "transparent", border: `1px solid ${t.border}`, borderRadius: "6px", color: t.textSub, padding: "6px 12px", fontSize: "14px" }}>‹</button>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "18px", color: t.text }}>
          {MONTHS[month]} {year}
        </span>
        <button onClick={nextMonth} style={{ cursor: "pointer", background: "transparent", border: `1px solid ${t.border}`, borderRadius: "6px", color: t.textSub, padding: "6px 12px", fontSize: "14px" }}>›</button>
      </div>

      {/* Google Calendar export */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <button
          onClick={onExportGoogle}
          style={{
            cursor: "pointer", border: "none", borderRadius: "8px",
            background: dark ? "rgba(66,133,244,0.2)" : "#e8f0fe",
            color: "#4285F4", padding: "8px 16px",
            fontFamily: "'DM Mono', monospace", fontSize: "11px", fontWeight: 600,
            display: "flex", alignItems: "center", gap: "6px",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#4285F4"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>
          Sync to Google Calendar
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "4px" }}>
        {DAYS.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: "11px", color: t.textMuted, fontWeight: 600, padding: "4px 0", letterSpacing: "0.06em" }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const key = `${year}-${month}-${day}`;
          const dayTasks = taskMap[key] || [];

          return (
            <div
              key={key}
              style={{
                background: isToday ? t.todayBg : t.cellBg,
                border: `1px solid ${isToday ? "#6366f1" : t.border}`,
                borderRadius: "10px",
                padding: "8px",
                minHeight: "80px",
                transition: "all 0.15s",
              }}
            >
              <div style={{
                fontSize: "12px", fontWeight: isToday ? 700 : 400,
                color: isToday ? "#6366f1" : t.textMuted,
                marginBottom: "4px",
              }}>{day}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {dayTasks.slice(0, 3).map((task) => {
                  const p = priorityConfig[task.priority] || priorityConfig.medium;
                  return (
                    <div key={task.id} style={{
                      background: dark ? p.bgDark : p.bgLight,
                      color: dark ? p.colorDark : p.colorLight,
                      borderRadius: "4px",
                      fontSize: "9px",
                      padding: "2px 5px",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>{task.title}</div>
                  );
                })}
                {dayTasks.length > 3 && (
                  <div style={{ fontSize: "9px", color: t.textMuted, paddingLeft: "2px" }}>+{dayTasks.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Drag & Drop Task Card ──────────────────────────────────────────────────

function TaskCard({
  task, dark, index,
  onUpdateStatus, onDelete,
  onDragStart, onDragEnter, onDragEnd,
  isDragging, isDragOver,
}: {
  task: Task;
  dark: boolean;
  index: number;
  onUpdateStatus: (task: Task) => void;
  onDelete: (id: number) => void;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
}) {
  const t = {
    surface: dark ? "#12121a" : "#ffffff",
    border: dark ? "#1e1e2e" : "#e5e5ea",
    text: dark ? "#f0f0ff" : "#111111",
    textSub: dark ? "#aaaacc" : "#555555",
    textMuted: dark ? "#666688" : "#999999",
  };

  const p = priorityConfig[task.priority] || priorityConfig.medium;
  const s = statusConfig[task.status];

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className="task-card"
      style={{
        background: t.surface,
        border: `1px solid ${isDragOver ? "#6366f1" : t.border}`,
        borderRadius: "14px",
        padding: "20px",
        transition: "all 0.15s ease",
        opacity: isDragging ? 0.4 : task.status === "done" ? 0.5 : 1,
        cursor: "grab",
        transform: isDragOver ? "scale(1.01)" : "scale(1)",
        boxShadow: isDragOver ? "0 4px 20px rgba(99,102,241,0.2)" : "none",
        userSelect: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        {/* Drag handle */}
        <div style={{ color: t.textMuted, fontSize: "16px", paddingTop: "2px", cursor: "grab", flexShrink: 0 }}>⠿</div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
            <span style={{
              background: dark ? p.bgDark : p.bgLight,
              color: dark ? p.colorDark : p.colorLight,
              borderRadius: "5px", fontSize: "10px", padding: "3px 8px",
              letterSpacing: "0.06em", textTransform: "uppercase" as const, fontWeight: 600,
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
          <button onClick={() => onUpdateStatus(task)} style={{
            cursor: "pointer", borderRadius: "6px", fontSize: "11px", padding: "4px 10px",
            letterSpacing: "0.05em", textTransform: "uppercase" as const, border: "none",
            fontFamily: "'DM Mono', monospace", fontWeight: 600, transition: "all 0.15s",
            background: dark ? s.bgDark : s.bgLight,
            color: dark ? s.colorDark : s.colorLight,
          }}>{s.label}</button>
          <button onClick={() => onDelete(task.id)} style={{
            cursor: "pointer", background: "transparent", border: "none",
            color: t.textMuted, fontSize: "20px", padding: "4px", transition: "color 0.15s", lineHeight: 1,
          }}>×</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "todo" | "in progress" | "done">("all");
  const [dark, setDark] = useState(false);
  const [view, setView] = useState<View>("list");

  // Drag state
  const dragIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || "";

  const t = {
    bg: dark ? "#0a0a0f" : "#f5f5f7",
    surface: dark ? "#12121a" : "#ffffff",
    border: dark ? "#1e1e2e" : "#e5e5ea",
    text: dark ? "#f0f0ff" : "#111111",
    textSub: dark ? "#aaaacc" : "#555555",
    textMuted: dark ? "#666688" : "#999999",
    inputBg: dark ? "#0d0d14" : "#fafafa",
    headerBg: dark ? "rgba(10,10,15,0.9)" : "rgba(245,245,247,0.9)",
    accent: "#6366f1",
  };

  useEffect(() => { fetchTasks(); }, []);

  async function fetchTasks() {
    const res = await fetch(`${API}/api/tasks`);
    const data = await res.json();
    setTasks(data);
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch(`${API}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const newTask = await res.json();
      setTasks((prev) => [...prev, newTask]);
      setTitle("");
      setDescription("");
      setShowForm(false);
    } finally {
      setAiLoading(false);
    }
  }

  async function updateStatus(task: Task) {
    const nextStatus = statusConfig[task.status].next;
    const res = await fetch(`${API}/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const updated = await res.json();
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  async function deleteTask(id: number) {
    await fetch(`${API}/api/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  // ── Drag & Drop ──────────────────────────────────────────────────────────

  function handleDragStart(index: number) {
    dragIndex.current = index;
    setDraggingIdx(index);
  }

  function handleDragEnter(index: number) {
    dragOverIndex.current = index;
    setDragOverIdx(index);
  }

  async function handleDragEnd() {
    const from = dragIndex.current;
    const to = dragOverIndex.current;

    if (from !== null && to !== null && from !== to) {
      const reordered = [...filtered];
      const [moved] = reordered.splice(from, 1);
      reordered.splice(to, 0, moved);

      // Optimistic update
      setTasks((prev) => {
        const filtered_ids = new Set(reordered.map((t) => t.id));
        const others = prev.filter((t) => !filtered_ids.has(t.id));
        return [...reordered, ...others];
      });

      // Persist to backend
      await fetch(`${API}/api/tasks/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordered_ids: reordered.map((t) => t.id) }),
      });
    }

    dragIndex.current = null;
    dragOverIndex.current = null;
    setDraggingIdx(null);
    setDragOverIdx(null);
  }

  // ── Google Calendar Export ───────────────────────────────────────────────

  function exportToGoogleCalendar() {
    // Generate an .ics file with all tasks as all-day events on their creation date
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Clarito//Task Manager//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];

    tasks.forEach((task) => {
      const d = new Date(task.created_at);
      const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
      const uid = `clarito-task-${task.id}@clarito.app`;
      const desc = [
        task.description ? `Description: ${task.description}` : "",
        `Priority: ${task.priority}`,
        `Category: ${task.category}`,
        task.estimated_time ? `Estimated time: ${task.estimated_time}` : "",
        `Status: ${task.status}`,
      ].filter(Boolean).join("\\n");

      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTART;VALUE=DATE:${dateStr}`,
        `DTEND;VALUE=DATE:${dateStr}`,
        `SUMMARY:${task.title}`,
        `DESCRIPTION:${desc}`,
        `CATEGORIES:${task.category.toUpperCase()}`,
        "END:VEVENT"
      );
    });

    lines.push("END:VCALENDAR");
    const ics = lines.join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clarito-tasks.ics";
    a.click();
    URL.revokeObjectURL(url);
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
        .view-btn { transition: all 0.15s; }
        .view-btn:hover { opacity: 0.8; }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${t.border}`,
        padding: "20px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0,
        background: t.headerBg, backdropFilter: "blur(12px)", zIndex: 10,
        transition: "background 0.3s, border-color 0.3s",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontSize: "26px", fontWeight: 800,
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Clarito</h1>
          <span style={{ color: t.textMuted, fontSize: "12px" }}>/ task manager</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ background: dark ? "rgba(99,102,241,0.2)" : "#eef2ff", color: "#6366f1", borderRadius: "6px", fontSize: "11px", padding: "4px 10px", fontWeight: 600 }}>AI ✦</span>

          {/* View toggle */}
          <div style={{ display: "flex", border: `1px solid ${t.border}`, borderRadius: "8px", overflow: "hidden" }}>
            {(["list", "calendar"] as View[]).map((v) => (
              <button key={v} className="view-btn" onClick={() => setView(v)} style={{
                cursor: "pointer", border: "none", padding: "7px 14px",
                fontFamily: "'DM Mono', monospace", fontSize: "11px", fontWeight: view === v ? 600 : 400,
                background: view === v ? (dark ? "rgba(99,102,241,0.25)" : "#eef2ff") : "transparent",
                color: view === v ? "#6366f1" : t.textMuted,
                transition: "all 0.15s",
              }}>{v === "list" ? "☰ list" : "◫ calendar"}</button>
            ))}
          </div>

          <button className="toggle-btn" onClick={() => setDark(!dark)} title={dark ? "Light mode" : "Dark mode"}>
            {dark ? "☀️" : "🌙"}
          </button>

          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              cursor: "pointer", border: "none", borderRadius: "8px",
              background: "#6366f1", color: "#fff", padding: "10px 20px",
              fontFamily: "'DM Mono', monospace", fontSize: "12px", fontWeight: 500,
              letterSpacing: "0.05em", transition: "opacity 0.15s",
            }}
          >
            {showForm ? "✕ close" : "+ new task"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: view === "calendar" ? "960px" : "720px", margin: "0 auto", padding: "40px 24px" }}>

        {/* Form */}
        {showForm && (
          <form onSubmit={createTask} style={{
            background: t.surface,
            border: `1px solid ${dark ? "rgba(99,102,241,0.3)" : "#c7d2fe"}`,
            borderRadius: "16px", padding: "24px", marginBottom: "32px",
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
                  width: "100%", background: t.inputBg, border: `1px solid ${t.border}`,
                  borderRadius: "8px", color: t.text,
                  fontFamily: "'DM Mono', monospace", fontSize: "14px",
                  padding: "12px 16px", outline: "none", transition: "border-color 0.2s, background 0.3s",
                }}
                placeholder="Task title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <textarea
                style={{
                  width: "100%", background: t.inputBg, border: `1px solid ${t.border}`,
                  borderRadius: "8px", color: t.text,
                  fontFamily: "'DM Mono', monospace", fontSize: "14px",
                  padding: "12px 16px", outline: "none", resize: "none",
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

        {/* ── CALENDAR VIEW ── */}
        {view === "calendar" && (
          <div style={{
            background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: "16px", padding: "28px",
            transition: "background 0.3s, border-color 0.3s",
          }}>
            <CalendarView tasks={tasks} dark={dark} onExportGoogle={exportToGoogleCalendar} />
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {view === "list" && (
          <>
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
                  fontFamily: "'DM Mono', monospace", fontSize: "11px",
                  padding: "6px 12px",
                  fontWeight: filter === f ? 600 : 400,
                  transition: "all 0.15s", letterSpacing: "0.05em",
                }}>{f}</button>
              ))}
              <span style={{ marginLeft: "auto", color: t.textMuted, fontSize: "11px" }}>
                {filtered.length} tasks
              </span>
            </div>

            {/* Drag hint */}
            {filtered.length > 1 && (
              <p style={{ color: t.textMuted, fontSize: "11px", marginBottom: "12px", textAlign: "right" }}>
                ⠿ drag to reorder
              </p>
            )}

            {/* Task list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 0", color: t.textMuted }}>
                  <div style={{ fontSize: "32px", marginBottom: "12px" }}>◎</div>
                  <p style={{ fontSize: "13px" }}>no tasks found</p>
                </div>
              )}
              {filtered.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  dark={dark}
                  index={index}
                  onUpdateStatus={updateStatus}
                  onDelete={deleteTask}
                  onDragStart={handleDragStart}
                  onDragEnter={handleDragEnter}
                  onDragEnd={handleDragEnd}
                  isDragging={draggingIdx === index}
                  isDragOver={dragOverIdx === index}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
