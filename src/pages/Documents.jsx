import { useState } from "react";
import { useAppData } from "../context/AppDataContext";

const TYPES = ["Report", "Design", "Code", "Notes", "Presentation", "Other"];

const typeStyle = {
  Report: "bg-blue-900 text-blue-200",
  Design: "bg-purple-900 text-purple-200",
  Code: "bg-green-900 text-green-200",
  Notes: "bg-yellow-900 text-yellow-200",
  Presentation: "bg-red-900 text-red-200",
  Other: "bg-slate-600 text-slate-200",
};

const emptyForm = { title: "", type: "Report", link: "", addedBy: "" };

const inputClass =
  "w-full rounded bg-slate-700 border border-slate-600 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500";

export default function Documents() {
  const { members, documents, setDocuments } = useAppData();
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState("All");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setDocuments([
      ...documents,
      {
        id: Date.now(),
        title: form.title.trim(),
        type: form.type,
        link: form.link.trim(),
        addedBy: form.addedBy,
        date: new Date().toISOString().slice(0, 10),
      },
    ]);
    setForm(emptyForm);
  };

  const deleteDocument = (id) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const shown =
    filter === "All" ? documents : documents.filter((d) => d.type === filter);

  const openLink = (link) =>
    link.startsWith("http") ? link : `https://${link}`;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Documents</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3"
      >
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Document title"
          required
          className={`${inputClass} xl:col-span-2`}
        />
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className={inputClass}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          name="addedBy"
          value={form.addedBy}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="">Added by...</option>
          {members.map((m) => (
            <option key={m.id} value={m.name}>
              {m.name}
            </option>
          ))}
        </select>
        <input
          name="link"
          value={form.link}
          onChange={handleChange}
          placeholder="Link (Google Drive, GitHub...)"
          className={inputClass}
        />
        <button
          type="submit"
          className="md:col-span-2 xl:col-span-5 rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 font-medium"
        >
          + Add Document
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mb-4">
        {["All", ...TYPES].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`text-sm px-3 py-1 rounded ${
              filter === t ? "bg-blue-600" : "bg-slate-700 hover:bg-slate-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-slate-300">No documents here yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {shown.map((d) => (
            <div key={d.id} className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{d.title}</h2>
                <button
                  onClick={() => deleteDocument(d.id)}
                  title="Delete document"
                  className="text-slate-400 hover:text-red-400 text-sm"
                >
                  ✕
                </button>
              </div>

              <span
                className={`inline-block text-xs px-2 py-1 rounded mt-2 ${typeStyle[d.type]}`}
              >
                {d.type}
              </span>

              <p className="text-sm text-slate-300 mt-3">
                {d.addedBy ? `Added by ${d.addedBy}` : "Added by unknown"} ·{" "}
                {d.date}
              </p>

              {d.link ? (
                <a
                  href={openLink(d.link)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-sm text-blue-400 hover:text-blue-300 mt-2"
                >
                  Open document →
                </a>
              ) : (
                <p className="text-sm text-slate-500 mt-2">No link added</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}