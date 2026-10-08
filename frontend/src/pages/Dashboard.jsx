import { useState } from "react";
import { Link } from "react-router-dom";
import { useTasks } from "../context/TasksContext";
import { useProjects } from "../context/ProjectsContext";
import { useAppData } from "../context/AppDataContext";
import { analyze } from "../services/aiService";

const STATUS_INFO = [
  { key: "todo", label: "To Do", bar: "bg-slate-400" },
  { key: "in_progress", label: "In Progress", bar: "bg-blue-500" },
  { key: "blocked", label: "Blocked", bar: "bg-red-500" },
  { key: "done", label: "Done", bar: "bg-green-500" },
];

const priorityStyle = {
  low: "bg-green-200 text-green-800",
  medium: "bg-yellow-200 text-yellow-800",
  high: "bg-red-200 text-red-800",
};

const LEVEL = {
  healthy: { label: "HEALTHY", badge: "bg-green-200 text-green-800", stroke: "#22c55e" },
  warning: { label: "WARNING", badge: "bg-yellow-200 text-yellow-800", stroke: "#eab308" },
  risk: { label: "AT RISK", badge: "bg-red-200 text-red-800", stroke: "#ef4444" },
};

const SEVERITY_DOT = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-slate-400",
};

const inputClass =
  "w-full rounded bg-slate-700 border border-slate-600 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500";

function StatCard({ label, value, color }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <p className="text-sm text-slate-300">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color || ""}`}>{value}</p>
    </div>
  );
}

function Gauge({ score, level }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#334155" strokeWidth="12" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={LEVEL[level].stroke}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{score}</span>
        <span className="text-[10px] text-slate-300">out of 100</span>
      </div>
    </div>
  );
}

function AiPanel({ projects, tasks, members, today }) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");

  if (projects.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-4">
        <h2 className="font-semibold mb-2">AI project health</h2>
        <p className="text-sm text-slate-300">
          Create a project and link tasks to it, then the AI health score appears here.
        </p>
      </div>
    );
  }

  // if the chosen project was deleted, fall back to the first one
  const project = projects.find((p) => p.id === Number(projectId)) || projects[0];
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const insights = analyze({ project, tasks: projectTasks, members, today });
  const lv = LEVEL[insights.level];

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-semibold">AI project health</h2>
          <select
            value={project.id}
            onChange={(e) => setProjectId(e.target.value)}
            className={`${inputClass} max-w-[200px] py-1 text-sm`}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {projectTasks.length === 0 ? (
          <p className="text-sm text-yellow-300">
            No tasks are linked to this project yet. On the Task Board, pick this project when
            creating or editing tasks.
          </p>
        ) : (
          <div className="flex items-center gap-4">
            <Gauge score={insights.score} level={insights.level} />
            <div className="flex-1">
              <span className={`text-sm px-3 py-1 rounded ${lv.badge}`}>{lv.label}</span>
              <div className="grid grid-cols-3 gap-2 text-center mt-3">
                <div className="bg-slate-700 rounded p-2">
                  <p className="text-lg font-bold">{insights.progress}%</p>
                  <p className="text-[11px] text-slate-300">Progress</p>
                </div>
                <div className="bg-slate-700 rounded p-2">
                  <p className="text-lg font-bold">{insights.confidence}%</p>
                  <p className="text-[11px] text-slate-300">Confidence</p>
                </div>
                <div className="bg-slate-700 rounded p-2">
                  <p className="text-lg font-bold">
                    {insights.daysLeft === null
                      ? "-"
                      : insights.daysLeft < 0
                      ? `${-insights.daysLeft} late`
                      : insights.daysLeft}
                  </p>
                  <p className="text-[11px] text-slate-300">Days left</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {projectTasks.length > 0 && (
        <>
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2">
              Top risks{" "}
              <span className="text-sm text-slate-300">({insights.risks.length})</span>
            </h3>
            {insights.risks.length === 0 ? (
              <p className="text-sm text-green-300">No risks detected. 🎉</p>
            ) : (
              <ul className="space-y-2">
                {insights.risks.slice(0, 3).map((r, n) => (
                  <li key={n} className="bg-slate-700 rounded p-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${SEVERITY_DOT[r.severity]}`} />
                      <span className="font-medium text-sm">{r.title}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{r.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2">What to do next</h3>
            <ol className="space-y-2">
              {insights.recommendations.slice(0, 3).map((r, n) => (
                <li key={n} className="bg-slate-700 rounded p-3 flex gap-3">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-green-500 text-slate-900 text-sm font-bold flex items-center justify-center">
                    {n + 1}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{r.action}</p>
                    <p className="text-xs text-slate-300 mt-1">{r.reason}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}

      <Link to="/ai" className="block text-sm text-blue-400 hover:text-blue-300">
        Open full AI Insights (what-if and assistant) →
      </Link>
    </div>
  );
}

export default function Dashboard() {
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { members } = useAppData();

  const today = new Date().toISOString().slice(0, 10);
  const total = tasks.length;
  const count = (key) => tasks.filter((t) => t.status === key).length;
  const done = count("done");
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  const overdue = tasks.filter(
    (t) => t.status !== "done" && t.deadline && t.deadline < today
  ).length;

  const upcoming = tasks
    .filter((t) => t.status !== "done" && t.deadline)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Summary numbers */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        <StatCard label="Projects" value={projects.length} color="text-blue-400" />
        <StatCard label="Total tasks" value={total} />
        <StatCard label="Completed" value={done} color="text-green-400" />
        <StatCard label="Blocked" value={count("blocked")} color="text-red-400" />
        <StatCard label="Overdue" value={overdue} color="text-yellow-400" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: progress + deadlines */}
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Overall progress</h2>
              <span className="text-sm text-slate-300">{progress}% done</span>
            </div>
            <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="space-y-2">
              {STATUS_INFO.map((s) => {
                const n = count(s.key);
                const pct = total === 0 ? 0 : (n / total) * 100;
                return (
                  <div key={s.key} className="flex items-center gap-3 text-sm">
                    <span className="w-24 text-slate-300">{s.label}</span>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${s.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right">{n}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Upcoming deadlines</h2>
              <Link to="/tasks" className="text-sm text-blue-400 hover:text-blue-300">
                Open Task Board →
              </Link>
            </div>

            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-300">No pending deadlines. 🎉</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between bg-slate-700 rounded p-3"
                  >
                    <div>
                      <p className="font-medium">{t.title}</p>
                      <p className="text-xs text-slate-300">
                        {t.assignee || "Unassigned"} ·{" "}
                        <span className={t.deadline < today ? "text-red-400" : ""}>
                          {t.deadline < today ? "Overdue " : "Due "}
                          {t.deadline}
                        </span>
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${priorityStyle[t.priority]}`}>
                      {t.priority}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: live AI panel */}
        <AiPanel projects={projects} tasks={tasks} members={members} today={today} />
      </div>

      <p className="text-xs text-slate-500 mt-6">
        AI results come from simple rules in src/services/aiService.js. Member 3's engine will
        replace that file.
      </p>
    </div>
  );
}