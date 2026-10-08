import { useState } from "react";
import { useKnowledge } from "../context/KnowledgeContext";
import { useProjects } from "../context/ProjectsContext";
import { useAppData } from "../context/AppDataContext";

const inputClass =
  "w-full rounded bg-slate-700 border border-slate-600 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500";

const TYPES = [
  "Research paper",
  "Meeting note",
  "Requirement",
  "Architecture",
  "Dataset",
  "Reference link",
  "Other",
];

const KINDS = [
  { key: "file", label: "Upload file" },
  { key: "link", label: "Add link" },
  { key: "note", label: "Write note" },
];

const KIND_ICON = { file: "📄", link: "🔗", note: "📝" };

const TEXT_EXT = [".txt", ".md", ".csv", ".json", ".log"];
const MAX_TEXT_BYTES = 300 * 1024;

const emptyForm = {
  kind: "file",
  title: "",
  type: "Research paper",
  projectId: "",
  tags: "",
  description: "",
  link: "",
  addedBy: "",
  file: null, // { name, size, content }
};

const formatSize = (b) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function Highlight({ text, query }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegex(q)})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === q.toLowerCase() ? (
          <mark key={i} className="bg-yellow-300 text-slate-900 rounded px-0.5">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

// short piece of text around the first match
function snippet(item, query) {
  const q = query.trim().toLowerCase();
  if (!q) return "";
  for (const field of [item.content, item.description]) {
    if (!field) continue;
    const at = field.toLowerCase().indexOf(q);
    if (at !== -1) {
      const start = Math.max(0, at - 50);
      const end = Math.min(field.length, at + q.length + 70);
      return `${start > 0 ? "…" : ""}${field.slice(start, end).replace(/\s+/g, " ")}${
        end < field.length ? "…" : ""
      }`;
    }
  }
  return "";
}

const matches = (item, q) => {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return [item.title, item.description, item.content, item.fileName, item.type, ...(item.tags || [])]
    .filter(Boolean)
    .some((f) => f.toLowerCase().includes(needle));
};

export default function KnowledgeBase() {
  const { items, setItems } = useKnowledge();
  const { projects } = useProjects();
  const { members } = useAppData();

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [fileKey, setFileKey] = useState(0); // resets the file input
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [openId, setOpenId] = useState(null);

  const projectName = (id) => projects.find((p) => p.id === id)?.name || "No project";

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    const lower = file.name.toLowerCase();
    const isText = TEXT_EXT.some((ext) => lower.endsWith(ext));
    const base = { name: file.name, size: file.size, content: "" };
    const title = form.title || file.name.replace(/\.[^.]+$/, "");

    if (isText && file.size <= MAX_TEXT_BYTES) {
      const reader = new FileReader();
      reader.onload = () =>
        setForm((f) => ({ ...f, title, file: { ...base, content: String(reader.result) } }));
      reader.onerror = () => setError("Could not read this file.");
      reader.readAsText(file);
    } else {
      if (isText) setError("Text file is over 300 KB, so only its details will be saved.");
      setForm((f) => ({ ...f, title, file: base }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("Please enter a title.");
    if (form.kind === "file" && !form.file) return setError("Please choose a file.");
    if (form.kind === "link" && !form.link.trim()) return setError("Please paste a link.");
    if (form.kind === "note" && !form.description.trim()) return setError("Please write the note.");

    setItems((prev) => [
      {
        id: Date.now(),
        projectId: form.projectId === "" ? null : Number(form.projectId),
        kind: form.kind,
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim(),
        content: form.kind === "file" ? form.file.content : "",
        link: form.kind === "link" ? form.link.trim() : "",
        fileName: form.kind === "file" ? form.file.name : "",
        fileSize: form.kind === "file" ? form.file.size : 0,
        tags: form.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
        addedBy: form.addedBy,
        date: new Date().toISOString().slice(0, 10),
      },
      ...prev,
    ]);
    setForm({ ...emptyForm, kind: form.kind, projectId: form.projectId });
    setFileKey((k) => k + 1);
  };

  const deleteItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (openId === id) setOpenId(null);
  };

  const openLink = (l) => (l.startsWith("http") ? l : `https://${l}`);

  const shown = items
    .filter((i) => matches(i, query))
    .filter((i) => typeFilter === "all" || i.type === typeFilter)
    .filter((i) =>
      projectFilter === "all"
        ? true
        : projectFilter === "none"
        ? i.projectId == null
        : i.projectId === Number(projectFilter)
    );

  const open = items.find((i) => i.id === openId);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Knowledge Base</h1>

      {/* Add form */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
      >
        <div className="md:col-span-2 xl:col-span-3 flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button
              type="button"
              key={k.key}
              onClick={() => {
                setForm({ ...form, kind: k.key });
                setError("");
              }}
              className={`px-3 py-1 rounded text-sm ${
                form.kind === k.key ? "bg-blue-600" : "bg-slate-700 hover:bg-slate-600"
              }`}
            >
              {KIND_ICON[k.key]} {k.label}
            </button>
          ))}
        </div>

        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Title"
          className={inputClass}
        />
        <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select name="projectId" value={form.projectId} onChange={handleChange} className={inputClass}>
          <option value="">No project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {form.kind === "file" && (
          <div className="md:col-span-2 xl:col-span-3">
            <input
              key={fileKey}
              type="file"
              accept=".txt,.md,.csv,.json,.log,.pdf,.doc,.docx,.ppt,.pptx"
              onChange={handleFile}
              className="block w-full text-sm text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-slate-600 file:px-3 file:py-2 file:text-white hover:file:bg-slate-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Text files (.txt, .md, .csv, .json) are fully searchable. For PDF or Word files, add a
              description below so they can be found.
              {form.file && (
                <span className="text-green-300">
                  {" "}Selected: {form.file.name} ({formatSize(form.file.size)})
                  {form.file.content ? ", text loaded" : ", details only"}
                </span>
              )}
            </p>
          </div>
        )}

        {form.kind === "link" && (
          <input
            name="link"
            value={form.link}
            onChange={handleChange}
            placeholder="Link (Google Drive, paper URL, GitHub...)"
            className={`${inputClass} md:col-span-2 xl:col-span-3`}
          />
        )}

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder={
            form.kind === "note"
              ? "Write your note or meeting minutes..."
              : "Short description or summary (makes it easier to find)"
          }
          rows={form.kind === "note" ? 5 : 2}
          className={`${inputClass} md:col-span-2 xl:col-span-3`}
        />

        <input
          name="tags"
          value={form.tags}
          onChange={handleChange}
          placeholder="Tags (comma separated)"
          className={inputClass}
        />
        <select name="addedBy" value={form.addedBy} onChange={handleChange} className={inputClass}>
          <option value="">Added by...</option>
          {members.map((m) => (
            <option key={m.id} value={m.name}>{m.name}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 font-medium"
        >
          + Add to Knowledge Base
        </button>

        {error && <p className="text-sm text-red-400 md:col-span-2 xl:col-span-3">{error}</p>}
      </form>

      {/* Search + filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Search titles, notes, tags and file text..."
          className={`${inputClass} md:col-span-1`}
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={inputClass}>
          <option value="all">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className={inputClass}>
          <option value="all">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
          <option value="none">No project</option>
        </select>
      </div>
      <p className="text-sm text-slate-300 mb-3">
        {shown.length} of {items.length} items
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Results */}
        <div className="space-y-3">
          {shown.length === 0 ? (
            <p className="text-slate-300">Nothing found. Try another word or clear the filters.</p>
          ) : (
            shown.map((i) => {
              const snip = snippet(i, query);
              return (
                <div
                  key={i.id}
                  className={`bg-slate-800 rounded-lg p-4 border ${
                    openId === i.id ? "border-blue-500" : "border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => setOpenId(i.id)}
                      className="text-left font-semibold hover:text-blue-300"
                    >
                      {KIND_ICON[i.kind]} <Highlight text={i.title} query={query} />
                    </button>
                    <button
                      onClick={() => deleteItem(i.id)}
                      title="Delete"
                      className="text-slate-400 hover:text-red-400 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {i.type} · {projectName(i.projectId)} · {i.addedBy || "Unknown"} · {i.date}
                  </p>
                  {snip && (
                    <p className="text-sm text-slate-300 mt-2">
                      <Highlight text={snip} query={query} />
                    </p>
                  )}
                  {i.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {i.tags.map((t) => (
                        <span key={t} className="text-xs bg-slate-700 text-slate-200 rounded px-2 py-0.5">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Viewer */}
        <div>
          {!open ? (
            <div className="bg-slate-800 rounded-lg p-4 text-slate-300 text-sm">
              Click an item's title to read it here.
            </div>
          ) : (
            <div className="bg-slate-800 rounded-lg p-4 xl:sticky xl:top-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold">
                  {KIND_ICON[open.kind]} {open.title}
                </h2>
                <button
                  onClick={() => setOpenId(null)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  Close
                </button>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {open.type} · {projectName(open.projectId)} · Added by {open.addedBy || "Unknown"} on{" "}
                {open.date}
              </p>

              {open.link && (
                <a
                  href={openLink(open.link)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-sm text-blue-400 hover:text-blue-300 mt-3"
                >
                  Open link →
                </a>
              )}

              {open.fileName && (
                <p className="text-sm text-slate-300 mt-3">
                  File: {open.fileName} ({formatSize(open.fileSize)})
                </p>
              )}

              {open.description && (
                <p className="text-sm text-slate-200 mt-3 whitespace-pre-line">
                  <Highlight text={open.description} query={query} />
                </p>
              )}

              {open.content ? (
                <pre className="mt-3 max-h-96 overflow-auto bg-slate-900 rounded p-3 text-xs text-slate-200 whitespace-pre-wrap break-words">
                  <Highlight text={open.content} query={query} />
                </pre>
              ) : open.kind === "file" ? (
                <p className="text-xs text-yellow-300 mt-3">
                  No text preview for this file type. The real file will be viewable once the
                  backend stores uploads.
                </p>
              ) : null}

              {open.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {open.tags.map((t) => (
                    <span key={t} className="text-xs bg-slate-700 text-slate-200 rounded px-2 py-0.5">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
