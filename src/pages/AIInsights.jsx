import { useState } from "react";
import { useTasks } from "../context/TasksContext";
import { useProjects } from "../context/ProjectsContext";
import { useAppData } from "../context/AppDataContext";
import { useMilestones } from "../context/MilestonesContext";
import { analyze, simulateDelay, answerQuestion } from "../services/aiService";

const inputClass =
  "w-full rounded bg-slate-700 border border-slate-600 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500";

const LEVEL = {
  healthy: { label: "HEALTHY", badge: "bg-green-200 text-green-800", stroke: "#22c55e" },
  warning: { label: "WARNING", badge: "bg-yellow-200 text-yellow-800", stroke: "#eab308" },
  risk: { label: "AT RISK", badge: "bg-red-200 text-red-800", stroke: "#ef4444" },
};

const SEVERITY = {
  high: { dot: "bg-red-500", label: "High", text: "text-red-300" },
  medium: { dot: "bg-yellow-500", label: "Medium", text: "text-yellow-300" },
  low: { dot: "bg-slate-400", label: "Low", text: "text-slate-300" },
};

const VERDICT = {
  risk: { style: "bg-red-950 border-red-700 text-red-200", title: "Deadline at risk" },
  tight: { style: "bg-yellow-950 border-yellow-700 text-yellow-200", title: "Very tight" },
  safe: { style: "bg-green-950 border-green-700 text-green-200", title: "Still safe" },
  unknown: { style: "bg-slate-800 border-slate-600 text-slate-200", title: "Cannot tell" },
};

const SUGGESTIONS = [
  "Why are we at risk?",
  "What should we work on today?",
  "Who is overloaded?",
  "What is blocking us?",
  "Summarize our progress",
];

function Gauge({ score, level }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-36 h-36">
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
        <span className="text-3xl font-bold">{score}</span>
        <span className="text-xs text-slate-300">out of 100</span>
      </div>
    </div>
  );
}

