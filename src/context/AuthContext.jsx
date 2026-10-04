import { createContext, useContext } from "react";
import usePersistentState from "../hooks/usePersistentState";

const AuthContext = createContext(null);

// never keep the password in the logged-in user object
const toSession = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

export function AuthProvider({ children }) {
  const [users, setUsers] = usePersistentState("spm_users", []);
  const [currentUser, setCurrentUser] = usePersistentState("spm_current_user", null);

  const signup = ({ name, email, password, role }) => {
    const cleanEmail = email.trim().toLowerCase();
    if (users.some((u) => u.email === cleanEmail)) {
      return { ok: false, error: "An account with this email already exists." };
    }
    const user = { id: Date.now(), name: name.trim(), email: cleanEmail, password, role };
    setUsers([...users, user]);
    setCurrentUser(toSession(user));
    return { ok: true };
  };

  const login = (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email === cleanEmail && u.password === password);
    if (!user) return { ok: false, error: "Wrong email or password." };
    setCurrentUser(toSession(user));
    return { ok: true };
  };

  const logout = () => setCurrentUser(null);

  const resetPassword = (email, newPassword) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!users.some((u) => u.email === cleanEmail)) {
      return { ok: false, error: "No account found with this email." };
    }
    setUsers(users.map((u) => (u.email === cleanEmail ? { ...u, password: newPassword } : u)));
    return { ok: true };
  };

  return (
    <AuthContext.Provider value={{ currentUser, signup, login, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}