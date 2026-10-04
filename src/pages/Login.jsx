import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";

const inputClass =
  "w-full rounded bg-slate-700 border border-slate-600 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500";

export default function Login() {
  const { currentUser, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  if (currentUser) return <Navigate to="/" replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = login(form.email, form.password);
    if (result.ok) navigate("/");
    else setError(result.error);
  };

  return (
    <AuthLayout title="Log in" subtitle="Welcome back. Enter your details to continue.">
      <form onSubmit={handleSubmit} className="space-y-3">
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
          placeholder="Password"
          required
          className={inputClass}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          className="w-full rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 font-medium"
        >
          Log in
        </button>
      </form>

      <div className="flex justify-between text-sm mt-4">
        <Link to="/forgot-password" className="text-blue-400 hover:text-blue-300">
          Forgot password?
        </Link>
        <Link to="/signup" className="text-blue-400 hover:text-blue-300">
          Create an account
        </Link>
      </div>
    </AuthLayout>
  );
}