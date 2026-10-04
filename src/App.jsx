import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import Projects from './pages/Projects'
import TaskBoard from './pages/TaskBoard'
import Dashboard from './pages/Dashboard'
import Team from './pages/Team'
import Documents from './pages/Documents'
import Reports from './pages/Reports'
import Mentor from './pages/Mentor'
import { AuthProvider } from './context/AuthContext'
import { TasksProvider } from './context/TasksContext'
import { ProjectsProvider } from './context/ProjectsContext'
import { AppDataProvider } from './context/AppDataContext'

function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <ProjectsProvider>
          <TasksProvider>
            <BrowserRouter>
              <Routes>
                {/* Public pages */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Pages that need login */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/tasks" element={<TaskBoard />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/mentor" element={<Mentor />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/reports" element={<Reports />} />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
          </TasksProvider>
        </ProjectsProvider>
      </AppDataProvider>
    </AuthProvider>
  )
}

export default App