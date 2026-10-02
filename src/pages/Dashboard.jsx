import { Link } from "react-router-dom";
import { useTasks } from "../context/TasksContext";
import { useProjects } from "../context/ProjectsContext";

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

function StatCard({ label, value, color }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <p className="text-sm text-slate-300">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color || ""}`}>{value}</p>
    </div>
  );
}

function AiPlaceholder({ title, text }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-dashed border-slate-600">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
          AI - coming soon
        </span>
      </div>
      <p className="text-sm text-slate-300">{text}</p>
    </div>
  );
}

export default function Dashboard() {
  const { tasks } = useTasks();
  const { projects } = useProjects();

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

      {/* Progress + status breakdown */}
      <div className="bg-slate-800 rounded-lg p-4 mb-6">
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Upcoming deadlines */}
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

        {/* AI space for Member 3 */}
        <div className="space-y-4">
          <AiPlaceholder
            title="Project Health Score"
            text="Member 3's AI will show a score for how healthy the project is here."
          />
          <AiPlaceholder
            title="Risk Alerts"
            text="Predicted risks, such as tasks likely to miss their deadline, will appear here."
          />
          <AiPlaceholder
            title="Recommendations"
            text="Suggestions from the AI and what-if results will appear here."
          />
        </div>
      </div>
    </div>
  );
}