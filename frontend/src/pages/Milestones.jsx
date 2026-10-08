import { useState } from "react";
import { useMilestones } from "../context/MilestonesContext";
import { useProjects } from "../context/ProjectsContext";
import { useTasks } from "../context/TasksContext";

const inputClass =
  "w-full rounded bg-slate-700 border border-slate-600 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500";

const STATUS_STYLE = {
  completed: "bg-green-200 text-green-800",
  overdue: "bg-red-200 text-red-800",
  in_progress: "bg-blue-200 text-blue-800",
  not_started: "bg-slate-600 text-slate-200",
};

const STATUS_LABEL = {
  completed: "Completed",
  overdue: "Overdue",
  in_progress: "In progress",
  not_started: "Not started",
};

const TASK_STATUS_LABEL = {
  todo: "To Do",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
};

const emptyForm = { title: "", description: "", deadline: "" };

export default function Milestones() {
  const { milestones, setMilestones } = useMilestones();
  const { projects } = useProjects();
  const { tasks, setTasks } = useTasks();

  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const today = new Date().toISOString().slice(0, 10);
  const selected = Number(projectId);
  const project = projects.find((p) => p.id === selected);

  const projectMilestones = milestones
    .filter((m) => m.projectId === selected)
    .sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"));

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!project || !form.title.trim()) return;
    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      deadline: form.deadline,
    };
    if (editingId) {
      setMilestones((prev) =>
        prev.map((m) => (m.id === editingId ? { ...m, ...data } : m))
      );
    } else {
      setMilestones((prev) => [
        ...prev,
        { ...data, id: Date.now(), projectId: selected },
      ]);
    }
    resetForm();
  };

  const startEdit = (m) => {
    setForm({
      title: m.title,
      description: m.description || "",
      deadline: m.deadline || "",
    });
    setEditingId(m.id);
  };

  const deleteMilestone = (id) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
    // tasks stay, they just lose the milestone link
    setTasks((prev) =>
      prev.map((t) => (t.milestoneId === id ? { ...t, milestoneId: null } : t))
    );
    if (editingId === id) resetForm();
  };

  const info = (m) => {
    const list = tasks.filter((t) => t.milestoneId === m.id);
    const done = list.filter((t) => t.status === "done").length;
    const pct = list.length ? Math.round((done / list.length) * 100) : 0;
    let status = "not_started";
    if (list.length > 0 && done === list.length) status = "completed";
    else if (m.deadline && m.deadline < today) status = "overdue";
    else if (list.some((t) => t.status !== "todo")) status = "in_progress";
    return { list, done, pct, status };
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Milestones</h1>

      {projects.length === 0 ? (
        <p className="text-slate-300">Create a project first, then add milestones.</p>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-slate-300">Project:</label>
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                resetForm();
              }}
              className={`${inputClass} md:max-w-sm`}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-slate-800 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            <h2 className="font-semibold md:col-span-2">
              {editingId ? "Edit milestone" : "Add milestone"}
            </h2>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Milestone title (e.g. Backend ready)"
              required
              className={inputClass}
            />
            <input
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              className={inputClass}
            />
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Description (optional)"
              rows={2}
              className={`${inputClass} md:col-span-2`}
            />
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 font-medium"
              >
                {editingId ? "Save changes" : "+ Add Milestone"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded bg-slate-600 hover:bg-slate-500 px-4 py-2"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {projectMilestones.length === 0 ? (
            <p className="text-slate-300">
              No milestones for this project yet. Add one above, then link tasks to it
              from the Task Board.
            </p>
          ) : (
            <div className="space-y-4">
              {projectMilestones.map((m) => {
                const { list, done, pct, status } = info(m);
                return (
                  <div key={m.id} className="bg-slate-800 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold text-lg">{m.title}</h2>
                        {m.description && (
                          <p className="text-sm text-slate-300 mt-1">{m.description}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          Deadline: {m.deadline || "Not set"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded ${STATUS_STYLE[status]}`}>
                          {STATUS_LABEL[status]}
                        </span>
                        <button
                          onClick={() => startEdit(m)}
                          title="Edit milestone"
                          className="text-slate-400 hover:text-blue-400"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => deleteMilestone(m.id)}
                          title="Delete milestone"
                          className="text-slate-400 hover:text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>
                          {done} of {list.length} tasks done
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    {list.length === 0 ? (
                      <p className="text-sm text-slate-400 mt-3">
                        No tasks linked yet. Choose this milestone when creating or editing
                        a task.
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {list.map((t) => (
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
                            <span className="text-xs text-slate-300">
                              {TASK_STATUS_LABEL[t.status]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}