import { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { useProjects } from "../context/ProjectsContext";

const STATUS_STYLE = {
  approved: "bg-green-200 text-green-800",
  needs_changes: "bg-red-200 text-red-800",
  requested: "bg-yellow-200 text-yellow-800",
  none: "bg-slate-600 text-slate-200",
};

const STATUS_LABEL = {
  approved: "Approved",
  needs_changes: "Needs changes",
  requested: "Review requested",
  none: "Not reviewed",
};

const inputClass =
  "w-full rounded bg-slate-700 border border-slate-600 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500";

const emptyForm = { mentor: "", comment: "", status: "approved" };

export default function Mentor() {
  const { feedback, setFeedback, reviewRequests, setReviewRequests } =
    useAppData();
  const { projects } = useProjects();

  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? "");
  const [form, setForm] = useState(emptyForm);

  const projectId = Number(selectedId);
  const project = projects.find((p) => p.id === projectId);

  const notes = feedback
    .filter((f) => f.projectId === projectId)
    .sort((a, b) => b.id - a.id);

  // Status = latest feedback, unless a review was requested after it
  const latest = notes[0];
  const requestedAt = reviewRequests[projectId];
  let status = "none";
  if (latest) status = latest.status;
  if (requestedAt && (!latest || requestedAt > latest.id)) status = "requested";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!project || !form.comment.trim()) return;
    setFeedback([
      ...feedback,
      {
        id: Date.now(),
        projectId,
        mentor: form.mentor.trim() || "Mentor",
        comment: form.comment.trim(),
        status: form.status,
        date: new Date().toISOString().slice(0, 10),
      },
    ]);
    setForm(emptyForm);
  };

  const requestReview = () => {
    setReviewRequests({ ...reviewRequests, [projectId]: Date.now() });
  };

  const deleteNote = (id) => {
    setFeedback((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mentor Portal</h1>

      {projects.length === 0 ? (
        <p className="text-slate-300">
          No projects yet. Create a project first, then mentors can review it.
        </p>
      ) : (
        <>
          <div className="bg-slate-800 rounded-lg p-4 mb-6 flex flex-col md:flex-row md:items-center gap-3">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className={`${inputClass} md:max-w-sm`}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <span
              className={`text-sm px-3 py-2 rounded text-center ${STATUS_STYLE[status]}`}
            >
              {STATUS_LABEL[status]}
            </span>

            <button
              onClick={requestReview}
              disabled={status === "requested"}
              className="md:ml-auto rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              {status === "requested" ? "Review requested ✓" : "Request review"}
            </button>
          </div>

          {project && (
            <div className="bg-slate-800 rounded-lg p-4 mb-6">
              <h2 className="font-semibold">{project.name}</h2>
              {project.description && (
                <p className="text-sm text-slate-300 mt-1">
                  {project.description}
                </p>
              )}
              <p className="text-sm text-slate-300 mt-2">
                <span className="text-slate-400">Team: </span>
                {project.team.length ? project.team.join(", ") : "No members yet"}
              </p>
              <p className="text-sm text-slate-300 mt-1">
                <span className="text-slate-400">Deadline: </span>
                {project.deadline || "Not set"}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <form
              onSubmit={handleSubmit}
              className="bg-slate-800 rounded-lg p-4 space-y-3 h-fit"
            >
              <h2 className="font-semibold">Add mentor feedback</h2>
              <input
                name="mentor"
                value={form.mentor}
                onChange={handleChange}
                placeholder="Mentor name"
                className={inputClass}
              />
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="approved">Approved</option>
                <option value="needs_changes">Needs changes</option>
              </select>
              <textarea
                name="comment"
                value={form.comment}
                onChange={handleChange}
                placeholder="Write your feedback..."
                rows={4}
                required
                className={inputClass}
              />
              <button
                type="submit"
                className="w-full rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 font-medium"
              >
                + Submit Feedback
              </button>
            </form>

            <div className="bg-slate-800 rounded-lg p-4">
              <h2 className="font-semibold mb-3">
                Feedback history ({notes.length})
              </h2>
              {notes.length === 0 ? (
                <p className="text-sm text-slate-300">
                  No feedback yet for this project.
                </p>
              ) : (
                <ul className="space-y-3">
                  {notes.map((n) => (
                    <li key={n.id} className="bg-slate-700 rounded p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{n.mentor}</p>
                          <p className="text-xs text-slate-300">{n.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${STATUS_STYLE[n.status]}`}
                          >
                            {STATUS_LABEL[n.status]}
                          </span>
                          <button
                            onClick={() => deleteNote(n.id)}
                            title="Delete feedback"
                            className="text-slate-400 hover:text-red-400 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-200 mt-2">{n.comment}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}