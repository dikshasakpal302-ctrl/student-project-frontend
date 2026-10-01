import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import PagePlaceholder from './components/PagePlaceholder'
import Projects from './pages/Projects'
import TaskBoard from './pages/TaskBoard'
import Dashboard from './pages/Dashboard'
import { TasksProvider } from './context/TasksContext'

function App() {
  return (
    <TasksProvider>
      <BrowserRouter>
        <div className="flex min-h-screen bg-slate-900 text-white">
          <Sidebar />
          <main className="flex-1 p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/tasks" element={<TaskBoard />} />
              <Route path="/team" element={<PagePlaceholder title="Team" />} />
              <Route path="/mentor" element={<PagePlaceholder title="Mentor Portal" />} />
              <Route path="/documents" element={<PagePlaceholder title="Documents" />} />
              <Route path="/reports" element={<PagePlaceholder title="Reports" />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TasksProvider>
  )
}

export default App