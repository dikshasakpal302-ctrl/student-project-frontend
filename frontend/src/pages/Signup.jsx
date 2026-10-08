import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";

const inputClass =
  "w-full rounded bg-slate-700 border border-slate-600 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500";

const ROLES = [
  { key: "student", label: "Student", text: "Create projects and manage tasks" },
  { key: "mentor", label: "Mentor", text: "Review projects and give feedback" },
];

export default function Signup() {
  const { currentUser, signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    role: "student",
  });
  const [error, setError] = useState("");

  if (currentUser) return <Navigate to="/" replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    const result = signup(form);
    if (result.ok) navigate("/");
    else setError(result.error);
  };

  return (
    <AuthLayout title="Create account" subtitle="Choose your role and sign up.">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map((r) => (
            <button
              type="button"
              key={r.key}
              onClick={() => setForm({ ...form, role: r.key })}
              className={`text-left rounded p-3 border ${
                form.role === r.key
                  ? "border-blue-500 bg-slate-700"
                  : "border-slate-600 hover:bg-slate-700"
              }`}
            >
              <p className="font-medium">{r.label}</p>
              <p className="text-xs text-slate-300 mt-1">{r.text}</p>
            </button>
          ))}
        </div>

        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Full name"
          required
          className={inputClass}
        />
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          required
          className={inputClass}
        />
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Password (min 6 characters)"
          required
          className={inputClass}
        />
        <input
          name="confirm"
          type="password"
          value={form.confirm}
          onChange={handleChange}
          placeholder="Confirm password"
          required
          className={inputClass}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          className="w-full rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 font-medium"
        >
          Sign up
        </button>
      </form>

      <p className="text-sm mt-4 text-slate-300">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-400 hover:text-blue-300">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}