/* ---------------- Overview ---------------- */
function Overview({ insights, project }) {
  const lv = LEVEL[insights.level];
  const i = insights;
  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-4 flex flex-col md:flex-row items-center gap-6">
        <Gauge score={i.score} level={i.level} />
        <div className="flex-1 w-full">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="font-semibold text-lg">Project health</h2>
            <span className={`text-sm px-3 py-1 rounded ${lv.badge}`}>{lv.label}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-700 rounded p-2">
              <p className="text-xl font-bold">{i.progress}%</p>
              <p className="text-xs text-slate-300">Progress</p>
            </div>
            <div className="bg-slate-700 rounded p-2">
              <p className="text-xl font-bold">{i.confidence}%</p>
              <p className="text-xs text-slate-300">Deadline confidence</p>
            </div>
            <div className="bg-slate-700 rounded p-2">
              <p className="text-xl font-bold">
                {i.daysLeft === null ? "-" : i.daysLeft < 0 ? `${-i.daysLeft} late` : i.daysLeft}
              </p>
              <p className="text-xs text-slate-300">Days left</p>
            </div>
            <div className="bg-slate-700 rounded p-2">
              <p className="text-xl font-bold">{i.risks.length}</p>
              <p className="text-xs text-slate-300">Risks found</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            {project?.name}. {i.counts.done} of {i.counts.total} tasks done.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-lg p-4">
          <h2 className="font-semibold mb-3">Why? Risk alerts ({i.risks.length})</h2>
          {i.risks.length === 0 ? (
            <p className="text-sm text-green-300">No risks detected. 🎉</p>
          ) : (
            <ul className="space-y-2">
              {i.risks.map((r, n) => (
                <li key={n} className="bg-slate-700 rounded p-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${SEVERITY[r.severity].dot}`} />
                    <span className="font-medium text-sm">{r.title}</span>
                    <span className={`ml-auto text-xs ${SEVERITY[r.severity].text}`}>
                      {SEVERITY[r.severity].label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mt-1">{r.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-slate-800 rounded-lg p-4">
          <h2 className="font-semibold mb-3">AI recommendations</h2>
          <ol className="space-y-2">
            {i.recommendations.map((r, n) => (
              <li key={n} className="bg-slate-700 rounded p-3 flex gap-3">
                <span className="w-6 h-6 shrink-0 rounded-full bg-green-500 text-slate-900 text-sm font-bold flex items-center justify-center">
                  {n + 1}
                </span>
                <div>
                  <p className="font-medium text-sm">{r.action}</p>
                  <p className="text-sm text-slate-300 mt-1">{r.reason}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

/* ---------------- What-if ---------------- */
function WhatIf({ projectTasks, project, milestones }) {
  const candidates = projectTasks.filter((t) => t.status !== "done");
  const [taskId, setTaskId] = useState("");
  const [days, setDays] = useState(2);

  const chosen = candidates.find((t) => String(t.id) === String(taskId)) || candidates[0];
  const result = chosen
    ? simulateDelay({
        tasks: projectTasks,
        milestones,
        project,
        taskId: chosen.id,
        days: Math.max(1, Number(days) || 1),
      })
    : null;

  if (candidates.length === 0) {
    return <p className="text-slate-300">No open tasks in this project to simulate.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="text-sm text-slate-300">What if this task is delayed...</label>
          <select
            value={chosen.id}
            onChange={(e) => setTaskId(e.target.value)}
            className={inputClass}
          >
            {candidates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-300">...by how many days?</label>
          <input
            type="number"
            min="1"
            max="60"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {result?.error && <p className="text-yellow-300 text-sm">{result.error}</p>}

      {result && !result.error && (
        <>
          <div className="bg-slate-800 rounded-lg p-4">
            <h2 className="font-semibold mb-3">What happens next</h2>
            <ol className="space-y-2">
              {result.chain.map((c, n) => (
                <li
                  key={c.task.id}
                  style={{ marginLeft: Math.min(c.level, 4) * 20 }}
                  className="bg-slate-700 rounded p-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {n > 0 && <span className="text-amber-300">↳ </span>}
                      {c.task.title}
                    </p>
                    <p className="text-xs text-slate-300">{c.task.assignee || "Unassigned"}</p>
                  </div>
                  <p className="text-xs text-right whitespace-nowrap">
                    {c.oldDate ? (
                      <>
                        <span className="text-slate-400">{c.oldDate}</span>{" "}
                        <span className="text-slate-300">→</span>{" "}
                        <span className="text-red-300 font-medium">{c.newDate}</span>
                      </>
                    ) : (
                      <span className="text-slate-400">no deadline set</span>
                    )}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div className={`border rounded-lg p-4 ${VERDICT[result.verdict].style}`}>
            <p className="font-semibold">{VERDICT[result.verdict].title}</p>
            <p className="text-sm mt-1">
              {result.verdict === "unknown"
                ? "The project has no deadline, so I cannot compare."
                : result.overshoot > 0
                ? `The last affected task would finish on ${result.latest}, which is ${result.overshoot} ${result.overshoot === 1 ? "day" : "days"} after the project deadline (${project.deadline}).`
                : `The last affected task would finish on ${result.latest}, ${-result.overshoot} ${-result.overshoot === 1 ? "day" : "days"} before the project deadline (${project.deadline}).`}
            </p>
            <p className="text-sm mt-2">
              {result.chain.length} {result.chain.length === 1 ? "task" : "tasks"} affected
              {result.people.length > 0 && `, people involved: ${result.people.join(", ")}`}.
            </p>
            {result.milestonesHit.length > 0 && (
              <p className="text-sm mt-2">
                Milestones that would miss their date:{" "}
                {result.milestonesHit.map((m) => `${m.milestone.title} (new: ${m.newest})`).join(", ")}.
              </p>
            )}
          </div>

          <p className="text-xs text-slate-500">
            Simple model: every task that depends on the delayed one slips by the same number of
            days. Use "Depends on" on the Task Board to build the chain. Member 3's engine will use
            real durations.
          </p>
        </>
      )}
    </div>
  );
}

/* ---------------- Assistant ---------------- */
function Assistant({ ask }) {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hi! I am your project assistant. Ask me why the project is at risk, what to do today, or who is overloaded.",
    },
  ]);
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);

  const send = (question) => {
    const q = question.trim();
    if (!q || thinking) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setText("");
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "ai", text: ask(q) }]);
      setThinking(false);
    }, 600);
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="max-h-96 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.map((m, n) => (
          <div key={n} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-line ${
                m.role === "user" ? "bg-blue-600" : "bg-slate-700"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="bg-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="text-xs rounded-full bg-slate-700 hover:bg-slate-600 px-3 py-1"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
        className="flex gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask about your project..."
          className={inputClass}
        />
        <button
          type="submit"
          disabled={thinking}
          className="rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 font-medium disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function AIInsights() {
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { members } = useAppData();
  const { milestones } = useMilestones();

  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [tab, setTab] = useState("overview");

  const today = new Date().toISOString().slice(0, 10);
  const project = projects.find((p) => p.id === Number(projectId));
  const projectTasks = tasks.filter((t) => t.projectId === Number(projectId));
  const projectMilestones = milestones.filter((m) => m.projectId === Number(projectId));

  if (projects.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">AI Insights</h1>
        <p className="text-slate-300">Create a project first, then the AI can analyse it.</p>
      </div>
    );
  }

  const insights = analyze({ project, tasks: projectTasks, members, today });
  const ask = (question) =>
    answerQuestion({ question, insights, project, tasks: projectTasks, today });

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">AI Insights</h1>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className={`${inputClass} md:max-w-xs`}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {projectTasks.length === 0 && (
        <p className="text-yellow-300 text-sm mb-4">
          This project has no tasks yet. On the Task Board, pick this project when creating tasks.
        </p>
      )}

      <div className="flex gap-2 mb-6">
        {[
          { key: "overview", label: "Overview" },
          { key: "whatif", label: "What-if" },
          { key: "assistant", label: "Assistant" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded text-sm ${
              tab === t.key ? "bg-blue-600" : "bg-slate-700 hover:bg-slate-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview insights={insights} project={project} />}
      {tab === "whatif" && (
        <WhatIf projectTasks={projectTasks} project={project} milestones={projectMilestones} />
      )}
      {tab === "assistant" && <Assistant ask={ask} />}

      <p className="text-xs text-slate-500 mt-6">
        Demo mode: these insights come from simple rules in src/services/aiService.js. Member 3's
        AI engine will replace that file.
      </p>
    </div>
  );
}