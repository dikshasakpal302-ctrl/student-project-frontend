import { useState } from "react";
import { useTasks } from "../context/TasksContext";
import { useProjects } from "../context/ProjectsContext";
import { useAppData } from "../context/AppDataContext";

const COLUMNS = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
];

const priorityStyle = {
  low: "bg-green-200 text-green-800",
  medium: "bg-yellow-200 text-yellow-800",
  high: "bg-red-200 text-red-800",
};

const emptyForm = {
  title: "",
  description: "",
  projectId: "",
  assignee: "",
  priority: "medium",
  deadline: "",
  status: "todo",
};

const inputClass =
  "w-full rounded bg-slate-700 border border-slate-600 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500";

function TaskCard({
  task,
  column,
  projectName,
  onMove,
  onDelete,
  onEdit,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) {
  const [open, setOpen] = useState(false);
  const [newSub, setNewSub] = useState("");
  const subtasks = task.subtasks || [];
  const doneSubs = subtasks.filter((s) => s.done).length;

  const submitSub = (e) => {
    e.preventDefault();
    if (!newSub.trim()) return;
    onAddSubtask(task.id, newSub.trim());
    setNewSub("");
  };

  return (
    <div className="bg-slate-700 rounded-md shadow p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{task.title}</p>
        <div className="flex gap-2 text-sm">
          <button
            onClick={() => onEdit(task)}
            title="Edit task"
            className="text-slate-400 hover:text-blue-400"
          >
            ✎
          </button>
          <button
            onClick={() => onDelete(task.id)}
            title="Delete task"
            className="text-slate-400 hover:text-red-400"
          >
            ✕
          </button>
        </div>
      </div>

      <p className="text-xs text-blue-300 mt-1">{projectName || "No project"}</p>
      {task.description && (
        <p className="text-sm text-slate-300 mt-1">{task.description}</p>
      )}
      <p className="text-sm text-slate-300 mt-1">
        {task.assignee || "Unassigned"}
      </p>

      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs px-2 py-1 rounded ${priorityStyle[task.priority]}`}>
          {task.priority}
        </span>
        <span className="text-xs text-slate-300">
          {task.deadline ? `Due ${task.deadline}` : "No deadline"}
        </span>
      </div>

      {/* Subtasks */}
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-slate-300 hover:text-white mt-3"
      >
        {open ? "▾" : "▸"} Subtasks ({doneSubs}/{subtasks.length})
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {subtasks.map((s) => (
            <div key={s.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={s.done}
                onChange={() => onToggleSubtask(task.id, s.id)}
              />
              <span className={`flex-1 ${s.done ? "line-through text-slate-400" : ""}`}>
                {s.title}
              </span>
              <button
                onClick={() => onDeleteSubtask(task.id, s.id)}
                className="text-slate-400 hover:text-red-400 text-xs"
                title="Delete subtask"
              >
                ✕
              </button>
            </div>
          ))}
          <form onSubmit={submitSub} className="flex gap-2">
            <input
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              placeholder="Add subtask"
              className="flex-1 rounded bg-slate-600 border border-slate-500 px-2 py-1 text-sm text-white placeholder-slate-400"
            />
            <button type="submit" className="text-sm px-2 rounded bg-blue-600">
              +
            </button>
          </form>
        </div>
      )}

      <div className="flex justify-between mt-3">
        <button
          onClick={() => onMove(task.id, -1)}
          disabled={column === "todo"}
          className="text-sm px-2 py-1 rounded bg-slate-600 disabled:opacity-40"
        >
          ← Back
        </button>
        <button
          onClick={() => onMove(task.id, 1)}
          disabled={column === "done"}
          className="text-sm px-2 py-1 rounded bg-blue-600 text-white disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default function TaskBoard() {
  const { tasks, setTasks } = useTasks();
  const { projects } = useProjects();
  const { members } = useAppData();

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [projectFilter, setProjectFilter] = useState("all");

  const projectName = (id) => projects.find((p) => p.id === id)?.name;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      projectId: form.projectId === "" ? null : Number(form.projectId),
      assignee: form.assignee,
      priority: form.priority,
      deadline: form.deadline,
      status: form.status,
    };

    if (editingId) {
      setTasks((prev) =>
        prev.map((t) => (t.id === editingId ? { ...t, ...data } : t))
      );
    } else {
      setTasks((prev) => [...prev, { ...data, id: Date.now(), subtasks: [] }]);
    }
    resetForm();
  };

  const startEdit = (task) => {
    setForm({
      title: task.title,
      description: task.description || "",
      projectId: task.projectId == null ? "" : String(task.projectId),
      assignee: task.assignee || "",
      priority: task.priority,
      deadline: task.deadline || "",
      status: task.status,
    });
    setEditingId(task.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const moveTask = (id, direction) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const index = COLUMNS.findIndex((c) => c.key === task.status);
        const next = COLUMNS[index + direction];
        return next ? { ...task, status: next.key } : task;
      })
    );
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (editingId === id) resetForm();
  };

  const addSubtask = (taskId, title) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: [...(t.subtasks || []), { id: Date.now(), title, done: false }],
            }
          : t
      )
    );
  };

  const toggleSubtask = (taskId, subId) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: (t.subtasks || []).map((s) =>
                s.id === subId ? { ...s, done: !s.done } : s
              ),
            }
          : t
      )
    );
  };

  const deleteSubtask = (taskId, subId) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: (t.subtasks || []).filter((s) => s.id !== subId) }
          : t
      )
    );
  };

  // keep an old assignee selectable even if that member was removed
  const assigneeNames = members.map((m) => m.name);
  if (form.assignee && !assigneeNames.includes(form.assignee)) {
    assigneeNames.push(form.assignee);
  }

  const visibleTasks =
    projectFilter === "all"
      ? tasks
      : projectFilter === "none"
      ? tasks.filter((t) => t.projectId == null)
      : tasks.filter((t) => t.projectId === Number(projectFilter));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Task Board</h1>

      {/* Create / Edit form */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
      >
        <h2 className="font-semibold md:col-span-2 xl:col-span-3">
          {editingId ? "Edit task" : "Create task"}
        </h2>

        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Task title"
          required
          className={inputClass}
        />
        <select
          name="projectId"
          value={form.projectId}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="">No project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          name="assignee"
          value={form.assignee}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="">Unassigned</option>
          {assigneeNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <select
          name="priority"
          value={form.priority}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="low">Low priority</option>
          <option value="medium">Medium priority</option>
          <option value="high">High priority</option>
        </select>
        <input
          type="date"
          name="deadline"
          value={form.deadline}
          onChange={handleChange}
          className={inputClass}
        />
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className={inputClass}
        >
          {COLUMNS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description (optional)"
          rows={2}
          className={`${inputClass} md:col-span-2 xl:col-span-3`}
        />

        <div className="md:col-span-2 xl:col-span-3 flex gap-3">
          <button
            type="submit"
            className="flex-1 rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 font-medium"
          >
            {editingId ? "Save changes" : "+ Create Task"}
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

      {/* Project filter */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-slate-300">Show:</label>
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
          <option value="none">Tasks with no project</option>
        </select>
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((column) => {
          const columnTasks = visibleTasks.filter((t) => t.status === column.key);
          return (
            <div key={column.key} className="bg-slate-800 rounded-lg p-3">
              <h2 className="font-semibold mb-3">
                {column.label}{" "}
                <span className="text-sm text-slate-300">({columnTasks.length})</span>
              </h2>
              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    column={column.key}
                    projectName={projectName(task.projectId)}
                    onMove={moveTask}
                    onDelete={deleteTask}
                    onEdit={startEdit}
                    onAddSubtask={addSubtask}
                    onToggleSubtask={toggleSubtask}
                    onDeleteSubtask={deleteSubtask}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}