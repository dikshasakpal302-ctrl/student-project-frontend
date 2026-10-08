import { useState } from "react";
import { useSubmissions } from "../context/SubmissionsContext";
import { useProjects } from "../context/ProjectsContext";
import { useAuth } from "../context/AuthContext";

const inputClass =
  "w-full rounded bg-slate-700 border border-slate-600 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500";

const STATUS_STYLE = {
  pending: "bg-slate-600 text-slate-200",
  submitted: "bg-blue-200 text-blue-800",
  approved: "bg-green-200 text-green-800",
  changes: "bg-red-200 text-red-800",
};

const STATUS_LABEL = {
  pending: "Not submitted",
  submitted: "Submitted, awaiting review",
  approved: "Approved",
  changes: "Changes requested",
};

const STANDARD = [
  { title: "Final report", description: "Complete project report as a PDF." },
  { title: "Source code", description: "GitHub repository link or ZIP of the code." },
  { title: "Presentation (PPT)", description: "Slides used for the final presentation." },
  { title: "Demo video", description: "Short video showing the working project." },
  { title: "Declaration form", description: "Signed originality declaration." },
];

const formatSize = (b) =>
  !b ? "" : b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

const openLink = (l) => (l.startsWith("http") ? l : `https://${l}`);

function RequirementCard({ req, today, isMentor, userName, onUpdate, onDelete }) {
  const [link, setLink] = useState("");
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [reviewError, setReviewError] = useState("");

  const overdue =
    (req.status === "pending" || req.status === "changes") &&
    req.deadline &&
    req.deadline < today;

  const submit = (e) => {
    e.preventDefault();
    if (!link.trim() && !file) {
      setError("Add a link or choose a file.");
      return;
    }
    setError("");
    onUpdate(req.id, {
      status: "submitted",
      link: link.trim(),
      fileName: file ? file.name : "",
      fileSize: file ? file.size : 0,
      submittedBy: userName,
      submittedAt: today,
      reviewer: "",
      reviewNote: "",
      reviewedAt: "",
    });
    setLink("");
    setFile(null);
    setFileKey((k) => k + 1);
  };

  const review = (decision) => {
    const text = note.trim();
    if (decision === "changes" && !text) {
      setReviewError("Please write what needs to change.");
      return;
    }
    setReviewError("");
    onUpdate(req.id, {
      status: decision,
      reviewer: userName,
      reviewNote: text,
      reviewedAt: today,
    });
    setNote("");
  };

  const reset = () =>
    onUpdate(req.id, {
      status: "pending",
      link: "",
      fileName: "",
      fileSize: 0,
      submittedBy: "",
      submittedAt: "",
      reviewer: "",
      reviewNote: "",
      reviewedAt: "",
    });

  const canSubmit = req.status === "pending" || req.status === "changes";

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{req.title}</h2>
          {req.description && (
            <p className="text-sm text-slate-300 mt-1">{req.description}</p>
          )}
          <p className={`text-xs mt-1 ${overdue ? "text-red-400" : "text-slate-400"}`}>
            {req.deadline
              ? `${overdue ? "Overdue, was due " : "Due "}${req.deadline}`
              : "No deadline"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-1 rounded ${STATUS_STYLE[req.status]}`}>
            {STATUS_LABEL[req.status]}
          </span>
          <button
            onClick={() => onDelete(req.id)}
            title="Delete requirement"
            className="text-slate-400 hover:text-red-400"
          >
            ✕
          </button>
        </div>
      </div>

      {(req.link || req.fileName) && (
        <div className="mt-3 bg-slate-700 rounded p-3 text-sm">
          <p className="text-slate-300">
            Submitted by {req.submittedBy || "unknown"} on {req.submittedAt}
          </p>
          {req.link && (
            <a
              href={openLink(req.link)}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-300 break-all"
            >
              Open link →
            </a>
          )}
          {req.fileName && (
            <p className="text-slate-200">
              📎 {req.fileName} {formatSize(req.fileSize) && `(${formatSize(req.fileSize)})`}
            </p>
          )}
        </div>
      )}

      {req.reviewNote && (
        <p className="mt-3 text-sm text-slate-200">
          Mentor note: “{req.reviewNote}”{" "}
          <span className="text-xs text-slate-400">
            ({req.reviewer || "Mentor"}, {req.reviewedAt})
          </span>
        </p>
      )}

      {canSubmit && (
        <form onSubmit={submit} className="mt-3 space-y-2">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Link (Google Drive, GitHub, YouTube...)"
            className={inputClass}
          />
          <input
            key={fileKey}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-slate-600 file:px-3 file:py-2 file:text-white hover:file:bg-slate-500"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            className="rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium"
          >
            {req.status === "changes" ? "Resubmit" : "Submit"}
          </button>
        </form>
      )}

      {isMentor && req.status === "submitted" && (
        <div className="mt-3 space-y-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Review note (required when requesting changes)"
            className="w-full rounded bg-slate-600 border border-slate-500 px-3 py-2 text-sm text-white placeholder-slate-400"
          />
          {reviewError && <p className="text-xs text-red-400">{reviewError}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => review("approved")}
              className="rounded bg-green-600 hover:bg-green-500 px-3 py-1 text-sm"
            >
              Approve
            </button>
            <button
              onClick={() => review("changes")}
              className="rounded bg-red-600 hover:bg-red-500 px-3 py-1 text-sm"
            >
              Request changes
            </button>
          </div>
        </div>
      )}

      {req.status === "submitted" && !isMentor && (
        <p className="text-xs text-slate-400 mt-3">Waiting for a mentor to review this.</p>
      )}

      {req.status !== "pending" && (
        <button
          onClick={reset}
          className="text-xs text-slate-400 hover:text-white mt-3 underline"
        >
          Reset to not submitted
        </button>
      )}
    </div>
  );
}

export default function Submissions() {
  const { submissions, setSubmissions } = useSubmissions();
  const { projects } = useProjects();
  const { currentUser } = useAuth();

  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [form, setForm] = useState({ title: "", deadline: "" });

  const today = new Date().toISOString().slice(0, 10);
  const isMentor = currentUser?.role === "mentor";
  const userName = currentUser?.name || "User";
  const selected = Number(projectId);
  const project = projects.find((p) => p.id === selected);

  const list = submissions
    .filter((s) => s.projectId === selected)
    .sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"));

  const total = list.length;
  const count = (st) => list.filter((s) => s.status === st).length;
  const approved = count("approved");
  const submitted = count("submitted");
  const sentIn = approved + submitted;
  const readiness = total ? Math.round((sentIn / total) * 100) : 0;
  const overdueCount = list.filter(
    (s) => (s.status === "pending" || s.status === "changes") && s.deadline && s.deadline < today
  ).length;

  const blank = (title, description, deadline) => ({
    id: Date.now() + Math.floor(Math.random() * 1000),
    projectId: selected,
    title,
    description,
    deadline,
    status: "pending",
    link: "",
    fileName: "",
    fileSize: 0,
    submittedBy: "",
    submittedAt: "",
    reviewer: "",
    reviewNote: "",
    reviewedAt: "",
  });

  const addStandard = () => {
    const existing = list.map((s) => s.title.toLowerCase());
    const toAdd = STANDARD.filter((s) => !existing.includes(s.title.toLowerCase())).map((s) =>
      blank(s.title, s.description, project?.deadline || "")
    );
    if (toAdd.length) setSubmissions((prev) => [...prev, ...toAdd]);
  };

  const addCustom = (e) => {
    e.preventDefault();
    if (!project || !form.title.trim()) return;
    setSubmissions((prev) => [...prev, blank(form.title.trim(), "", form.deadline)]);
    setForm({ title: "", deadline: "" });
  };

  const update = (id, changes) =>
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, ...changes } : s)));

  const remove = (id) => setSubmissions((prev) => prev.filter((s) => s.id !== id));

  const missingStandard = STANDARD.filter(
    (s) => !list.some((x) => x.title.toLowerCase() === s.title.toLowerCase())
  ).length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Submission Manager</h1>

      {projects.length === 0 ? (
        <p className="text-slate-300">Create a project first, then track its submissions.</p>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-slate-300">Project:</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={`${inputClass} md:max-w-sm`}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Readiness */}
          <div className="bg-slate-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Submission readiness</h2>
              <span className="text-sm text-slate-300">
                {sentIn} of {total} submitted
              </span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${readiness}%` }}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center mt-4">
              <div className="bg-slate-700 rounded p-2">
                <p className="text-xl font-bold">{readiness}%</p>
                <p className="text-xs text-slate-300">Ready</p>
              </div>
              <div className="bg-slate-700 rounded p-2">
                <p className="text-xl font-bold text-green-400">{approved}</p>
                <p className="text-xs text-slate-300">Approved</p>
              </div>
              <div className="bg-slate-700 rounded p-2">
                <p className="text-xl font-bold text-blue-300">{submitted}</p>
                <p className="text-xs text-slate-300">Awaiting review</p>
              </div>
              <div className="bg-slate-700 rounded p-2">
                <p className={`text-xl font-bold ${overdueCount ? "text-red-400" : ""}`}>
                  {overdueCount}
                </p>
                <p className="text-xs text-slate-300">Overdue</p>
              </div>
            </div>
            {total > 0 && approved === total && (
              <p className="text-sm text-green-300 mt-3">
                🎉 Everything is approved. Your project is ready to submit.
              </p>
            )}
            {total > 0 && count("changes") > 0 && (
              <p className="text-sm text-red-300 mt-3">
                {count("changes")} {count("changes") === 1 ? "item needs" : "items need"} changes.
                Fix and resubmit.
              </p>
            )}
          </div>

          {/* Add requirements */}
          <div className="bg-slate-800 rounded-lg p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h2 className="font-semibold">Requirements</h2>
              {missingStandard > 0 && (
                <button
                  onClick={addStandard}
                  className="rounded bg-slate-600 hover:bg-slate-500 px-3 py-1 text-sm"
                >
                  + Add standard checklist ({missingStandard})
                </button>
              )}
            </div>
            <form onSubmit={addCustom} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Custom requirement (e.g. Poster)"
                className={`${inputClass} md:col-span-2`}
              />
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className={inputClass}
              />
              <button
                type="submit"
                className="rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 font-medium"
              >
                + Add
              </button>
            </form>
          </div>

          {!isMentor && (
            <p className="text-sm text-yellow-300 mb-4">
              You are logged in as a student. You can submit work, and a mentor approves it.
            </p>
          )}

          {list.length === 0 ? (
            <p className="text-slate-300">
              No requirements yet. Click "Add standard checklist" to start with the usual five.
            </p>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {list.map((req) => (
                <RequirementCard
                  key={req.id}
                  req={req}
                  today={today}
                  isMentor={isMentor}
                  userName={userName}
                  onUpdate={update}
                  onDelete={remove}
                />
              ))}
            </div>
          )}

          <p className="text-xs text-slate-500 mt-6">
            For now, a chosen file only saves its name and size. Real file storage comes with
            Member 2's backend.
          </p>
        </>
      )}
    </div>
  );
}