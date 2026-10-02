import { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { useTasks } from "../context/TasksContext";

const emptyForm = { name: "", role: "", email: "" };

const inputClass =
  "w-full rounded bg-slate-700 border border-slate-600 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500";

const statusLabel = {
  todo: "To Do",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
};

const statusStyle = {
  todo: "bg-slate-500 text-white",
  in_progress: "bg-blue-200 text-blue-800",
  blocked: "bg-red-200 text-red-800",
  done: "bg-green-200 text-green-800",
};

export default function Team() {
  const { members, setMembers } = useAppData();
  const { tasks } = useTasks();
  const [form, setForm] = useState(emptyForm);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setMembers([
      ...members,
      {
        id: Date.now(),
        name: form.name.trim(),
        role: form.role.trim(),
        email: form.email.trim(),
      },
    ]);
    setForm(emptyForm);
  };

  const deleteMember = (id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Team</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 rounded-lg p-4 mb-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3"
      >
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Member name"
          required
          className={inputClass}
        />
        <input
          name="role"
          value={form.role}
          onChange={handleChange}
          placeholder="Role (e.g. Backend)"
          className={inputClass}
        />
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email (optional)"
          className={inputClass}
        />
        <button
          type="submit"
          className="rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 font-medium"
        >
          + Add Member
        </button>
      </form>

      {members.length === 0 ? (
        <p className="text-slate-300">No members yet. Add your first one above.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {members.map((m) => {
            const myTasks = tasks.filter((t) => t.assignee === m.name);
            const done = myTasks.filter((t) => t.status === "done").length;
            const pct = myTasks.length
              ? Math.round((done / myTasks.length) * 100)
              : 0;

            return (
              <div key={m.id} className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-semibold">{m.name}</h2>
                      <p className="text-sm text-slate-300">
                        {m.role || "No role set"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMember(m.id)}
                    title="Remove member"
                    className="text-slate-400 hover:text-red-400 text-sm"
                  >
                    ✕
                  </button>
                </div>

                {m.email && (
                  <p className="text-xs text-slate-400 mt-2">{m.email}</p>
                )}

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>
                      {done} of {myTasks.length} tasks done
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <ul className="mt-3 space-y-2">
                  {myTasks.length === 0 ? (
                    <li className="text-sm text-slate-400">No tasks assigned.</li>
                  ) : (
                    myTasks.map((t) => (
                      <li
                        key={t.id}
                        className="flex items-center justify-between gap-2 bg-slate-700 rounded px-3 py-2 text-sm"
                      >
                        <span>{t.title}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded whitespace-nowrap ${statusStyle[t.status]}`}
                        >
                          {statusLabel[t.status]}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-400 mt-6">
        Tasks are matched by name, so the Assignee on the Task Board must be
        spelled exactly like the member's name.
      </p>
    </div>
  );
}