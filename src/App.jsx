import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import Projects from './pages/Projects'
import TaskBoard from './pages/TaskBoard'
import TaskViews from './pages/TaskViews'
import Milestones from './pages/Milestones'
import Workload from './pages/Workload'
import Dashboard from './pages/Dashboard'
import Team from './pages/Team'
import Documents from './pages/Documents'
import Reports from './pages/Reports'
import Mentor from './pages/Mentor'
import { AuthProvider } from './context/AuthContext'
import { TasksProvider } from './context/TasksContext'
import { ProjectsProvider } from './context/ProjectsContext'
import { AppDataProvider } from './context/AppDataContext'
import { MilestonesProvider } from './context/MilestonesContext'

function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <ProjectsProvider>
          <MilestonesProvider>
            <TasksProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />

                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/tasks" element={<TaskBoard />} />
                      <Route path="/task-views" element={<TaskViews />} />
                      <Route path="/milestones" element={<Milestones />} />
                      <Route path="/workload" element={<Workload />} />
                      <Route path="/team" element={<Team />} />
                      <Route path="/mentor" element={<Mentor />} />
                      <Route path="/documents" element={<Documents />} />
                      <Route path="/reports" element={<Reports />} />
                    </Route>
                  </Route>
                </Routes>
              </BrowserRouter>
            </TasksProvider>
          </MilestonesProvider>
        </ProjectsProvider>
      </AppDataProvider>
    </AuthProvider>
  )
}

export default App