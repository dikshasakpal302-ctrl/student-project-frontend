import { useState } from "react";

const COLUMNS = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
];

const priorityStyle = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

const initialTasks = [
  { id: 1, title: "Design login screen", assignee: "Diksha", priority: "high", deadline: "2026-10-05", status: "todo" },
  { id: 2, title: "Set up database", assignee: "Member 2", priority: "medium", deadline: "2026-10-08", status: "in_progress" },
  { id: 3, title: "Train risk model", assignee: "Member 3", priority: "high", deadline: "2026-10-12", status: "blocked" },
  { id: 4, title: "Create project form", assignee: "Diksha", priority: "low", deadline: "2026-10-01", status: "done" },
];

export default function TaskBoard() {
  const [tasks, setTasks] = useState(initialTasks);

  // direction: -1 = move left, +1 = move right
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Task Board</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.key);
          return (
            <div key={column.key} className="bg-gray-100 rounded-lg p-3">
              <h2 className="font-semibold mb-3">
                {column.label}{" "}
                <span className="text-sm text-gray-500">({columnTasks.length})</span>
              </h2>

              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <div key={task.id} className="bg-white rounded-md shadow p-3">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-gray-500">{task.assignee}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${priorityStyle[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-gray-500">Due {task.deadline}</span>
                    </div>
                    <div className="flex justify-between mt-3">
                      <button
                        onClick={() => moveTask(task.id, -1)}
                        disabled={column.key === "todo"}
                        className="text-sm px-2 py-1 rounded bg-gray-200 disabled:opacity-40"
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