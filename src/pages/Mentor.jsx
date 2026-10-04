import { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { useProjects } from "../context/ProjectsContext";
import { useTasks } from "../context/TasksContext";
import { useMilestones } from "../context/MilestonesContext";
import { useAuth } from "../context/AuthContext";

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

const REVIEW_STYLE = {
  pending: "bg-slate-600 text-slate-200",
  approved: "bg-green-200 text-green-800",
  rejected: "bg-red-200 text-red-800",
};

const REVIEW_LABEL = {
  pending: "Awaiting review",
  approved: "Approved",
  rejected: "Rejected",
};

const HEALTH_STYLE = {
  healthy: { label: "HEALTHY", badge: "bg-green-200 text-green-800", bar: "bg-green-500" },
  warning: { label: "WARNING", badge: "bg-yellow-200 text-yellow-800", bar: "bg-yellow-500" },
  risk: { label: "AT RISK", badge: "bg-red-200 text-red-800", bar: "bg-red-500" },
};

const inputClass =
  "w-full rounded bg-slate-700 border border-slate-600 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500";

const emptyForm = { mentor: "", comment: "", status: "approved" };

// Simple rule-based health. Member 3's real engine will replace this later.
function computeHealth(projectTasks, project, today) {
  const total = projectTasks.length;
  const done = projectTasks.filter((t) => t.status === "done").length;
  const active = projectTasks.filter((t) => t.status !== "done");
  const overdue = active.filter((t) => t.deadline && t.deadline < today).length;
  const blocked = projectTasks.filter((t) => t.status === "blocked").length;
  const progress = total ? Math.round((done / total) * 100) : 0;

  // overloaded = a person with 5+ active tasks (overdue counts twice)
  const loads = {};
  active.forEach((t) => {
    if (!t.assignee) return;
    const w = t.deadline && t.deadline < today ? 2 : 1;
    loads[t.assignee] = (loads[t.assignee] || 0) + w;
  });
  const overloaded = Object.keys(loads).filter((n) => loads[n] >= 5);

  const deadlinePassed =
    project?.deadline && project.deadline < today && (total === 0 || done < total);

  let score = 100;
  const reasons = [];

  if (total === 0) {
    score -= 20;
    reasons.push("No tasks have been linked to this project yet.");
  }
  if (overdue > 0) {
    score -= Math.min(overdue * 12, 36);
    reasons.push(`${overdue} overdue ${overdue === 1 ? "task" : "tasks"}.`);
  }
  if (blocked > 0) {
    score -= Math.min(blocked * 10, 30);
    reasons.push(`${blocked} blocked ${blocked === 1 ? "task" : "tasks"}.`);
  }
  if (overloaded.length > 0) {
    score -= overloaded.length * 10;
    reasons.push(`Overloaded: ${overloaded.join(", ")}.`);
  }
  if (deadlinePassed) {
    score -= 20;
    reasons.push("The project deadline has passed and work is not finished.");
  }

  score = Math.max(0, Math.min(100, score));
  const level = score >= 70 ? "healthy" : score >= 40 ? "warning" : "risk";

  const daysLeft = project?.deadline
    ? Math.ceil((new Date(project.deadline) - new Date(today)) / 86400000)
    : null;

  return { score, level, reasons, progress, total, done, overdue, blocked, daysLeft };
}

export default function Mentor() {
  const { feedback, setFeedback, reviewRequests, setReviewRequests } = useAppData();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { milestones, setMilestones } = useMilestones();
  const { currentUser } = useAuth();

  const isMentor = currentUser?.role === "mentor";

  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? "");
  const [form, setForm] = useState(emptyForm);
  const [notes, setNotes] = useState({}); // review note typed for each milestone
  const [noteError, setNoteError] = useState({});

  const today = new Date().toISOString().slice(0, 10);
  const projectId = Number(selectedId);
  const project = projects.find((p) => p.id === projectId);

  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  const health = computeHealth(projectTasks, project, today);
  const hs = HEALTH_STYLE[health.level];

  const projectMilestones = milestones
    .filter((m) => m.projectId === projectId)
    .sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"));

  const history = feedback
    .filter((f) => f.projectId === projectId)
    .sort((a, b) => b.id - a.id);

  const latest = history[0];
  const requestedAt = reviewRequests[projectId];
  let status = "none";
  if (latest) status = latest.status;
  if (requestedAt && (!latest || requestedAt > latest.id)) status = "requested";

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!project || !form.comment.trim()) return;
    setFeedback([
      ...feedback,
      {
        id: Date.now(),
        projectId,
        mentor: form.mentor.trim() || currentUser?.name || "Mentor",
        comment: form.comment.trim(),
        status: form.status,
        date: today,
      },
    ]);
    setForm(emptyForm);
  };

  const requestReview = () => {
    setReviewRequests({ ...reviewRequests, [projectId]: Date.now() });
  };

  const deleteNote = (id) => setFeedback((prev) => prev.filter((f) => f.id !== id));

  const reviewMilestone = (m, decision) => {
    const note = (notes[m.id] || "").trim();
    if (decision === "rejected" && !note) {
      setNoteError({ ...noteError, [m.id]: "Please write a reason for rejecting." });
      return;
    }
    setNoteError({ ...noteError, [m.id]: "" });
    setMilestones((prev) =>
      prev.map((x) =>
        x.id === m.id
          ? {
              ...x,
              reviewStatus: decision,
              reviewNote: note,
              reviewedBy: currentUser?.name || "Mentor",
              reviewedAt: today,
            }
          : x
      )
    );
    setNotes({ ...notes, [m.id]: "" });
  };

  const resetReview = (id) => {
    setMilestones((prev) =>
      prev.map((x) =>
        x.id === id
          ? { ...x, reviewStatus: "pending", reviewNote: "", reviewedBy: "", reviewedAt: "" }
          : x
      )
    );
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
          {/* Project picker + status + request review */}
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

            <span className={`text-sm px-3 py-2 rounded text-center ${STATUS_STYLE[status]}`}>
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

          {/* Project summary */}
          {project && (
            <div className="bg-slate-800 rounded-lg p-4 mb-6">
              <h2 className="font-semibold">{project.name}</h2>
              {project.description && (
                <p className="text-sm text-slate-300 mt-1">{project.description}</p>
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

          {/* Project health */}
          <div className="bg-slate-800 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Project health</h2>
                <p className="text-4xl font-bold mt-2">
                  {health.score}
                  <span className="text-lg text-slate-300">/100</span>
                </p>
              </div>
              <span className={`text-sm px-3 py-1 rounded ${hs.badge}`}>{hs.label}</span>
            </div>

            <div className="h-3 bg-slate-700 rounded-full overflow-hidden mt-3">
              <div className={`h-full ${hs.bar}`} style={{ width: `${health.score}%` }} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 text-center">
              <div className="bg-slate-700 rounded p-2">
                <p className="text-xl font-bold">{health.progress}%</p>
                <p className="text-xs text-slate-300">Progress</p>
              </div>
              <div className="bg-slate-700 rounded p-2">
                <p className="text-xl font-bold">
                  {health.done}/{health.total}
                </p>
                <p className="text-xs text-slate-300">Tasks done</p>
              </div>
              <div className="bg-slate-700 rounded p-2">
                <p className={`text-xl font-bold ${health.overdue ? "text-red-400" : ""}`}>
                  {health.overdue}
                </p>
                <p className="text-xs text-slate-300">Overdue</p>
              </div>
              <div className="bg-slate-700 rounded p-2">
                <p className={`text-xl font-bold ${health.blocked ? "text-red-400" : ""}`}>
                  {health.blocked}
                </p>
                <p className="text-xs text-slate-300">Blocked</p>
              </div>
              <div className="bg-slate-700 rounded p-2">
                <p className="text-xl font-bold">
                  {health.daysLeft == null
                    ? "-"
                    : health.daysLeft < 0
                    ? `${-health.daysLeft} late`
                    : health.daysLeft}
                </p>
                <p className="text-xs text-slate-300">Days left</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium mb-1">Why this score?</p>
              {health.reasons.length === 0 ? (
                <p className="text-sm text-green-300">No problems detected. 🎉</p>
              ) : (
                <ul className="text-sm text-slate-300 list-disc pl-5 space-y-1">
                  {health.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-slate-500 mt-2">
                Calculated from tasks with simple rules. Member 3's AI engine will replace this
                later.
              </p>
            </div>
          </div>

          {/* Milestone review */}
          <div className="bg-slate-800 rounded-lg p-4 mb-6">
            <h2 className="font-semibold mb-1">Milestone review</h2>
            {!isMentor && (
              <p className="text-sm text-yellow-300 mb-3">
                Only mentors can approve or reject. You are logged in as a student, so you can
                see the status but not change it.
              </p>
            )}

            {projectMilestones.length === 0 ? (
              <p className="text-sm text-slate-300 mt-2">
                No milestones for this project yet. Add some on the Milestones page.
              </p>
            ) : (
              <div className="space-y-3 mt-3">
                {projectMilestones.map((m) => {
                  const list = tasks.filter((t) => t.milestoneId === m.id);
                  const done = list.filter((t) => t.status === "done").length;
                  const pct = list.length ? Math.round((done / list.length) * 100) : 0;
                  const review = m.reviewStatus || "pending";
                  return (
                    <div key={m.id} className="bg-slate-700 rounded p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{m.title}</p>
                          <p className="text-xs text-slate-300">
                            Deadline: {m.deadline || "Not set"} · {done}/{list.length} tasks done ({pct}%)
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${REVIEW_STYLE[review]}`}>
                          {REVIEW_LABEL[review]}
                        </span>
                      </div>

                      {review !== "pending" && (
                        <div className="mt-2 text-sm text-slate-200">
                          {m.reviewNote && <p>“{m.reviewNote}”</p>}
                          <p className="text-xs text-slate-400 mt-1">
                            By {m.reviewedBy || "Mentor"} on {m.reviewedAt}
                          </p>
                        </div>
                      )}

                      {isMentor && (
                        <div className="mt-3 space-y-2">
                          <input
                            value={notes[m.id] || ""}
                            onChange={(e) => setNotes({ ...notes, [m.id]: e.target.value })}
                            placeholder="Note for the team (required when rejecting)"
                            className="w-full rounded bg-slate-600 border border-slate-500 px-3 py-2 text-sm text-white placeholder-slate-400"
                          />
                          {noteError[m.id] && (
                            <p className="text-xs text-red-400">{noteError[m.id]}</p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => reviewMilestone(m, "approved")}
                              className="rounded bg-green-600 hover:bg-green-500 px-3 py-1 text-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => reviewMilestone(m, "rejected")}
                              className="rounded bg-red-600 hover:bg-red-500 px-3 py-1 text-sm"
                            >
                              Reject
                            </button>
                            {review !== "pending" && (
                              <button
                                onClick={() => resetReview(m.id)}
                                className="rounded bg-slate-600 hover:bg-slate-500 px-3 py-1 text-sm"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Add feedback form */}
            <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg p-4 space-y-3 h-fit">
              <h2 className="font-semibold">Add mentor feedback</h2>
              <input
                name="mentor"
                value={form.mentor}
                onChange={handleChange}
                placeholder={`Mentor name (default: ${currentUser?.name || "Mentor"})`}
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

            {/* Feedback history */}
            <div className="bg-slate-800 rounded-lg p-4">
              <h2 className="font-semibold mb-3">Feedback history ({history.length})</h2>
              {history.length === 0 ? (
                <p className="text-sm text-slate-300">No feedback yet for this project.</p>
              ) : (
                <ul className="space-y-3">
                  {history.map((n) => (
                    <li key={n.id} className="bg-slate-700 rounded p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{n.mentor}</p>
                          <p className="text-xs text-slate-300">{n.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${STATUS_STYLE[n.status]}`}>
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