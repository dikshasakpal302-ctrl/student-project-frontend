import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/ai', label: 'AI Insights' },
  { to: '/projects', label: 'Projects' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/task-views', label: 'List & Calendar' },
  { to: '/milestones', label: 'Milestones' },
  { to: '/workload', label: 'Workload' },
  { to: '/team', label: 'Team' },
  { to: '/mentor', label: 'Mentor' },
  { to: '/knowledge', label: 'Knowledge Base' },
  { to: '/documents', label: 'Documents' },
  { to: '/reports', label: 'Reports' },
]

function Sidebar() {
  return (
    <aside className="w-56 bg-slate-800 p-4">
      <h2 className="text-lg font-bold text-green-400 mb-6">SPIS</h2>
      <nav className="flex flex-col gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `px-3 py-2 rounded ${
                isActive ? 'bg-green-500 text-slate-900' : 'text-slate-300 hover:bg-slate-700'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar