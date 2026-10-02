import { useState } from "react";
import { useProjects } from "../context/ProjectsContext";

const emptyForm = {
  name: "",
  description: "",
  team: "",
  techStack: "",
  startDate: "",
  deadline: "",
  goals: "",
};

const inputClass =
  "w-full rounded bg-slate-700 border border-slate-600 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500";

// "a, b, c" -> ["a", "b", "c"]
const toList = (text) =>
  text.split(",").map((s) => s.trim()).filter(Boolean);

export default function Projects() {
  const { projects, setProjects } = useProjects();
  const [form, setForm] = useState(emptyForm);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const newProject = {
      id: Date.now(),
      name: form.name.trim(),
      description: form.description.trim(),
      team: toList(form.team),
      techStack: toList(form.techStack),
      startDate: form.startDate,
      deadline: form.deadline,
      goals: form.goals.trim(),
    };
    setProjects([...projects, newProject]);
    setForm(emptyForm);
  };

  const deleteProject = (id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Projects</h1>

      {/* Create Project form */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 rounded-lg p-4 mb-8 grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Project name"
          required
          className={inputClass}
        />
        <input
          name="team"
          value={form.team}
          onChange={handleChange}
          placeholder="Team members (comma separated)"
          className={inputClass}
        />
        <input
          name="techStack"
          value={form.techStack}
          onChange={handleChange}
          placeholder="Tech stack (comma separated)"
          className={inputClass}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
            title="Start date"
            className={inputClass}
          />
          <input
            type="date"
            name="deadline"
            value={form.deadline}
            onChange={handleChange}
            title="Deadline"
            className={inputClass}
          />
        </div>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          rows={2}
          className={`${inputClass} md:col-span-2`}
        />
        <textarea
          name="goals"
          value={form.goals}
          onChange={handleChange}
          placeholder="Goals"
          rows={2}
          className={`${inputClass} md:col-span-2`}
        />
        <button
          type="submit"
          className="md:col-span-2 rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 font-medium"
        >
          + Create Project
        </button>
      </form>

      {/* Project cards */}
      {projects.length === 0 ? (
        <p className="text-slate-300">No projects yet. Create your first one above.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold">{p.name}</h2>
                <button
                  onClick={() => deleteProject(p.id)}
                  title="Delete project"
                  className="text-slate-400 hover:text-red-400 text-sm"
                >
                  ✕
                </button>
              </div>

              {p.description && (
                <p className="text-sm text-slate-300 mt-1">{p.description}</p>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                {p.techStack.map((t) => (
                  <span key={t} className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">
                    {t}
                  </span>
                ))}
              </div>

              <p className="text-sm text-slate-300 mt-3">
                <span className="text-slate-400">Team: </span>
                {p.team.length ? p.team.join(", ") : "No members yet"}
              </p>
              <p className="text-sm text-slate-300 mt-1">
                <span className="text-slate-400">Dates: </span>
                {p.startDate || "?"} → {p.deadline || "?"}
              </p>
              {p.goals && (
                <p className="text-sm text-slate-300 mt-1">
                  <span className="text-slate-400">Goals: </span>
                  {p.goals}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}