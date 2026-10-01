import { useState } from 'react'

const emptyForm = {
  name: '',
  description: '',
  team: '',
  techStack: '',
  startDate: '',
  deadline: '',
  goals: '',
}

const inputStyle =
  'w-full rounded bg-slate-800 border border-slate-600 p-2 text-white focus:outline-none focus:border-green-400'

function Projects() {
  const [form, setForm] = useState(emptyForm)
  const [projects, setProjects] = useState([])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit(e) {
    e.preventDefault()
    setProjects([...projects, { ...form, id: Date.now() }])
    setForm(emptyForm)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-green-400 mb-6">Projects</h1>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4 mb-10">
        <div>
          <label className="block mb-1 text-slate-300">Project Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className={inputStyle}
          />
        </div>

        <div>
          <label className="block mb-1 text-slate-300">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="3"
            className={inputStyle}
          />
        </div>

        <div>
          <label className="block mb-1 text-slate-300">
            Team Members (separate with commas)
          </label>
          <input
            name="team"
            value={form.team}
            onChange={handleChange}
            className={inputStyle}
          />
        </div>

        <div>
          <label className="block mb-1 text-slate-300">Tech Stack</label>
          <input
            name="techStack"
            value={form.techStack}
            onChange={handleChange}
            className={inputStyle}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block mb-1 text-slate-300">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>
          <div className="flex-1">
            <label className="block mb-1 text-slate-300">Deadline</label>
            <input
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 text-slate-300">Project Goals</label>
          <textarea
            name="goals"
            value={form.goals}
            onChange={handleChange}
            rows="3"
            className={inputStyle}
          />
        </div>

        <button
          type="submit"
          className="bg-green-500 text-slate-900 font-semibold px-5 py-2 rounded hover:bg-green-400"
        >
          Create Project
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
      {projects.length === 0 && (
        <p className="text-slate-400">No projects yet. Create your first one above.</p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((p) => (
          <div key={p.id} className="bg-slate-800 rounded p-4">
            <h3 className="text-lg font-bold text-green-400">{p.name}</h3>
            <p className="text-slate-300 text-sm mt-1">{p.description}</p>
            <p className="text-slate-400 text-sm mt-2">Team: {p.team}</p>
            <p className="text-slate-400 text-sm">Tech: {p.techStack}</p>
            <p className="text-slate-400 text-sm">
              {p.startDate} to {p.deadline}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Projects