import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Projects from './pages/Projects'
import TaskBoard from './pages/TaskBoard'
import Dashboard from './pages/Dashboard'
import Team from './pages/Team'
import Documents from './pages/Documents'
import Reports from './pages/Reports'
import Mentor from './pages/Mentor'
import { TasksProvider } from './context/TasksContext'
import { ProjectsProvider } from './context/ProjectsContext'
import { AppDataProvider } from './context/AppDataContext'

function App() {
  return (
    <AppDataProvider>
      <ProjectsProvider>
        <TasksProvider>
          <BrowserRouter>
            <div className="flex min-h-screen bg-slate-900 text-white">
              <Sidebar />
              <main className="flex-1 p-8">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/tasks" element={<TaskBoard />} />
                  <Route path="/team" element={<Team />} />
                  <Route path="/mentor" element={<Mentor />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/reports" element={<Reports />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </TasksProvider>
      </ProjectsProvider>
    </AppDataProvider>
  )
}

export default App