import { useState } from "react";
import { useTasks } from "../context/TasksContext";

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
  assignee: "",
  priority: "medium",
  deadline: "",
  status: "todo",
};

const inputClass =
  "w-full rounded bg-slate-700 border border-slate-600 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500";

export default function TaskBoard() {
  const { tasks, setTasks } = useTasks();
  const [form, setForm] = useState(emptyForm);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const newTask = { ...form, title: form.title.trim(), id: Date.now() };
    setTasks([...tasks, newTask]);
    setForm(emptyForm);
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
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Task Board</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 rounded-lg p-4 mb-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3"
      >
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Task title"
          required
          className={`${inputClass} xl:col-span-2`}
        />
        <input
          name="assignee"
          value={form.assignee}
          onChange={handleChange}
          placeholder="Assignee"
          className={inputClass}
        />
        <select name="priority" value={form.priority} onChange={handleChange} className={inputClass}>
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
        <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
          {COLUMNS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="md:col-span-2 xl:col-span-6 rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 font-medium"
        >
          + Create Task
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.key);
          return (
            <div key={column.key} className="bg-slate-800 rounded-lg p-3">
              <h2 className="font-semibold mb-3">
                {column.label}{" "}
                <span className="text-sm text-slate-300">({columnTasks.length})</span>
              </h2>

              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <div key={task.id} className="bg-slate-700 rounded-md shadow p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{task.title}</p>
                      <button
                        onClick={() => deleteTask(task.id)}
                        title="Delete task"
                        className="text-slate-400 hover:text-red-400 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-sm text-slate-300">{task.assignee || "Unassigned"}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${priorityStyle[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-slate-300">
                        {task.deadline ? `Due ${task.deadline}` : "No deadline"}
                      </span>
                    </div>
                    <div className="flex justify-between mt-3">
                      <button
                        onClick={() => moveTask(task.id, -1)}
                        disabled={column.key === "todo"}
                        className="text-sm px-2 py-1 rounded bg-slate-600 disabled:opacity-40"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={() => moveTask(task.id, 1)}
                        disabled={column.key === "done"}
                        className="text-sm px-2 py-1 rounded bg-blue-600 text-white disabled:opacity-40"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}