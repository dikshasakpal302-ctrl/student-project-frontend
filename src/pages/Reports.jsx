import { useAppData } from "../context/AppDataContext";
import { useProjects } from "../context/ProjectsContext";
import { useTasks } from "../context/TasksContext";

const STATUS = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
];

const PRIORITY = [
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];

function Stat({ label, value, color }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <p className="text-sm text-slate-300">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color || ""}`}>{value}</p>
    </div>
  );
}

export default function Reports() {
  const { members } = useAppData();
  const { projects } = useProjects();
  const { tasks } = useTasks();

  const today = new Date().toISOString().slice(0, 10);
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const completion = total ? Math.round((done / total) * 100) : 0;

  const isOverdue = (t) => t.status !== "done" && t.deadline && t.deadline < today;
  const overdueTasks = tasks.filter(isOverdue);

  // everyone who is a member OR has a task
  const names = [
    ...new Set([
      ...members.map((m) => m.name),
      ...tasks.map((t) => t.assignee || "Unassigned"),
    ]),
  ];

  const perPerson = names.map((name) => {
    const mine = tasks.filter((t) => (t.assignee || "Unassigned") === name);
    const d = mine.filter((t) => t.status === "done").length;
    return {
      name,
      assigned: mine.length,
      inProgress: mine.filter((t) => t.status === "in_progress").length,
      blocked: mine.filter((t) => t.status === "blocked").length,
      done: d,
      overdue: mine.filter(isOverdue).length,
      pct: mine.length ? Math.round((d / mine.length) * 100) : 0,
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-slate-300">Generated on {today}</p>
        </div>
        <button
          onClick={() => window.print()}
          className="rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium"
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Stat label="Projects" value={projects.length} color="text-blue-400" />
        <Stat label="Total tasks" value={total} />
        <Stat label="Completion" value={`${completion}%`} color="text-green-400" />
        <Stat label="Overdue" value={overdueTasks.length} color="text-yellow-400" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-800 rounded-lg p-4">
          <h2 className="font-semibold mb-3">Tasks by status</h2>
          <table className="w-full text-sm">
            <tbody>
              {STATUS.map((s) => (
                <tr key={s.key} className="border-t border-slate-700">
                  <td className="py-2 text-slate-300">{s.label}</td>
                  <td className="py-2 text-right">
                    {tasks.filter((t) => t.status === s.key).length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-800 rounded-lg p-4">
          <h2 className="font-semibold mb-3">Tasks by priority</h2>
          <table className="w-full text-sm">
            <tbody>
              {PRIORITY.map((p) => (
                <tr key={p.key} className="border-t border-slate-700">
                  <td className="py-2 text-slate-300">{p.label}</td>
                  <td className="py-2 text-right">
                    {tasks.filter((t) => t.priority === p.key).length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-4 mb-6 overflow-x-auto">
        <h2 className="font-semibold mb-3">Team performance</h2>
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-left text-slate-300">
              <th className="py-2">Member</th>
              <th className="py-2 text-right">Assigned</th>
              <th className="py-2 text-right">In progress</th>
              <th className="py-2 text-right">Blocked</th>
              <th className="py-2 text-right">Done</th>
              <th className="py-2 text-right">Overdue</th>
              <th className="py-2 text-right">Completion</th>
            </tr>
          </thead>
          <tbody>
            {perPerson.map((p) => (
              <tr key={p.name} className="border-t border-slate-700">
                <td className="py-2">{p.name}</td>
                <td className="py-2 text-right">{p.assigned}</td>
                <td className="py-2 text-right">{p.inProgress}</td>
                <td className="py-2 text-right">{p.blocked}</td>
                <td className="py-2 text-right">{p.done}</td>
                <td className="py-2 text-right">{p.overdue}</td>
                <td className="py-2 text-right">{p.pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-800 rounded-lg p-4">
        <h2 className="font-semibold mb-3">Overdue tasks</h2>
        {overdueTasks.length === 0 ? (
          <p className="text-sm text-slate-300">No overdue tasks. 🎉</p>
        ) : (
          <ul className="space-y-2">
            {overdueTasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between bg-slate-700 rounded px-3 py-2 text-sm"
              >
                <span>
                  {t.title}{" "}
                  <span className="text-slate-300">
                    ({t.assignee || "Unassigned"})
                  </span>
                </span>
                <span className="text-red-400">Due {t.deadline}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}