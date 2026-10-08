import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-end gap-3 px-8 py-3 border-b border-slate-800">
          <div className="text-right">
            <p className="text-sm font-medium">{currentUser.name}</p>
            <p className="text-xs text-slate-300 capitalize">{currentUser.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm rounded bg-slate-700 hover:bg-slate-600 px-3 py-1"
          >
            Logout
          </button>
        </header>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}