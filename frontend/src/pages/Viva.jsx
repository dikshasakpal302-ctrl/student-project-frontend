import { useState } from "react";
import { useProjects } from "../context/ProjectsContext";
import { useTasks } from "../context/TasksContext";
import { useMilestones } from "../context/MilestonesContext";
import { useKnowledge } from "../context/KnowledgeContext";
import usePersistentState from "../hooks/usePersistentState";
import { CATEGORIES, generateQuestions } from "../services/vivaService";

const inputClass =
  "w-full rounded bg-slate-700 border border-slate-600 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500";

const CAT_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.label]));

const CAT_STYLE = {
  basic: "bg-slate-600 text-slate-100",
  technical: "bg-blue-900 text-blue-200",
  architecture: "bg-purple-900 text-purple-200",
  database: "bg-green-900 text-green-200",
  ml: "bg-yellow-900 text-yellow-200",
  project: "bg-red-900 text-red-200",
  cross: "bg-orange-900 text-orange-200",
};

const STATE_LABEL = { confident: "Confident", practice: "Need practice" };
const STATE_STYLE = {
  confident: "bg-green-200 text-green-800",
  practice: "bg-yellow-200 text-yellow-800",
};

function QuestionCard({ q, state, onChange, showAnswerBox = true }) {
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <span className={`text-xs px-2 py-1 rounded ${CAT_STYLE[q.category]}`}>
          {CAT_LABEL[q.category]}
        </span>
        {state?.status && (
          <span className={`text-xs px-2 py-1 rounded ${STATE_STYLE[state.status]}`}>
            {STATE_LABEL[state.status]}
          </span>
        )}
      </div>

      <p className="font-medium mt-3">{q.question}</p>

      <button
        onClick={() => setShowHint(!showHint)}
        className="text-sm text-blue-400 hover:text-blue-300 mt-2"
      >
        {showHint ? "Hide hint and follow-ups" : "Show hint and follow-ups"}
      </button>

      {showHint && (
        <div className="mt-2 bg-slate-700 rounded p-3 text-sm space-y-2">
          <p className="text-slate-200">💡 {q.hint}</p>
          {q.followUps.length > 0 && (
            <div>
              <p className="text-slate-300 font-medium">Expect these follow-ups:</p>
              <ul className="list-disc pl-5 text-slate-300">
                {q.followUps.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {showAnswerBox && (
        <textarea
          value={state?.answer || ""}
          onChange={(e) => onChange({ answer: e.target.value })}
          placeholder="Write your own answer here (saved automatically)"
          rows={3}
          className={`${inputClass} mt-3 text-sm`}
        />
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        <button
          onClick={() => onChange({ status: "confident" })}
          className="rounded bg-green-600 hover:bg-green-500 px-3 py-1 text-sm"
        >
          I'm confident
        </button>
        <button
          onClick={() => onChange({ status: "practice" })}
          className="rounded bg-yellow-600 hover:bg-yellow-500 px-3 py-1 text-sm"
        >
          Need practice
        </button>
        {state?.status && (
          <button
            onClick={() => onChange({ status: "" })}
            className="rounded bg-slate-600 hover:bg-slate-500 px-3 py-1 text-sm"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export default function Viva() {
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { milestones } = useMilestones();
  const { items: knowledge } = useKnowledge();
  const [progress, setProgress] = usePersistentState("spm_viva", {});

  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mock, setMock] = useState(null); // { order: [keys], pos: number }

  const today = new Date().toISOString().slice(0, 10);
  const project = projects.find((p) => p.id === Number(projectId));

  if (projects.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Viva Preparation</h1>
        <p className="text-slate-300">Create a project first, then questions will be prepared for it.</p>
      </div>
    );
  }

  const pid = project?.id;
  const questions = generateQuestions({
    project,
    tasks: tasks.filter((t) => t.projectId === pid),
    milestones: milestones.filter((m) => m.projectId === pid),
    knowledge: knowledge.filter((k) => k.projectId === pid),
    today,
  }).map((q) => ({ ...q, key: `${pid}|${q.question}` }));

  const stateOf = (key) => progress[key] || {};
  const change = (key, changes) =>
    setProgress((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), ...changes } }));

  const total = questions.length;
  const confident = questions.filter((q) => stateOf(q.key).status === "confident").length;
  const practice = questions.filter((q) => stateOf(q.key).status === "practice").length;
  const answered = questions.filter((q) => (stateOf(q.key).answer || "").trim()).length;
  const readiness = total ? Math.round((confident / total) * 100) : 0;

  const shown = questions
    .filter((q) => category === "all" || q.category === category)
    .filter((q) => {
      const s = stateOf(q.key).status || "none";
      return statusFilter === "all" || s === statusFilter;
    });

  const startMock = () => {
    const pool = questions.filter((q) => stateOf(q.key).status !== "confident");
    const source = pool.length ? pool : questions;
    const order = [...source]
      .sort(() => Math.random() - 0.5)
      .slice(0, 10)
      .map((q) => q.key);
    setMock({ order, pos: 0 });
  };

  const mockQuestion = mock ? questions.find((q) => q.key === mock.order[mock.pos]) : null;
  const mockDone = mock && mock.pos >= mock.order.length;

  const changeProject = (value) => {
    setProjectId(value);
    setMock(null);
    setCategory("all");
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Viva Preparation</h1>
        <select
          value={projectId}
          onChange={(e) => changeProject(e.target.value)}
          className={`${inputClass} md:max-w-xs`}
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
          <h2 className="font-semibold">Viva readiness</h2>
          <span className="text-sm text-slate-300">
            {confident} of {total} questions confident
          </span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 transition-all" style={{ width: `${readiness}%` }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center mt-4">
          <div className="bg-slate-700 rounded p-2">
            <p className="text-xl font-bold">{readiness}%</p>
            <p className="text-xs text-slate-300">Ready</p>
          </div>
          <div className="bg-slate-700 rounded p-2">
            <p className="text-xl font-bold text-green-400">{confident}</p>
            <p className="text-xs text-slate-300">Confident</p>
          </div>
          <div className="bg-slate-700 rounded p-2">
            <p className="text-xl font-bold text-yellow-300">{practice}</p>
            <p className="text-xs text-slate-300">Need practice</p>
          </div>
          <div className="bg-slate-700 rounded p-2">
            <p className="text-xl font-bold text-blue-300">{answered}</p>
            <p className="text-xs text-slate-300">Answers written</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={startMock}
            className="rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium"
          >
            🎤 Start mock viva (10 questions)
          </button>
          <p className="text-xs text-slate-400">
            Mock viva picks random questions, starting with the ones you are not confident about.
          </p>
        </div>
      </div>

      {/* Mock viva */}
      {mock && (
        <div className="bg-slate-900 border border-blue-500 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">
              Mock viva
              {!mockDone && (
                <span className="text-sm text-slate-300">
                  {" "}
                  · question {mock.pos + 1} of {mock.order.length}
                </span>
              )}
            </h2>
            <button
              onClick={() => setMock(null)}
              className="text-sm text-slate-400 hover:text-white"
            >
              End mock
            </button>
          </div>

          {mockDone ? (
            <div>
              <p className="text-green-300 font-medium">Mock viva finished. 🎉</p>
              <p className="text-sm text-slate-300 mt-1">
                Questions marked "Need practice" are in the list below. Filter by that status to
                revise them.
              </p>
              <button
                onClick={startMock}
                className="mt-3 rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm"
              >
                Run another
              </button>
            </div>
          ) : (
            mockQuestion && (
              <>
                <QuestionCard
                  key={mockQuestion.key}
                  q={mockQuestion}
                  state={stateOf(mockQuestion.key)}
                  onChange={(c) => change(mockQuestion.key, c)}
                />
                <button
                  onClick={() => setMock({ ...mock, pos: mock.pos + 1 })}
                  className="mt-3 rounded bg-slate-600 hover:bg-slate-500 px-4 py-2 text-sm"
                >
                  {mock.pos + 1 === mock.order.length ? "Finish" : "Next question →"}
                </button>
              </>
            )
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        {[{ key: "all", label: "All" }, ...CATEGORIES].map((c) => {
          const n =
            c.key === "all"
              ? total
              : questions.filter((q) => q.category === c.key).length;
          return (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`text-sm px-3 py-1 rounded ${
                category === c.key ? "bg-blue-600" : "bg-slate-700 hover:bg-slate-600"
              }`}
            >
              {c.label} ({n})
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-slate-300">Show:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${inputClass} md:max-w-xs`}
        >
          <option value="all">All questions</option>
          <option value="none">Not practised yet</option>
          <option value="practice">Need practice</option>
          <option value="confident">Confident</option>
        </select>
        <span className="text-sm text-slate-300">{shown.length} shown</span>
      </div>

      {shown.length === 0 ? (
        <p className="text-slate-300">No questions match these filters.</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {shown.map((q) => (
            <QuestionCard
              key={q.key}
              q={q}
              state={stateOf(q.key)}
              onChange={(c) => change(q.key, c)}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-6">
        Demo mode: questions are generated by rules in src/services/vivaService.js from your
        project's tech stack, tasks, milestones and Knowledge Base. Member 3's AI will replace that
        file.
      </p>
    </div>
  );
}