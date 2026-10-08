import { useState } from "react";
import { useTasks } from "../context/TasksContext";
import { useProjects } from "../context/ProjectsContext";
import { useAppData } from "../context/AppDataContext";
import { useMilestones } from "../context/MilestonesContext";

const inputClass =
  "w-full rounded bg-slate-700 border border-slate-600 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500";

const STATUSES = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
];

const STATUS_ORDER = { todo: 0, in_progress: 1, blocked: 2, done: 3 };
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const priorityStyle = {
  low: "bg-green-200 text-green-800",
  medium: "bg-yellow-200 text-yellow-800",
  high: "bg-red-200 text-red-800",
};

const chipStyle = {
  todo: "bg-slate-500 text-white",
  in_progress: "bg-blue-500 text-white",
  blocked: "bg-red-500 text-white",
  done: "bg-green-600 text-white",
};

const pad = (n) => String(n).padStart(2, "0");
const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ---------------- LIST VIEW ---------------- */
function ListView({ today }) {
  const { tasks, setTasks } = useTasks();
  const { projects } = useProjects();
  const { members } = useAppData();

  const [search, setSearch] = useState("");
  const [project, setProject] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sortKey, setSortKey] = useState("deadline");
  const [sortDir, setSortDir] = useState("asc");

  const projectName = (id) => projects.find((p) => p.id === id)?.name || "No project";

  const changeStatus = (id, value) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: value } : t)));
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const assigneeNames = [
    ...new Set([
      ...members.map((m) => m.name),
      ...tasks.filter((t) => t.assignee).map((t) => t.assignee),
    ]),
  ];

  const filtered = tasks
    .filter((t) => t.title.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((t) =>
      project === "all"
        ? true
        : project === "none"
        ? t.projectId == null
        : t.projectId === Number(project)
    )
    .filter((t) =>
      assignee === "all" ? true : assignee === "none" ? !t.assignee : t.assignee === assignee
    )
    .filter((t) => status === "all" || t.status === status)
    .filter((t) => priority === "all" || t.priority === priority);

  const sorted = [...filtered].sort((a, b) => {
    let result = 0;
    if (sortKey === "title") result = a.title.localeCompare(b.title);
    else if (sortKey === "priority")
      result = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    else if (sortKey === "status")
      result = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    else if (sortKey === "assignee")
      result = (a.assignee || "~").localeCompare(b.assignee || "~");
    else result = (a.deadline || "9999").localeCompare(b.deadline || "9999");
    return sortDir === "asc" ? result : -result;
  });

  const arrow = (key) => (sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "");

  const Th = ({ k, children }) => (
    <th
      onClick={() => toggleSort(k)}
      className="py-2 px-3 text-left cursor-pointer select-none hover:text-white"
    >
      {children}
      {arrow(k)}
    </th>
  );

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className={inputClass}
        />
        <select value={project} onChange={(e) => setProject(e.target.value)} className={inputClass}>
          <option value="all">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
          <option value="none">No project</option>
        </select>
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={inputClass}>
          <option value="all">All assignees</option>
          {assigneeNames.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
          <option value="none">Unassigned</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass}>
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <p className="text-sm text-slate-300 mb-2">
        Showing {sorted.length} of {tasks.length} tasks. Click a column heading to sort.
      </p>

      <div className="bg-slate-800 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead className="text-slate-300 border-b border-slate-700">
            <tr>
              <Th k="title">Task</Th>
              <th className="py-2 px-3 text-left">Project</th>
              <Th k="assignee">Assignee</Th>
              <Th k="priority">Priority</Th>
              <Th k="status">Status</Th>
              <Th k="deadline">Deadline</Th>
              <th className="py-2 px-3 text-left">Subtasks</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400">
                  No tasks match these filters.
                </td>
              </tr>
            ) : (
              sorted.map((t) => {
                const overdue = t.status !== "done" && t.deadline && t.deadline < today;
                const subs = t.subtasks || [];
                return (
                  <tr key={t.id} className="border-t border-slate-700">
                    <td className="py-2 px-3 font-medium">{t.title}</td>
                    <td className="py-2 px-3 text-slate-300">{projectName(t.projectId)}</td>
                    <td className="py-2 px-3 text-slate-300">{t.assignee || "Unassigned"}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-1 rounded ${priorityStyle[t.priority]}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={t.status}
                        onChange={(e) => changeStatus(t.id, e.target.value)}
                        className="rounded bg-slate-700 border border-slate-600 px-2 py-1 text-white"
                      >
                        {STATUSES.map((s) => (
                          <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className={`py-2 px-3 ${overdue ? "text-red-400" : "text-slate-300"}`}>
                      {t.deadline ? `${overdue ? "Overdue " : ""}${t.deadline}` : "No deadline"}
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      {subs.length ? `${subs.filter((s) => s.done).length}/${subs.length}` : "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- CALENDAR VIEW ---------------- */
function CalendarView({ today }) {
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { milestones } = useMilestones();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(null);

  const projectName = (id) => projects.find((p) => p.id === id)?.name || "No project";

  const shift = (delta) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelected(null);
  };

  const goToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelected(today);
  };

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toKey(year, month, d));

  const tasksOn = (key) => tasks.filter((t) => t.deadline === key);
  const milestonesOn = (key) => milestones.filter((m) => m.deadline === key);
  const noDeadline = tasks.filter((t) => !t.deadline && t.status !== "done").length;

  const selectedTasks = selected ? tasksOn(selected) : [];
  const selectedMilestones = selected ? milestonesOn(selected) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="rounded bg-slate-700 hover:bg-slate-600 px-3 py-1">
            ←
          </button>
          <h2 className="text-lg font-semibold w-44 text-center">
            {MONTHS[month]} {year}
          </h2>
          <button onClick={() => shift(1)} className="rounded bg-slate-700 hover:bg-slate-600 px-3 py-1">
            →
          </button>
        </div>
        <button onClick={goToday} className="rounded bg-blue-600 hover:bg-blue-500 px-3 py-1 text-sm">
          Today
        </button>
      </div>

      <div className="bg-slate-800 rounded-lg p-2 overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-7 text-center text-xs text-slate-300 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((key, i) => {
              if (!key) return <div key={`blank-${i}`} className="min-h-24" />;
              const dayTasks = tasksOn(key);
              const dayMilestones = milestonesOn(key);
              const isToday = key === today;
              const isSelected = key === selected;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setSelected(key)}
                  className={`min-h-24 text-left rounded p-1 border ${
                    isSelected
                      ? "border-blue-500 bg-slate-700"
                      : "border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  <span
                    className={`text-xs inline-block px-1 rounded ${
                      isToday ? "bg-green-500 text-slate-900 font-bold" : "text-slate-300"
                    }`}
                  >
                    {Number(key.slice(8))}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayMilestones.map((m) => (
                      <div key={`m${m.id}`} className="text-[11px] truncate rounded px-1 bg-purple-600 text-white">
                        ⚑ {m.title}
                      </div>
                    ))}
                    {dayTasks.slice(0, 3).map((t) => (
                      <div key={t.id} className={`text-[11px] truncate rounded px-1 ${chipStyle[t.status]}`}>
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-[11px] text-slate-300">+{dayTasks.length - 3} more</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-300 mt-3">
        <span><span className="inline-block w-3 h-3 rounded bg-slate-500 mr-1" />To Do</span>
        <span><span className="inline-block w-3 h-3 rounded bg-blue-500 mr-1" />In Progress</span>
        <span><span className="inline-block w-3 h-3 rounded bg-red-500 mr-1" />Blocked</span>
        <span><span className="inline-block w-3 h-3 rounded bg-green-600 mr-1" />Done</span>
        <span><span className="inline-block w-3 h-3 rounded bg-purple-600 mr-1" />Milestone</span>
      </div>

      {noDeadline > 0 && (
        <p className="text-sm text-yellow-300 mt-3">
          {noDeadline} active {noDeadline === 1 ? "task has" : "tasks have"} no deadline, so{" "}
          {noDeadline === 1 ? "it does" : "they do"} not appear on the calendar.
        </p>
      )}

      {selected && (
        <div className="bg-slate-800 rounded-lg p-4 mt-4">
          <h3 className="font-semibold mb-2">Items on {selected}</h3>
          {selectedTasks.length === 0 && selectedMilestones.length === 0 ? (
            <p className="text-sm text-slate-300">Nothing is due on this day.</p>
          ) : (
            <ul className="space-y-2">
              {selectedMilestones.map((m) => (
                <li key={`m${m.id}`} className="bg-slate-700 rounded px-3 py-2 text-sm">
                  <span className="text-purple-300">⚑ Milestone:</span> {m.title}{" "}
                  <span className="text-slate-400">({projectName(m.projectId)})</span>
                </li>
              ))}
              {selectedTasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between bg-slate-700 rounded px-3 py-2 text-sm"
                >
                  <span>
                    {t.title}{" "}
                    <span className="text-slate-400">
                      ({t.assignee || "Unassigned"} · {projectName(t.projectId)})
                    </span>
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${chipStyle[t.status]}`}>
                    {STATUSES.find((s) => s.key === t.status)?.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- PAGE ---------------- */
export default function TaskViews() {
  const [tab, setTab] = useState("list");

  const d = new Date();
  const today = toKey(d.getFullYear(), d.getMonth(), d.getDate());

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Task Views</h1>

      <div className="flex gap-2 mb-6">
        {[
          { key: "list", label: "List view" },
          { key: "calendar", label: "Calendar view" },
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

      {tab === "list" ? <ListView today={today} /> : <CalendarView today={today} />}
    </div>
  );
}