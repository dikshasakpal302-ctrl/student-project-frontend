import { useState } from "react";
import { useTasks } from "../context/TasksContext";
import { useProjects } from "../context/ProjectsContext";
import { useAppData } from "../context/AppDataContext";

const inputClass =
  "w-full rounded bg-slate-700 border border-slate-600 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500";

const LEVEL_STYLE = {
  high: "bg-red-200 text-red-800",
  medium: "bg-yellow-200 text-yellow-800",
  low: "bg-green-200 text-green-800",
};

const LEVEL_LABEL = { high: "HIGH", medium: "MEDIUM", low: "LOW" };

// load = active tasks, and overdue tasks count twice
// 0-2 = LOW, 3-4 = MEDIUM, 5 or more = HIGH
const levelOf = (load) => (load >= 5 ? "high" : load >= 3 ? "medium" : "low");

function Stat({ label, value, color }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <p className="text-sm text-slate-300">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color || ""}`}>{value}</p>
    </div>
  );
}

export default function Workload() {
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { members } = useAppData();
  const [projectFilter, setProjectFilter] = useState("all");

  const today = new Date().toISOString().slice(0, 10);

  const scoped =
    projectFilter === "all"
      ? tasks
      : tasks.filter((t) => t.projectId === Number(projectFilter));

  const totalDone = scoped.filter((t) => t.status === "done").length;

  // members, plus anyone who has a task but is not on the Team page
  const names = [
    ...new Set([
      ...members.map((m) => m.name),
      ...scoped.filter((t) => t.assignee).map((t) => t.assignee),
    ]),
  ];

  const people = names.map((name) => {
    const mine = scoped.filter((t) => t.assignee === name);
    const active = mine.filter((t) => t.status !== "done");
    const overdue = active.filter((t) => t.deadline && t.deadline < today).length;
    const done = mine.length - active.length;
    const load = active.length + overdue;
    const role = members.find((m) => m.name === name)?.role || "";
    return {
      name,
      role,
      total: mine.length,
      todo: mine.filter((t) => t.status === "todo").length,
      inProgress: mine.filter((t) => t.status === "in_progress").length,
      blocked: mine.filter((t) => t.status === "blocked").length,
      done,
      active: active.length,
      overdue,
      load,
      level: levelOf(load),
      contribution: totalDone ? Math.round((done / totalDone) * 100) : 0,
    };
  });

  const unassignedActive = scoped.filter(
    (t) => !t.assignee && t.status !== "done"
  ).length;

  const overloaded = people.filter((p) => p.level === "high");
  const freest = [...people].sort((a, b) => a.load - b.load)[0];
  const activeTotal = scoped.filter((t) => t.status !== "done").length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Team Workload</h1>

      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm text-slate-300">Project:</label>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className={`${inputClass} md:max-w-xs`}
        >
          <option value="all">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Stat label="Team members" value={people.length} color="text-blue-400" />
        <Stat label="Active tasks" value={activeTotal} />
        <Stat
          label="Overloaded members"
          value={overloaded.length}
          color={overloaded.length ? "text-red-400" : "text-green-400"}
        />
        <Stat
          label="Unassigned active tasks"
          value={unassignedActive}
          color={unassignedActive ? "text-yellow-400" : ""}
        />
      </div>

      {overloaded.length > 0 && (
        <div className="bg-red-950 border border-red-700 rounded-lg p-4 mb-6">
          <p className="font-semibold text-red-300">
            ⚠ {overloaded.map((p) => p.name).join(", ")}{" "}
            {overloaded.length === 1 ? "is" : "are"} overloaded
          </p>
          {freest && freest.level !== "high" && (
            <p className="text-sm text-red-200 mt-1">
              Suggestion: move a task to {freest.name}, who has the lowest load
              ({freest.active} active).
            </p>
          )}
        </div>
      )}

      {people.length === 0 ? (
        <p className="text-slate-300">
          No members yet. Add people on the Team page, then assign them tasks.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {people.map((p) => {
            const seg = (n) => (p.total ? (n / p.total) * 100 : 0);
            return (
              <div key={p.name} className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{p.name}</h2>
                    <p className="text-sm text-slate-300">{p.role || "No role set"}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${LEVEL_STYLE[p.level]}`}>
                    {LEVEL_LABEL[p.level]}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mt-4">
                  <div className="bg-slate-700 rounded p-2">
                    <p className="text-xl font-bold">{p.total}</p>
                    <p className="text-xs text-slate-300">Assigned</p>
                  </div>
                  <div className="bg-slate-700 rounded p-2">
                    <p className="text-xl font-bold text-green-400">{p.done}</p>
                    <p className="text-xs text-slate-300">Completed</p>
                  </div>
                  <div className="bg-slate-700 rounded p-2">
                    <p className="text-xl font-bold text-blue-300">{p.active}</p>
                    <p className="text-xs text-slate-300">Pending</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="bg-green-500" style={{ width: `${seg(p.done)}%` }} />
                    <div className="bg-blue-500" style={{ width: `${seg(p.inProgress)}%` }} />
                    <div className="bg-red-500" style={{ width: `${seg(p.blocked)}%` }} />
                    <div className="bg-slate-400" style={{ width: `${seg(p.todo)}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Done {p.done} · In progress {p.inProgress} · Blocked {p.blocked} · To do {p.todo}
                  </p>
                </div>

                <div className="mt-3 text-sm text-slate-300 space-y-1">
                  <p>
                    Overdue:{" "}
                    <span className={p.overdue ? "text-red-400" : ""}>{p.overdue}</span>
                  </p>
                  <p>Contribution: {p.contribution}% of completed tasks</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-slate-800 rounded-lg p-4 text-sm text-slate-300">
        <p className="font-semibold text-white mb-1">How the level is calculated</p>
        <p>
          Load = active (not done) tasks, and each overdue task counts twice.
          0 to 2 is LOW, 3 to 4 is MEDIUM, 5 or more is HIGH. Tasks must be
          assigned from the dropdown on the Task Board to be counted.
        </p>
        <p className="mt-1 text-slate-400">
          Activity (last commit, last update) will be added once Member 2's GitHub
          data is connected.
        </p>
      </div>
    </div>
  );
}